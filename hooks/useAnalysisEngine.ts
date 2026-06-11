import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnalysisStatus,
  type EngineKind,
  type ExportFormat,
  type ScanMode,
  type ScorePoint,
  type Screenshot,
} from '../types';
import type {
  CandidatePayload,
  EngineConfig,
  ProgressInfo,
  WorkerRequest,
  WorkerResponse,
} from '../services/engine/messages';
import { runSeekAnalysis, type RunningAnalysis } from '../services/engine/seekEngine';

interface UseAnalysisEngineOptions {
  sensitivity: number;
  scanMode: ScanMode;
  exportFormat: ExportFormat;
  onCandidate: (screenshot: Screenshot, replacesId: string | null) => void;
}

const canUseWebCodecs = (file: File): boolean => (
  typeof VideoDecoder !== 'undefined' &&
  typeof Worker !== 'undefined' &&
  (file.type === 'video/mp4' || file.type === 'video/quicktime')
);

const toScreenshot = (candidate: CandidatePayload): Screenshot => ({
  id: candidate.id,
  time: candidate.time,
  score: candidate.score,
  sharpness: candidate.sharpness,
  width: candidate.width,
  height: candidate.height,
  fullBlob: candidate.fullBlob,
  thumbUrl: URL.createObjectURL(candidate.thumbBlob),
  selected: false,
});

export const useAnalysisEngine = ({
  sensitivity,
  scanMode,
  exportFormat,
  onCandidate,
}: UseAnalysisEngineOptions) => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.Idle);
  const [progress, setProgress] = useState<ProgressInfo>({ percent: 0, etaSeconds: null });
  const [engineKind, setEngineKind] = useState<EngineKind | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<ScorePoint[]>([]);

  const workerRef = useRef<Worker | null>(null);
  const seekRunRef = useRef<RunningAnalysis | null>(null);
  const runTokenRef = useRef(0);
  const lastCandidateIdRef = useRef<string | null>(null);
  const onCandidateRef = useRef(onCandidate);
  onCandidateRef.current = onCandidate;

  const stopEngines = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    if (seekRunRef.current) {
      seekRunRef.current.cancel();
      seekRunRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    runTokenRef.current += 1;
    stopEngines();
  }, [stopEngines]);

  const handleEvent = useCallback((token: number, event: WorkerResponse, runSeekFallback?: () => void) => {
    if (token !== runTokenRef.current) {
      return;
    }

    switch (event.type) {
      case 'progress':
        setStatus(AnalysisStatus.Processing);
        setProgress(event.progress);
        break;
      case 'points':
        setStatus(AnalysisStatus.Processing);
        setTimeline((prev) => [...prev, ...event.points]);
        break;
      case 'candidate': {
        const replacesId = event.candidate.replacesPrevious ? lastCandidateIdRef.current : null;
        const screenshot = toScreenshot(event.candidate);
        lastCandidateIdRef.current = screenshot.id;
        onCandidateRef.current(screenshot, replacesId);
        break;
      }
      case 'done':
        setProgress((prev) => ({ ...prev, percent: 100, etaSeconds: 0 }));
        setStatus(AnalysisStatus.Done);
        stopEngines();
        break;
      case 'canceled':
        setStatus(AnalysisStatus.Canceled);
        break;
      case 'error':
        if (runSeekFallback) {
          runSeekFallback();
        } else {
          setErrorMessage(event.message);
          setStatus(AnalysisStatus.Error);
        }
        break;
      default:
        break;
    }
  }, [stopEngines]);

  const startAnalysis = useCallback((file: File) => {
    runTokenRef.current += 1;
    const token = runTokenRef.current;
    stopEngines();

    lastCandidateIdRef.current = null;
    setTimeline([]);
    setProgress({ percent: 0, etaSeconds: null });
    setErrorMessage(null);
    setStatus(AnalysisStatus.Initializing);

    const config: EngineConfig = { sensitivity, scanMode, exportFormat };

    const startSeek = () => {
      if (token !== runTokenRef.current) {
        return;
      }
      setEngineKind('seek');
      setTimeline([]);
      setProgress({ percent: 0, etaSeconds: null });
      lastCandidateIdRef.current = null;
      seekRunRef.current = runSeekAnalysis(file, config, (event) => {
        handleEvent(token, event);
      });
    };

    if (canUseWebCodecs(file)) {
      setEngineKind('webcodecs');
      const worker = new Worker(
        new URL('../workers/analysis.worker.ts', import.meta.url),
        { type: 'module' },
      );
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        handleEvent(token, event.data, () => {
          // WebCodecsで失敗したらシーク方式でやり直す
          worker.terminate();
          if (workerRef.current === worker) {
            workerRef.current = null;
          }
          startSeek();
        });
      };
      worker.onerror = () => {
        worker.terminate();
        if (workerRef.current === worker) {
          workerRef.current = null;
        }
        startSeek();
      };

      const request: WorkerRequest = { type: 'start', file, config };
      worker.postMessage(request);
    } else {
      startSeek();
    }
  }, [exportFormat, handleEvent, scanMode, sensitivity, stopEngines]);

  const cancelAnalysis = useCallback(() => {
    if (workerRef.current) {
      const request: WorkerRequest = { type: 'cancel' };
      workerRef.current.postMessage(request);
    }
    if (seekRunRef.current) {
      seekRunRef.current.cancel();
    }
    setStatus(AnalysisStatus.Canceled);
  }, []);

  const reset = useCallback(() => {
    runTokenRef.current += 1;
    stopEngines();
    lastCandidateIdRef.current = null;
    setTimeline([]);
    setProgress({ percent: 0, etaSeconds: null });
    setErrorMessage(null);
    setEngineKind(null);
    setStatus(AnalysisStatus.Idle);
  }, [stopEngines]);

  return {
    status,
    progress,
    engineKind,
    errorMessage,
    timeline,
    startAnalysis,
    cancelAnalysis,
    reset,
  };
};
