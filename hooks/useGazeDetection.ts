import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Matrix } from '@mediapipe/tasks-vision';
import { createFaceLandmarker, getBlendshapeScore } from '../services/mediaPipeService';
import { scoreGaze } from '../services/gazeScoring';
import { AnalysisStatus, type GazeScoreInput, type ScanMode, type Screenshot } from '../types';

const scanIntervals: Record<ScanMode, number> = {
  fast: 1,
  standard: 0.5,
  precise: 0.25,
};

const duplicateWindowSeconds = 1.5;

const waitForMetadata = (video: HTMLVideoElement): Promise<void> => {
  if (Number.isFinite(video.duration) && video.videoWidth > 0 && video.readyState >= 2) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
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
      reject(new Error('動画を読み込めませんでした。'));
    };

    video.addEventListener('loadeddata', handleLoaded, { once: true });
    video.addEventListener('error', handleError, { once: true });
    video.load();
  });
};

const seekTo = (video: HTMLVideoElement, time: number): Promise<void> => (
  new Promise((resolve) => {
    const targetTime = Math.min(time, Math.max(0, video.duration - 0.001));
    if (Math.abs(video.currentTime - targetTime) < 0.001 && video.readyState >= 2) {
      resolve();
      return;
    }

    const timeoutId = window.setTimeout(resolve, 1200);
    const handleSeeked = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };

    video.addEventListener('seeked', handleSeeked, { once: true });
    video.currentTime = targetTime;
  })
);

const captureFrame = (video: HTMLVideoElement, canvas: HTMLCanvasElement): string => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('画像生成に失敗しました。');
  }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.92);
};

const getHeadPose = (matrix: Matrix | undefined) => {
  const data = matrix?.data ?? [];
  if (data.length < 11) {
    return { yaw: 0, pitch: 0, roll: 0 };
  }

  const yaw = Math.atan2(data[8], data[10]);
  const pitch = Math.atan2(-data[9], Math.hypot(data[8], data[10]));
  const roll = Math.atan2(data[4], data[0]);

  return { yaw, pitch, roll };
};

export const useGazeDetection = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  sensitivity: number,
  scanMode: ScanMode,
  onCandidate: (screenshot: Screenshot) => void,
) => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.Idle);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canceledRef = useRef(false);
  const runIdRef = useRef(0);
  const latestCandidateRef = useRef<Screenshot | null>(null);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setStatus(AnalysisStatus.Initializing);
        await createFaceLandmarker();
        if (mounted) {
          setStatus(AnalysisStatus.Idle);
        }
      } catch {
        if (mounted) {
          setStatus(AnalysisStatus.Error);
        }
      }
    };

    canvasRef.current = document.createElement('canvas');
    void initialize();

    return () => {
      mounted = false;
      canceledRef.current = true;
      runIdRef.current += 1;
    };
  }, []);

  const reset = useCallback(() => {
    canceledRef.current = true;
    runIdRef.current += 1;
    latestCandidateRef.current = null;
    setProgress(0);
    setStatus(AnalysisStatus.Idle);
  }, []);

  const cancelAnalysis = useCallback(() => {
    canceledRef.current = true;
    runIdRef.current += 1;
    setStatus(AnalysisStatus.Canceled);
  }, []);

  const startAnalysis = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setStatus(AnalysisStatus.Error);
      return;
    }

    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    canceledRef.current = false;
    latestCandidateRef.current = null;
    setProgress(0);
    setStatus(AnalysisStatus.Processing);

    try {
      await waitForMetadata(video);
      const landmarker = await createFaceLandmarker();
      const duration = video.duration;
      const interval = scanIntervals[scanMode];

      video.pause();

      for (let time = 0; time <= duration; time += interval) {
        if (canceledRef.current || runIdRef.current !== runId) {
          setStatus(AnalysisStatus.Canceled);
          return;
        }

        await seekTo(video, time);

        if (canceledRef.current || runIdRef.current !== runId) {
          setStatus(AnalysisStatus.Canceled);
          return;
        }

        const result = landmarker.detectForVideo(video, Math.round(time * 1000));
        const hasFace = (result.faceLandmarks?.length ?? 0) > 0;
        const headPose = getHeadPose(result.facialTransformationMatrixes?.[0]);
        const gazeInput: GazeScoreInput = {
          hasFace,
          eyeLookOutLeft: getBlendshapeScore(result, 'eyeLookOutLeft'),
          eyeLookOutRight: getBlendshapeScore(result, 'eyeLookOutRight'),
          eyeLookInLeft: getBlendshapeScore(result, 'eyeLookInLeft'),
          eyeLookInRight: getBlendshapeScore(result, 'eyeLookInRight'),
          eyeLookUpLeft: getBlendshapeScore(result, 'eyeLookUpLeft'),
          eyeLookUpRight: getBlendshapeScore(result, 'eyeLookUpRight'),
          eyeLookDownLeft: getBlendshapeScore(result, 'eyeLookDownLeft'),
          eyeLookDownRight: getBlendshapeScore(result, 'eyeLookDownRight'),
          headYaw: headPose.yaw,
          headPitch: headPose.pitch,
          headRoll: headPose.roll,
        };
        const score = scoreGaze(gazeInput, sensitivity);

        if (score.isCandidate) {
          const latest = latestCandidateRef.current;
          const shouldReplace =
            latest && Math.abs(time - latest.timestamp) <= duplicateWindowSeconds && score.score > latest.score;
          const shouldAdd = !latest || Math.abs(time - latest.timestamp) > duplicateWindowSeconds;

          if (shouldReplace || shouldAdd) {
            const screenshot: Screenshot = {
              id: shouldReplace && latest ? latest.id : `ss-${Math.round(time * 1000)}`,
              dataUrl: captureFrame(video, canvas),
              timestamp: time,
              score: score.score,
              selected: shouldAdd,
            };
            latestCandidateRef.current = screenshot;
            onCandidate(screenshot);
          }
        }

        setProgress(Math.min(100, (time / duration) * 100));
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      setProgress(100);
      setStatus(AnalysisStatus.Done);
    } catch {
      setStatus(AnalysisStatus.Error);
    }
  }, [onCandidate, scanMode, sensitivity, videoRef]);

  return {
    status,
    progress,
    startAnalysis,
    cancelAnalysis,
    reset,
  };
};
