import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import type { ScorePoint } from '../../types';
import { candidateThreshold, scoreGaze } from '../gazeScoring';
import { laplacianVariance, normalizeSharpness } from '../sharpness';
import { PeakTracker } from '../peakTracker';
import { extractGazeFeatures } from './features';
import type { CandidatePayload, EngineConfig } from './messages';

export type PipelineEvent =
  | { type: 'points'; points: ScorePoint[] }
  | { type: 'candidate'; candidate: CandidatePayload };

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

const POINT_BATCH_SIZE = 40;
const SHARPNESS_WIDTH = 192;
const THUMB_WIDTH = 320;

const createCanvas = (width: number, height: number): AnyCanvas => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const get2dContext = (canvas: AnyCanvas, willReadFrequently = false) => {
  const context = canvas.getContext('2d', { willReadFrequently }) as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D
    | null;
  if (!context) {
    throw new Error('Canvasコンテキストを取得できませんでした。');
  }
  return context;
};

const canvasToBlob = (canvas: AnyCanvas, type: string, quality: number): Promise<Blob> => {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('画像のエンコードに失敗しました。'));
      }
    }, type, quality);
  });
};

/**
 * デコード済みフレームを受け取り、スコアリング・ピーク追跡・候補画像の生成を行う。
 * WebCodecsエンジン（Worker内）とシークエンジン（メインスレッド）の両方が使う。
 */
export class FramePipeline {
  private readonly config: EngineConfig;
  private readonly emit: (event: PipelineEvent) => void;
  private readonly width: number;
  private readonly height: number;
  private readonly tracker: PeakTracker;
  private readonly exitThreshold: number;
  private readonly sharpnessCanvas: AnyCanvas;
  private readonly sharpnessContext: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
  private readonly sharpnessHeight: number;
  private snapshotCanvas: AnyCanvas | null = null;
  private thumbCanvas: AnyCanvas | null = null;
  private pendingPoints: ScorePoint[] = [];
  private finalizeChain: Promise<void> = Promise.resolve();
  private finalizeError: Error | null = null;
  private candidateSerial = 0;

  constructor(
    config: EngineConfig,
    width: number,
    height: number,
    emit: (event: PipelineEvent) => void,
  ) {
    this.config = config;
    this.emit = emit;
    this.width = width;
    this.height = height;

    const threshold = candidateThreshold(config.sensitivity);
    this.exitThreshold = Math.max(0.1, threshold - 0.07);
    this.tracker = new PeakTracker({
      enterThreshold: threshold,
      exitThreshold: this.exitThreshold,
      closeDelaySeconds: 0.5,
      minGapSeconds: 1.2,
      sharpnessWeight: 0.15,
    });

    this.sharpnessHeight = Math.max(3, Math.round((SHARPNESS_WIDTH * height) / width));
    this.sharpnessCanvas = createCanvas(SHARPNESS_WIDTH, this.sharpnessHeight);
    this.sharpnessContext = get2dContext(this.sharpnessCanvas, true);
  }

  /** 高スコア領域内かどうか。エンジンはこれを見てサンプリング密度を上げる。 */
  get isHot(): boolean {
    return this.tracker.isActive;
  }

  private measureSharpness(source: CanvasImageSource): number {
    this.sharpnessContext.drawImage(source, 0, 0, SHARPNESS_WIDTH, this.sharpnessHeight);
    const imageData = this.sharpnessContext.getImageData(
      0, 0, SHARPNESS_WIDTH, this.sharpnessHeight,
    );
    return normalizeSharpness(
      laplacianVariance(imageData.data, SHARPNESS_WIDTH, this.sharpnessHeight),
    );
  }

  private flushPoints(): void {
    if (this.pendingPoints.length > 0) {
      this.emit({ type: 'points', points: this.pendingPoints });
      this.pendingPoints = [];
    }
  }

  private finalizeCandidate(
    canvas: AnyCanvas,
    info: { time: number; score: number; sharpness: number; replacesPrevious: boolean },
  ): void {
    this.candidateSerial += 1;
    const id = `cand-${this.candidateSerial}-${Math.round(info.time * 1000)}`;
    const mime = this.config.exportFormat === 'png' ? 'image/png' : 'image/jpeg';

    this.finalizeChain = this.finalizeChain.then(async () => {
      const fullBlob = await canvasToBlob(canvas, mime, 0.92);
      const thumbHeight = Math.max(1, Math.round((THUMB_WIDTH * this.height) / this.width));
      // finalizeChainが直列化しているのでサムネイル用canvasは1つを使い回せる
      this.thumbCanvas ??= createCanvas(THUMB_WIDTH, thumbHeight);
      get2dContext(this.thumbCanvas).drawImage(canvas, 0, 0, THUMB_WIDTH, thumbHeight);
      const thumbBlob = await canvasToBlob(this.thumbCanvas, 'image/jpeg', 0.8);

      this.emit({
        type: 'candidate',
        candidate: {
          id,
          time: info.time,
          score: info.score,
          sharpness: info.sharpness,
          width: this.width,
          height: this.height,
          fullBlob,
          thumbBlob,
          replacesPrevious: info.replacesPrevious,
        },
      });
    }).catch((error: unknown) => {
      this.finalizeError ??= error instanceof Error
        ? error
        : new Error('候補画像の生成に失敗しました。');
    });
  }

  /**
   * 1フレームを処理する。sourceは呼び出し中のみ有効でよい
   * （スナップショットは同期的に描き込まれる）。
   */
  process(source: CanvasImageSource, time: number, result: FaceLandmarkerResult): void {
    if (this.finalizeError) {
      throw this.finalizeError;
    }

    const features = extractGazeFeatures(result);
    const { score } = scoreGaze(features, this.config.sensitivity);

    this.pendingPoints.push({ time, score });
    if (this.pendingPoints.length >= POINT_BATCH_SIZE) {
      this.flushPoints();
    }

    // 閾値未満のフレームは候補になり得ないのでシャープネス計算を省く
    const sharpness = score >= this.exitThreshold ? this.measureSharpness(source) : 0;
    const { becameBest, completed } = this.tracker.push({ time, score, sharpness });

    if (completed) {
      if (this.snapshotCanvas) {
        this.finalizeCandidate(this.snapshotCanvas, completed);
        this.snapshotCanvas = null;
      }
    }

    if (becameBest) {
      this.snapshotCanvas ??= createCanvas(this.width, this.height);
      get2dContext(this.snapshotCanvas).drawImage(source, 0, 0, this.width, this.height);
    }
  }

  /** ストリーム終端。進行中の領域を確定し、未送信のイベントをすべて送る。 */
  async finish(): Promise<void> {
    const completed = this.tracker.flush();
    if (completed && this.snapshotCanvas) {
      this.finalizeCandidate(this.snapshotCanvas, completed);
      this.snapshotCanvas = null;
    }
    this.flushPoints();
    await this.finalizeChain;
    if (this.finalizeError) {
      throw this.finalizeError;
    }
  }
}
