import React, { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { AppShell } from './components/AppShell';
import { CandidateStrip } from './components/CandidateStrip';
import { VideoWorkspace } from './components/VideoWorkspace';
import { WorkspaceSidebar } from './components/WorkspaceSidebar';
import { useGazeDetection } from './hooks/useGazeDetection';
import type { ScanMode, Screenshot } from './types';

const formatTimestampForFile = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}-${secs}`;
};

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

export default function App(): React.ReactNode {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState(0.25);
  const [scanMode, setScanMode] = useState<ScanMode>('standard');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [zipping, setZipping] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const selectedCount = screenshots.filter((screenshot) => screenshot.selected).length;

  const onCandidate = useCallback((screenshot: Screenshot) => {
    setScreenshots((prev) => {
      const existing = prev.findIndex((item) => item.id === screenshot.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = { ...screenshot, selected: next[existing].selected };
        return next.sort((a, b) => a.timestamp - b.timestamp);
      }
      return [...prev, screenshot].sort((a, b) => a.timestamp - b.timestamp);
    });
  }, []);
  
  const { status, progress, startAnalysis, cancelAnalysis, reset } = useGazeDetection(
    videoRef,
    sensitivity,
    scanMode,
    onCandidate,
  );

  const handleVideoSelect = (file: File) => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    setScreenshots([]);
    reset();
    const url = URL.createObjectURL(file);
    setVideoSrc(url);

    setTimeout(() => {
      videoRef.current?.load();
    }, 100);
  };

  const handleStartAnalysis = () => {
    if (videoRef.current) {
      setScreenshots([]);
      void startAnalysis();
    }
  };
  
  const handleNewVideo = () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    setVideoSrc(null);
    setScreenshots([]);
    reset();
  };

  const handleSeekTo = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.pause();
      videoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleToggleSelected = (id: string) => {
    setScreenshots((prev) => prev.map((item) => (
      item.id === id ? { ...item, selected: !item.selected } : item
    )));
  };

  const handleSelectAll = () => {
    setScreenshots((prev) => prev.map((item) => ({ ...item, selected: true })));
  };

  const handleClearSelection = () => {
    setScreenshots((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const handleDownloadSelected = async () => {
    const selected = screenshots.filter((screenshot) => screenshot.selected);
    if (selected.length === 0) {
      return;
    }

    try {
      setZipping(true);
      const zip = new JSZip();

      await Promise.all(selected.map(async (screenshot, index) => {
        const blob = await dataUrlToBlob(screenshot.dataUrl);
        const name = `${String(index + 1).padStart(2, '0')}_${formatTimestampForFile(screenshot.timestamp)}_score-${Math.round(screenshot.score * 100)}.jpg`;
        zip.file(name, blob);
      }));

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'camera-gaze-candidates.zip';
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  };

  useEffect(() => () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
  }, [videoSrc]);

  return (
    <AppShell
      sidebar={(
        <WorkspaceSidebar
          hasVideo={Boolean(videoSrc)}
          candidateCount={screenshots.length}
          selectedCount={selectedCount}
          status={status}
          progress={progress}
          sensitivity={sensitivity}
          scanMode={scanMode}
          zipping={zipping}
          onSensitivityChange={setSensitivity}
          onScanModeChange={setScanMode}
          onStartAnalysis={handleStartAnalysis}
          onCancelAnalysis={cancelAnalysis}
          onNewVideo={handleNewVideo}
          onDownloadSelected={handleDownloadSelected}
        />
      )}
    >
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5 p-4 sm:p-6">
        <VideoWorkspace
          videoSrc={videoSrc}
          videoRef={videoRef}
          status={status}
          progress={progress}
          candidateCount={screenshots.length}
          selectedCount={selectedCount}
          onVideoSelect={handleVideoSelect}
        />

        <CandidateStrip
          screenshots={screenshots}
          selectedCount={selectedCount}
          zipping={zipping}
          onSeekTo={handleSeekTo}
          onToggleSelected={handleToggleSelected}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onDownloadSelected={handleDownloadSelected}
        />
      </div>
    </AppShell>
  );
}
