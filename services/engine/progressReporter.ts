import type { WorkerResponse } from './messages';

const PROGRESS_INTERVAL_MS = 250;

/**
 * 進捗とETA（処理レートからの線形推定）を計算してprogressイベントを発火する。
 * 両エンジン（WebCodecs / シーク）が共用する。
 */
export const createProgressReporter = (
  durationSeconds: number,
  emit: (event: WorkerResponse) => void,
) => {
  const startedAt = performance.now();
  let lastReportAt = 0;

  return (processedTime: number, force = false): void => {
    const now = performance.now();
    if (!force && now - lastReportAt < PROGRESS_INTERVAL_MS) {
      return;
    }
    lastReportAt = now;
    const wallSeconds = (now - startedAt) / 1000;
    const rate = processedTime / Math.max(wallSeconds, 0.001);
    emit({
      type: 'progress',
      progress: {
        percent: Math.min(100, (processedTime / durationSeconds) * 100),
        etaSeconds: rate > 0.01
          ? Math.max(0, (durationSeconds - processedTime) / rate)
          : null,
      },
    });
  };
};
