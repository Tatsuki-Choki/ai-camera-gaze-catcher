import { createFaceLandmarker } from '../mediaPipeService';
import { FramePipeline } from './framePipeline';
import {
  denseIntervalFor,
  scanIntervals,
  type EngineConfig,
  type WorkerResponse,
} from './messages';

const PROGRESS_INTERVAL_MS = 250;
const SEEK_TIMEOUT_MS = 3000;

const waitForMetadata = (video: HTMLVideoElement): Promise<void> => (
  new Promise((resolve, reject) => {
    if (Number.isFinite(video.duration) && video.videoWidth > 0 && video.readyState >= 2) {
      resolve();
      return;
    }
    const cleanup = () => {
      video.removeEventListener('loadeddata', handleLoaded);
      video.removeEventListener('error', handleError);
    };
    const handleLoaded = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error('動画を読み込めませんでした。形式が対応しているか確認してください。'));
    };
    video.addEventListener('loadeddata', handleLoaded, { once: true });
    video.addEventListener('error', handleError, { once: true });
    video.load();
  })
);

/** シーク完了を待つ。タイムアウトしたらfalseを返し、そのフレームは解析しない。 */
const seekTo = (video: HTMLVideoElement, time: number): Promise<boolean> => (
  new Promise((resolve) => {
    const targetTime = Math.min(time, Math.max(0, video.duration - 0.001));
    if (Math.abs(video.currentTime - targetTime) < 0.001 && video.readyState >= 2) {
      resolve(true);
      return;
    }
    const timeoutId = window.setTimeout(() => {
      video.removeEventListener('seeked', handleSeeked);
      resolve(false);
    }, SEEK_TIMEOUT_MS);
    const handleSeeked = () => {
      window.clearTimeout(timeoutId);
      resolve(true);
    };
    video.addEventListener('seeked', handleSeeked, { once: true });
    video.currentTime = targetTime;
  })
);

export interface RunningAnalysis {
  cancel: () => void;
}

/**
 * WebCodecsが使えない環境・形式向けのフォールバック。
 * 非表示のvideo要素を使うため、表示中のプレイヤーは解析中も自由に操作できる。
 */
export const runSeekAnalysis = (
  file: File,
  config: EngineConfig,
  onEvent: (event: WorkerResponse) => void,
): RunningAnalysis => {
  let canceled = false;

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  const cleanup = () => {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  };

  void (async () => {
    try {
      const landmarker = await createFaceLandmarker();
      await waitForMetadata(video);

      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;
      const baseInterval = scanIntervals[config.scanMode];
      const denseInterval = denseIntervalFor(config.scanMode);

      const pipeline = new FramePipeline(config, width, height, onEvent);

      let lastDetectMs = -1;
      const startedAt = performance.now();
      let lastProgressAt = 0;

      const reportProgress = (processedTime: number, force = false) => {
        const now = performance.now();
        if (!force && now - lastProgressAt < PROGRESS_INTERVAL_MS) {
          return;
        }
        lastProgressAt = now;
        const wallSeconds = (now - startedAt) / 1000;
        const rate = processedTime / Math.max(wallSeconds, 0.001);
        onEvent({
          type: 'progress',
          progress: {
            percent: Math.min(100, (processedTime / duration) * 100),
            etaSeconds: rate > 0.01 ? Math.max(0, (duration - processedTime) / rate) : null,
          },
        });
      };

      let time = 0;
      while (time <= duration) {
        if (canceled) {
          onEvent({ type: 'canceled' });
          return;
        }

        const seeked = await seekTo(video, time);
        if (canceled) {
          onEvent({ type: 'canceled' });
          return;
        }

        if (seeked) {
          const detectMs = Math.max(lastDetectMs + 1, Math.round(time * 1000));
          lastDetectMs = detectMs;
          const result = landmarker.detectForVideo(video, detectMs);
          pipeline.process(video, time, result);
        }

        reportProgress(time);
        time += pipeline.isHot ? denseInterval : baseInterval;
        // UIを固めないために毎フレーム制御を返す
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      await pipeline.finish();
      reportProgress(duration, true);
      onEvent({ type: 'done' });
    } catch (error) {
      onEvent({
        type: 'error',
        phase: 'process',
        message: error instanceof Error ? error.message : '解析中にエラーが発生しました。',
      });
    } finally {
      cleanup();
    }
  })();

  return {
    cancel: () => {
      canceled = true;
    },
  };
};
