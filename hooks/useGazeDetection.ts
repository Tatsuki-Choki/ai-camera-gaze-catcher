import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FaceLandmarker, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import { createFaceLandmarker } from '../services/mediaPipeService';
import { AnalysisStatus, type Screenshot } from '../types';

export const useGazeDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  sensitivity: number,
  onNewScreenshot: (screenshot: Screenshot) => void
) => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.Idle);
  const [progress, setProgress] = useState(0);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameCountRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastTimestampRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const performanceStartRef = useRef<number>(0);
  const timestampCounterRef = useRef<number>(0);

  // Initialize FaceLandmarker
  useEffect(() => {
    const init = async () => {
      try {
        console.log("Starting FaceLandmarker initialization in useGazeDetection");
        setStatus(AnalysisStatus.Initializing);
        faceLandmarkerRef.current = await createFaceLandmarker();
        console.log("FaceLandmarker ready in useGazeDetection");
        setStatus(AnalysisStatus.Idle);
      } catch (e) {
        console.error("Failed to initialize FaceLandmarker in useGazeDetection:", e);
        setStatus(AnalysisStatus.Error);
      }
    };
    init();

    // Create a canvas for drawing frames
    if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus(AnalysisStatus.Idle);
    setProgress(0);
    lastCaptureTimeRef.current = 0;
    frameCountRef.current = 0;
    lastVideoTimeRef.current = -1;
    lastTimestampRef.current = 0;
    timestampCounterRef.current = 0;
    performanceStartRef.current = performance.now();
    if (requestRef.current != null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
    }
    if (progressIntervalRef.current != null) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
    }
  }, []);

  const detectGaze = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.paused || video.ended || !faceLandmarkerRef.current) {
      if(video && video.ended) {
        console.log("Video ended");
        setStatus(AnalysisStatus.Done);
        setProgress(100);
      }
      return;
    }
    
    // Reset timestamp counter if video was seeked or restarted
    if (Math.abs(video.currentTime - lastVideoTimeRef.current) > 1 || video.currentTime < lastVideoTimeRef.current) {
      console.log("Video seeked or restarted, resetting timestamp counter");
      performanceStartRef.current = performance.now() - (video.currentTime * 1000);
      timestampCounterRef.current = 0;
      lastTimestampRef.current = 0;
    }

    // Check if video is ready
    if (video.readyState < 2) {
      console.log("Video not ready, readyState:", video.readyState);
      requestRef.current = requestAnimationFrame(detectGaze);
      return;
    }

    // Always update progress, even if we skip processing
    const newProgress = (video.currentTime / video.duration) * 100;
    setProgress(newProgress);

    try {
      // Only process if video time has changed significantly (skip minor changes)
      const timeDiff = Math.abs(video.currentTime - lastVideoTimeRef.current);
      if (timeDiff < 0.033) { // Skip if less than ~30fps worth of change
        requestRef.current = requestAnimationFrame(detectGaze);
        return;
      }
      
      lastVideoTimeRef.current = video.currentTime;
      
      console.log(`Processing frame at ${video.currentTime.toFixed(2)}s / ${video.duration.toFixed(2)}s (readyState: ${video.readyState}, progress: ${newProgress.toFixed(1)}%)`);
      
      // Use a simple counter for MediaPipe timestamp to ensure monotonic increase
      // Increment by 33333 microseconds (approximately 30fps)
      timestampCounterRef.current += 33333;
      const safeTimestamp = timestampCounterRef.current;
      
      console.log(`Calling detectForVideo - video time: ${video.currentTime.toFixed(3)}s, timestamp: ${safeTimestamp}μs, lastTimestamp: ${lastTimestampRef.current}μs`);
      
      try {
        const results: FaceLandmarkerResult = faceLandmarkerRef.current.detectForVideo(video, safeTimestamp);
        console.log("detectForVideo completed, results:", results ? "Found faces: " + (results.faceLandmarks?.length || 0) : "No results");
        lastTimestampRef.current = safeTimestamp;

    
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blendshapes = results.faceBlendshapes[0].categories;
      
      const gazeThreshold = 0.25 - (sensitivity * 0.2); // Higher sensitivity = lower threshold (stricter)
      const headPoseThreshold = 0.2 - (sensitivity * 0.15);
      
      const eyeLookOutRight = blendshapes.find(c => c.categoryName === 'eyeLookOutRight')?.score ?? 0;
      const eyeLookOutLeft = blendshapes.find(c => c.categoryName === 'eyeLookOutLeft')?.score ?? 0;
      const eyeLookInRight = blendshapes.find(c => c.categoryName === 'eyeLookInRight')?.score ?? 0;
      const eyeLookInLeft = blendshapes.find(c => c.categoryName === 'eyeLookInLeft')?.score ?? 0;
      const eyeLookUp = ((blendshapes.find(c => c.categoryName === 'eyeLookUpRight')?.score ?? 0) + (blendshapes.find(c => c.categoryName === 'eyeLookUpLeft')?.score ?? 0)) / 2;
      const eyeLookDown = ((blendshapes.find(c => c.categoryName === 'eyeLookDownRight')?.score ?? 0) + (blendshapes.find(c => c.categoryName === 'eyeLookDownLeft')?.score ?? 0)) / 2;
      
      const headYaw = blendshapes.find(c => c.categoryName === 'headYaw')?.score ?? 0;
      const headPitch = blendshapes.find(c => c.categoryName === 'headPitch')?.score ?? 0;
      
      const isLookingStraight = 
        eyeLookOutRight < gazeThreshold &&
        eyeLookOutLeft < gazeThreshold &&
        eyeLookInRight < gazeThreshold &&
        eyeLookInLeft < gazeThreshold &&
        eyeLookUp < gazeThreshold &&
        eyeLookDown < gazeThreshold;

      const isHeadFacingForward = Math.abs(headYaw) < headPoseThreshold && Math.abs(headPitch) < headPoseThreshold;

      const cooldown = 1.5; // seconds
      if (isLookingStraight && isHeadFacingForward && video.currentTime > lastCaptureTimeRef.current + cooldown) {
        lastCaptureTimeRef.current = video.currentTime;
        
        const canvas = canvasRef.current;
        if(canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                onNewScreenshot({
                    id: `ss-${Date.now()}`,
                    dataUrl: dataUrl,
                    timestamp: video.currentTime,
                });
            }
        }
      }
    }
      } catch (detectError) {
        console.error("Error in detectForVideo:", detectError);
        // Skip this frame and continue
        requestRef.current = requestAnimationFrame(detectGaze);
        return;
      }
    } catch (error) {
      console.error("Error in detectGaze:", error);
      setStatus(AnalysisStatus.Error);
      return;
    }
    
    requestRef.current = requestAnimationFrame(detectGaze);
  }, [videoRef, sensitivity, onNewScreenshot]);

  const startAnalysis = useCallback(() => {
    const video = videoRef.current;
    console.log("startAnalysis called", {
      hasVideo: !!video,
      hasFaceLandmarker: !!faceLandmarkerRef.current,
      currentStatus: status
    });
    
    if (!video) {
      console.error("No video element");
      return;
    }
    
    if (!faceLandmarkerRef.current) {
      console.log("FaceLandmarker not ready, retrying in 500ms...");
      setTimeout(() => startAnalysis(), 500); // Retry if model not ready
      return;
    }
    
    reset();
    setStatus(AnalysisStatus.Processing);
    
    // Reset performance timer and timestamp for this analysis session
    performanceStartRef.current = performance.now();
    timestampCounterRef.current = 0;
    lastTimestampRef.current = 0;
    
    // Wait for video to be ready
    const waitForVideo = () => {
      if (video.readyState >= 2) {
        console.log("Video ready, starting playback");
        video.currentTime = 0;
        video.play().then(() => {
          console.log("Video started playing");
          // Start processing after a short delay to ensure video is really playing
          // Set playback rate to ensure smooth progress
          video.playbackRate = 1.0;
          
          // Also start a separate interval to update progress more frequently
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          progressIntervalRef.current = setInterval(() => {
            if (video && !video.paused && !video.ended) {
              const progress = (video.currentTime / video.duration) * 100;
              setProgress(progress);
              console.log(`Progress update: ${progress.toFixed(1)}%`);
            } else if (video && video.ended) {
              if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
              }
            }
          }, 100); // Update every 100ms
          
          setTimeout(() => {
            requestRef.current = requestAnimationFrame(detectGaze);
          }, 100);
        }).catch((e: Error) => {
          console.error("Video play failed:", e);
          setStatus(AnalysisStatus.Error);
        });
      } else {
        console.log("Waiting for video to be ready...");
        setTimeout(waitForVideo, 100);
      }
    };
    
    waitForVideo();
  }, [reset, detectGaze, videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current != null) {
        cancelAnimationFrame(requestRef.current);
      }
      if (progressIntervalRef.current != null) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return { status, progress, startAnalysis, reset };
};
