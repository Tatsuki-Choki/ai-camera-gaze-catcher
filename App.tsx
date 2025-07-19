
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">AI カメラ目線キャッチャー</h1>
          <p className="text-gray-600">動画から最高のカメラ目線シーンを自動で検出</p>
        </header>

        <main className="flex flex-col gap-4">
          {!videoSrc ? (
            <VideoSelector onVideoSelect={handleVideoSelect} />
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in">
              <div className="relative aspect-video bg-black rounded-t-xl overflow-hidden">
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