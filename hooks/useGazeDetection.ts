import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AnalysisStatus, type Screenshot, type Rect } from '../types';
import { waitOpenCvReady, loadClassifier, detectFaces, detectEyes } from '../src/services/openCvService';

// OpenCV.jsの型定義は提供されていないため、anyとして扱う
declare const cv: any;

export const useGazeDetection = (
  videoRef: React.RefObject<HTMLVideoElement>,
  sensitivity: number,
  onNewScreenshot: (screenshot: Screenshot) => void
) => {
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.Idle);
  const [progress, setProgress] = useState(0);
  const requestRef = useRef<number | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // OpenCV分類器の参照
  const faceClassifier = useRef<any>(null);
  const eyeClassifier = useRef<any>(null);
  
  // Video processing refs
  const lastVideoTimeRef = useRef<number>(-1);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize OpenCV and load classifiers
  useEffect(() => {
    const init = async () => {
      try {
        console.log("Initializing OpenCV service...");
        setStatus(AnalysisStatus.Initializing);

        await waitOpenCvReady();
        console.log("OpenCV is ready. Loading classifiers...");

        const faceClassifierFile = await loadClassifier('opencv/haarcascade_frontalface_default.xml');
        const eyeClassifierFile = await loadClassifier('opencv/haarcascade_eye.xml');
        
        faceClassifier.current = new cv.CascadeClassifier();
        faceClassifier.current.load(faceClassifierFile);

        eyeClassifier.current = new cv.CascadeClassifier();
        eyeClassifier.current.load(eyeClassifierFile);

        console.log("Classifiers loaded successfully.");
        setStatus(AnalysisStatus.Idle);
      } catch (e) {
        console.error("Failed to initialize OpenCV classifiers:", e);
        setStatus(AnalysisStatus.Error);
      }
    };
    init();

    // Create a canvas for drawing frames
    if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
    }

    // Cleanup classifiers on unmount
    return () => {
        faceClassifier.current?.delete();
        eyeClassifier.current?.delete();
    };
  }, []);

  const reset = useCallback(() => {
    setStatus(AnalysisStatus.Idle);
    setProgress(0);
    lastCaptureTimeRef.current = 0;
    lastVideoTimeRef.current = -1;
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
    if (!video || video.paused || video.ended || !faceClassifier.current || !eyeClassifier.current) {
      if(video && video.ended) {
        console.log("Video ended");
        setStatus(AnalysisStatus.Done);
        setProgress(100);
      }
      return;
    }

    if (video.readyState < 2) {
      requestRef.current = requestAnimationFrame(detectGaze);
      return;
    }
    
    // Always update progress
    const newProgress = (video.currentTime / video.duration) * 100;
    setProgress(newProgress);

    // Skip processing if video time hasn't changed enough
    const timeDiff = Math.abs(video.currentTime - lastVideoTimeRef.current);
    if (timeDiff < 0.066) { // Process at ~15 FPS
      requestRef.current = requestAnimationFrame(detectGaze);
      return;
    }
    lastVideoTimeRef.current = video.currentTime;

    const srcMat = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
    const cap = new cv.VideoCapture(video);
    cap.read(srcMat);

    try {
      const faces = detectFaces(srcMat, faceClassifier.current);

      if (faces.length > 0) {
        // For simplicity, use the largest face found
        const mainFaceRect = faces.sort((a: Rect, b: Rect) => (b.width * b.height) - (a.width * a.height))[0];
        const faceMat = srcMat.roi(mainFaceRect);
        
        const eyes = detectEyes(faceMat, eyeClassifier.current);

        let isLookingAtCamera = false;
        
        // 1. Must detect 2 eyes
        if (eyes.length === 2) {
            const [eye1, eye2] = eyes.sort((a: Rect, b: Rect) => a.x - b.x); // Sort eyes by x position

            // Sensitivity adjustments (higher sensitivity = stricter thresholds)
            const yAlignThreshold = eye1.height * (0.5 - sensitivity * 0.4); // Allow less vertical deviation
            const sizeRatioThreshold = 1.0 - (0.4 - sensitivity * 0.35); // Eyes must be closer in size
            const horizontalCenterThreshold = mainFaceRect.width * (0.2 - sensitivity * 0.18); // Eyes must be more centered

            // 2. Eyes should be horizontally aligned
            const yDiff = Math.abs((eye1.y + eye1.height / 2) - (eye2.y + eye2.height / 2));
            const isYAligned = yDiff < yAlignThreshold;

            // 3. Eyes should be of similar size
            const eye1Area = eye1.width * eye1.height;
            const eye2Area = eye2.width * eye2.height;
            const sizeRatio = Math.min(eye1Area, eye2Area) / Math.max(eye1Area, eye2Area);
            const isSizeSimilar = sizeRatio > sizeRatioThreshold;

            // 4. Eyes should be horizontally centered within the face
            const eyesCenterX = mainFaceRect.x + eye1.x + (eye2.x + eye2.width - eye1.x) / 2;
            const faceCenterX = mainFaceRect.x + mainFaceRect.width / 2;
            const horizontalDiff = Math.abs(eyesCenterX - faceCenterX);
            const isHorizontallyCentered = horizontalDiff < horizontalCenterThreshold;
            
            console.log(`Gaze check: yDiff=${yDiff.toFixed(2)}/${yAlignThreshold.toFixed(2)}, sizeRatio=${sizeRatio.toFixed(2)}/${sizeRatioThreshold.toFixed(2)}, hDiff=${horizontalDiff.toFixed(2)}/${horizontalCenterThreshold.toFixed(2)}`);

            if (isYAligned && isSizeSimilar && isHorizontallyCentered) {
                isLookingAtCamera = true;
            }
        }

        const cooldown = 1.5; // seconds
        if (isLookingAtCamera && video.currentTime > lastCaptureTimeRef.current + cooldown) {
          console.log(`Camera gaze detected at ${video.currentTime.toFixed(2)}s`);
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
        faceMat.delete();
      }
    } catch (error) {
      console.error("Error in OpenCV detection:", error);
    } finally {
      srcMat.delete();
    }
    
    requestRef.current = requestAnimationFrame(detectGaze);
  }, [videoRef, sensitivity, onNewScreenshot]);

  const startAnalysis = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      console.error("No video element");
      return;
    }
    if (!faceClassifier.current || !eyeClassifier.current) {
      console.log("Classifiers not ready, retrying in 500ms...");
      setTimeout(() => startAnalysis(), 500);
      return;
    }
    
    reset();
    setStatus(AnalysisStatus.Processing);
    
    const waitForVideo = () => {
      if (video.readyState >= 2) {
        video.currentTime = 0;
        video.play().then(() => {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = setInterval(() => {
            if (video && !video.paused && !video.ended) {
              setProgress((video.currentTime / video.duration) * 100);
            } else if (video && video.ended) {
               if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            }
          }, 100);
          
          requestRef.current = requestAnimationFrame(detectGaze);
        }).catch((e: Error) => {
          console.error("Video play failed:", e);
          setStatus(AnalysisStatus.Error);
        });
      } else {
        setTimeout(waitForVideo, 100);
      }
    };
    
    waitForVideo();
  }, [reset, detectGaze, videoRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current != null) cancelAnimationFrame(requestRef.current);
      if (progressIntervalRef.current != null) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return { status, progress, startAnalysis, reset };
};
