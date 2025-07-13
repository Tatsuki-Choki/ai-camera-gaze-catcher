
import React, { useState, useRef, useCallback } from 'react';
import { VideoSelector } from './components/VideoSelector';
import { Controls } from './components/Controls';
import { ResultsGrid } from './components/ResultsGrid';
import { useGazeDetection } from './hooks/useGazeDetection';
import type { Screenshot } from './types';

export default function App(): React.ReactNode {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState(0.25);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onNewScreenshot = useCallback((screenshot: Screenshot) => {
    setScreenshots((prev) => [...prev, screenshot]);
  }, []);
  
  const { status, progress, startAnalysis, reset } = useGazeDetection(
    videoRef,
    sensitivity,
    onNewScreenshot
  );

  const handleVideoSelect = (file: File) => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    setScreenshots([]);
    reset();
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    
    // Wait for video to be ready
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
      }
    }, 100);
  };

  const handleStartAnalysis = () => {
    if (videoRef.current) {
        setScreenshots([]);
        startAnalysis();
    }
  };

  const handleSensitivityChange = (value: number) => {
    setSensitivity(value);
  };
  
  const handleNewVideo = () => {
      if (videoSrc) {
          URL.revokeObjectURL(videoSrc);
      }
      setVideoFile(null);
      setVideoSrc(null);
      setScreenshots([]);
      reset();
  };

  return (
    <div className="min-h-screen bg-surface-container">
      <div className="max-w-3xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-medium text-on-surface mb-1 sm:mb-2">AI カメラ目線キャッチャー</h1>
          <p className="text-on-surface-variant text-xs sm:text-sm">動画から最高のカメラ目線シーンを自動で検出</p>
        </header>

        <main className="flex flex-col gap-4">
          {!videoSrc ? (
            <VideoSelector onVideoSelect={handleVideoSelect} />
          ) : (
            <div className="bg-surface rounded-2xl shadow-elevation-1 overflow-hidden animate-fade-in">
              <div className="relative aspect-video bg-black">
              <video 
                ref={videoRef} 
                src={videoSrc} 
                controls 
                className="w-full h-full" 
                muted
                preload="auto"
                onLoadedData={() => console.log("Video loaded data")}
                onLoadedMetadata={() => console.log("Video loaded metadata")}
                onCanPlay={() => console.log("Video can play")}
                onCanPlayThrough={() => console.log("Video can play through")}
                onError={(e) => console.error("Video error:", e)}
                onPlay={() => console.log("Video started playing")}
                onPause={() => console.log("Video paused")}
                onTimeUpdate={() => {
                  // Commented out to reduce console spam
                  // if (videoRef.current) {
                  //   const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                  //   console.log(`Video time update: ${videoRef.current.currentTime.toFixed(2)}s (${progress.toFixed(1)}%)`);
                  // }
                }}
              />
              </div>
            <Controls
              sensitivity={sensitivity}
              onSensitivityChange={handleSensitivityChange}
              onStartAnalysis={handleStartAnalysis}
              onNewVideo={handleNewVideo}
              status={status}
              progress={progress}
            />
            </div>
          )}

          {screenshots.length > 0 && (
            <ResultsGrid screenshots={screenshots} />
          )}
        </main>
      </div>
    </div>
  );
}