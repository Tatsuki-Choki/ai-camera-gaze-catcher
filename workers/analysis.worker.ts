import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { createFaceLandmarker } from '../services/mediaPipeService';
import { demuxMp4 } from '../services/engine/mp4Demuxer';
import { FramePipeline } from '../services/engine/framePipeline';
import {
  denseIntervalFor,
  scanIntervals,
  type EngineConfig,
  type WorkerRequest,
  type WorkerResponse,
} from '../services/engine/messages';

const ctx = self as unknown as {
  postMessage: (message: WorkerResponse) => void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

const MAX_DECODE_QUEUE = 20;
const PROGRESS_INTERVAL_MS = 250;

let canceled = false;

const waitForQueue = (decoder: VideoDecoder, max: number): Promise<void> => (
  new Promise((resolve) => {
    if (decoder.decodeQueueSize <= max) {
      resolve();
      return;
    }
    const listener = () => {
      if (decoder.decodeQueueSize <= max) {
        decoder.removeEventListener('dequeue', listener);
        resolve();
      }
    };
    decoder.addEventListener('dequeue', listener);
  })
);

const run = async (file: File, config: EngineConfig): Promise<void> => {
  let landmarker: FaceLandmarker;
  let demuxed: Awaited<ReturnType<typeof demuxMp4>>;

  try {
    if (typeof VideoDecoder === 'undefined') {
      throw new Error('WebCodecsが利用できません。');
    }
    landmarker = await createFaceLandmarker();
    demuxed = await demuxMp4(file);

    const { supported } = await VideoDecoder.isConfigSupported(demuxed.decoderConfig);
    if (!supported) {
      throw new Error(`このコーデック（${demuxed.decoderConfig.codec}）はWebCodecsでデコードできません。`);
    }
  } catch (error) {
    ctx.postMessage({
      type: 'error',
      phase: 'init',
      message: error instanceof Error ? error.message : '解析エンジンの初期化に失敗しました。',
    });
    return;
  }

  const { durationSeconds, width, height, chunks } = demuxed;
  const baseInterval = scanIntervals[config.scanMode];
  const denseInterval = denseIntervalFor(config.scanMode);

  const pipeline = new FramePipeline(config, width, height, (event) => {
    ctx.postMessage(event);
  });

  let lastSampledTime = -Infinity;
  let lastDetectMs = -1;
  let processedTime = 0;
  let decodeError: Error | null = null;

  const startedAt = performance.now();
  let lastProgressAt = 0;

  const reportProgress = (force = false) => {
    const now = performance.now();
    if (!force && now - lastProgressAt < PROGRESS_INTERVAL_MS) {
      return;
    }
    lastProgressAt = now;
    const wallSeconds = (now - startedAt) / 1000;
    const rate = processedTime / Math.max(wallSeconds, 0.001);
    const etaSeconds = rate > 0.01
      ? Math.max(0, (durationSeconds - processedTime) / rate)
      : null;
    ctx.postMessage({
      type: 'progress',
      progress: {
        percent: Math.min(100, (processedTime / durationSeconds) * 100),
        etaSeconds,
      },
    });
  };

  const processFrame = (frame: VideoFrame) => {
    try {
      if (canceled || decodeError) {
        return;
      }
      const time = frame.timestamp / 1e6;
      processedTime = Math.max(processedTime, time);

      const interval = pipeline.isHot ? denseInterval : baseInterval;
      if (time - lastSampledTime >= interval - 1e-4) {
        lastSampledTime = time;
        const detectMs = Math.max(lastDetectMs + 1, Math.round(time * 1000));
        lastDetectMs = detectMs;
        const result = landmarker.detectForVideo(frame, detectMs);
        pipeline.process(frame, time, result);
      }
      reportProgress();
    } catch (error) {
      decodeError = error instanceof Error ? error : new Error('フレーム処理に失敗しました。');
    } finally {
      frame.close();
    }
  };

  const decoder = new VideoDecoder({
    output: processFrame,
    error: (error) => {
      decodeError ??= new Error(`デコードに失敗しました: ${error.message}`);
    },
  });

  try {
    decoder.configure(demuxed.decoderConfig);

    for await (const chunk of chunks) {
      if (canceled || decodeError) {
        break;
      }
      decoder.decode(chunk);
      await waitForQueue(decoder, MAX_DECODE_QUEUE);
    }

    if (!canceled && !decodeError) {
      await decoder.flush();
    }

    if (decodeError) {
      throw decodeError;
    }

    if (canceled) {
      ctx.postMessage({ type: 'canceled' });
      return;
    }

    await pipeline.finish();
    processedTime = durationSeconds;
    reportProgress(true);
    ctx.postMessage({ type: 'done' });
  } catch (error) {
    ctx.postMessage({
      type: 'error',
      phase: 'process',
      message: error instanceof Error ? error.message : '解析中にエラーが発生しました。',
    });
  } finally {
    try {
      if (decoder.state !== 'closed') {
        decoder.close();
      }
    } catch {
      // すでに閉じている場合は無視
    }
  }
};

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  if (message.type === 'start') {
    canceled = false;
    void run(message.file, message.config);
  } else if (message.type === 'cancel') {
    canceled = true;
  }
};
