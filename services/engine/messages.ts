import type { ExportFormat, ScanMode, ScorePoint } from '../../types';

export interface EngineConfig {
  sensitivity: number;
  scanMode: ScanMode;
  exportFormat: ExportFormat;
}

export interface CandidatePayload {
  id: string;
  time: number;
  score: number;
  sharpness: number;
  width: number;
  height: number;
  fullBlob: Blob;
  thumbBlob: Blob;
  /** trueなら直前に出力した候補をこの候補で置き換える */
  replacesPrevious: boolean;
}

export interface ProgressInfo {
  percent: number;
  etaSeconds: number | null;
}

export type WorkerRequest =
  | { type: 'start'; file: File; config: EngineConfig }
  | { type: 'cancel' };

export type WorkerResponse =
  | { type: 'progress'; progress: ProgressInfo }
  | { type: 'points'; points: ScorePoint[] }
  | { type: 'candidate'; candidate: CandidatePayload }
  | { type: 'done' }
  | { type: 'canceled' }
  | { type: 'error'; message: string; phase: 'init' | 'process' };

export const scanIntervals: Record<ScanMode, number> = {
  fast: 1,
  standard: 0.5,
  precise: 0.25,
};

/** 高スコア領域内では密にサンプリングしてベストの一瞬を取り逃さない */
export const denseIntervalFor = (scanMode: ScanMode): number => (
  Math.max(scanIntervals[scanMode] / 4, 1 / 30)
);

/** WebCodecsエンジン（Worker + VideoDecoder）が使える形式・環境か */
export const canUseWebCodecs = (file: File): boolean => (
  typeof VideoDecoder !== 'undefined' &&
  typeof Worker !== 'undefined' &&
  (file.type === 'video/mp4' || file.type === 'video/quicktime')
);
