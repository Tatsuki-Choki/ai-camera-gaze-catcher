import React, { useCallback, useEffect, useRef, useState } from 'react';
import JSZip from 'jszip';
import { CandidateGrid } from './components/CandidateGrid';
import { ControlRail } from './components/ControlRail';
import { ScoreTimeline } from './components/ScoreTimeline';
import { SelectionBar } from './components/SelectionBar';
import { TopBar } from './components/TopBar';
import { VideoWorkspace } from './components/VideoWorkspace';
import { useAnalysisEngine } from './hooks/useAnalysisEngine';
import { formatTimestamp } from './services/formatTime';
import type { ExportFormat, ScanMode, Screenshot } from './types';

export default function App(): React.ReactNode {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState(0.25);
  const [scanMode, setScanMode] = useState<ScanMode>('standard');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('jpeg');
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [zipping, setZipping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const selectedCount = screenshots.filter((screenshot) => screenshot.selected).length;

  const onCandidate = useCallback((screenshot: Screenshot, replacesId: string | null) => {
    setScreenshots((prev) => {
      if (replacesId) {
        const target = prev.find((item) => item.id === replacesId);
        if (target) {
          URL.revokeObjectURL(target.thumbUrl);
          return prev.map((item) => (item.id === replacesId ? screenshot : item));
        }
      }
      return [...prev, screenshot];
    });
  }, []);

  const {
    status,
    progress,
    engineKind,
    errorMessage,
    timeline,
    threshold,
    startAnalysis,
    cancelAnalysis,
    reset,
  } = useAnalysisEngine({ sensitivity, scanMode, exportFormat, onCandidate });

  const clearScreenshots = useCallback(() => {
    setScreenshots((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.thumbUrl));
      return [];
    });
  }, []);

  const handleVideoSelect = (file: File) => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    clearScreenshots();
    reset();
    setCurrentTime(0);
    setDuration(0);
    setVideoFile(file);
    setVideoSrc(URL.createObjectURL(file));
  };

  const handleStartAnalysis = () => {
    if (videoFile) {
      clearScreenshots();
      startAnalysis(videoFile);
    }
  };

  const handleNewVideo = () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
    clearScreenshots();
    reset();
    setVideoFile(null);
    setVideoSrc(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const handleSeekTo = useCallback((timestamp: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  }, []);

  const handleSeekToCandidate = useCallback((timestamp: number) => {
    handleSeekTo(timestamp);
    videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [handleSeekTo]);

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
    const selected = screenshots
      .filter((screenshot) => screenshot.selected)
      .sort((a, b) => a.time - b.time);
    if (selected.length === 0) {
      return;
    }

    try {
      setZipping(true);
      const zip = new JSZip();

      selected.forEach((screenshot, index) => {
        const extension = screenshot.fullBlob.type === 'image/png' ? 'png' : 'jpg';
        const name = `${String(index + 1).padStart(2, '0')}_${formatTimestamp(screenshot.time, '-')}_score-${Math.round(screenshot.score * 100)}.${extension}`;
        zip.file(name, screenshot.fullBlob);
      });

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

  // 再生位置と動画長をタイムライン表示用に追跡する
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) {
      return;
    }
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoSrc]);

  useEffect(() => () => {
    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }
  }, [videoSrc]);

  return (
    <div className="grain min-h-screen">
      <TopBar
        status={status}
        engineKind={engineKind}
        candidateCount={screenshots.length}
        selectedCount={selectedCount}
        hasVideo={Boolean(videoSrc)}
        onNewVideo={handleNewVideo}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 pb-32 pt-6 sm:px-6">
        <VideoWorkspace
          videoSrc={videoSrc}
          videoRef={videoRef}
          status={status}
          progressPercent={progress.percent}
          onVideoSelect={handleVideoSelect}
          timeline={duration > 0 && timeline.length > 0 ? (
            <ScoreTimeline
              points={timeline}
              candidates={screenshots}
              duration={duration}
              currentTime={currentTime}
              threshold={threshold}
              onSeek={handleSeekTo}
            />
          ) : null}
        />

        {videoSrc && (
          <ControlRail
            hasVideo={Boolean(videoSrc)}
            status={status}
            progressPercent={progress.percent}
            etaSeconds={progress.etaSeconds}
            errorMessage={errorMessage}
            sensitivity={sensitivity}
            scanMode={scanMode}
            exportFormat={exportFormat}
            onSensitivityChange={setSensitivity}
            onScanModeChange={setScanMode}
            onExportFormatChange={setExportFormat}
            onStartAnalysis={handleStartAnalysis}
            onCancelAnalysis={cancelAnalysis}
          />
        )}

        <CandidateGrid
          screenshots={screenshots}
          selectedCount={selectedCount}
          onSeekTo={handleSeekToCandidate}
          onToggleSelected={handleToggleSelected}
          onSelectAll={handleSelectAll}
        />

        {videoSrc && (
          <p className="text-center text-[11px] leading-5 text-low">
            解析はすべてブラウザ内で実行されます。動画ファイルがアップロードされることはありません。
          </p>
        )}
      </main>

      <SelectionBar
        selectedCount={selectedCount}
        zipping={zipping}
        onClearSelection={handleClearSelection}
        onDownloadSelected={handleDownloadSelected}
      />
    </div>
  );
}
