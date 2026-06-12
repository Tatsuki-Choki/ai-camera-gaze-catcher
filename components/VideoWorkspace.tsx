import React from 'react';
import { AnalysisStatus } from '../types';
import { VideoSelector } from './VideoSelector';

interface VideoWorkspaceProps {
  videoSrc: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: AnalysisStatus;
  progressPercent: number;
  onVideoSelect: (file: File) => void;
  /** スコアタイムライン。ステージ下部に融合表示する */
  timeline?: React.ReactNode;
}

export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  videoSrc,
  videoRef,
  status,
  progressPercent,
  onVideoSelect,
  timeline,
}) => {
  const isProcessing = status === AnalysisStatus.Processing;

  return (
    <section
      aria-label="動画ステージ"
      className="overflow-hidden rounded-2xl border border-line bg-stage shadow-panel"
    >
      {videoSrc ? (
        <>
          <div className="relative bg-stage-deep">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              className="aspect-video w-full"
              preload="metadata"
              playsInline
            />
            {isProcessing && (
              <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-full border border-stage-line bg-stage/90 px-3 py-1.5 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-rec animate-lamp" aria-hidden="true" />
                <span className="font-tc text-[11px] tracking-[0.2em] text-stage-hi">
                  SCAN {Math.round(progressPercent)}%
                </span>
              </div>
            )}
          </div>

          {/* 解析中の進捗ストリップ */}
          {isProcessing && (
            <div className="h-0.5 bg-white/10" role="presentation">
              <div
                className="h-full bg-stage-hi transition-[width] duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
              />
            </div>
          )}

          {timeline && (
            <div className="border-t border-stage-line px-4 py-3 sm:px-5">
              {timeline}
            </div>
          )}
        </>
      ) : (
        <VideoSelector onVideoSelect={onVideoSelect} />
      )}
    </section>
  );
};
