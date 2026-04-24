import React from 'react';
import { AnalysisStatus } from '../types';
import { VideoSelector } from './VideoSelector';

interface VideoWorkspaceProps {
  videoSrc: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: AnalysisStatus;
  progress: number;
  candidateCount: number;
  selectedCount: number;
  onVideoSelect: (file: File) => void;
}

export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  videoSrc,
  videoRef,
  status,
  progress,
  candidateCount,
  selectedCount,
  onVideoSelect,
}) => {
  const isProcessing = status === AnalysisStatus.Processing;

  return (
    <section className="min-w-0">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Modern thumbnail workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            AI カメラ目線キャッチャー
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            動画から正面視線に近い瞬間を検出し、候補を見比べて保存します。
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
            <div className="text-lg font-semibold text-slate-950">{candidateCount}</div>
            <div className="text-xs text-slate-500">検出候補</div>
          </div>
          <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
            <div className="text-lg font-semibold text-slate-950">{selectedCount}</div>
            <div className="text-xs text-slate-500">選択中</div>
          </div>
          <div className="rounded-2xl border border-white bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
            <div className="text-lg font-semibold text-slate-950">{Math.round(progress)}%</div>
            <div className="text-xs text-slate-500">進捗</div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white bg-white/85 shadow-xl shadow-slate-200/70 backdrop-blur">
        <div className="bg-gradient-to-br from-blue-100 via-sky-50 to-white p-3">
          {videoSrc ? (
            <div className="relative overflow-hidden rounded-3xl bg-slate-100 shadow-2xl shadow-blue-100/70">
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                className="aspect-video h-full w-full"
                muted
                preload="metadata"
              />
              {isProcessing && (
                <div className="absolute inset-x-4 top-4 rounded-2xl border border-blue-100 bg-white/90 p-3 text-slate-800 shadow-lg backdrop-blur">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">解析中</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-blue-100 bg-white p-3 shadow-inner shadow-blue-50">
              <VideoSelector onVideoSelect={onVideoSelect} />
            </div>
          )}
        </div>

        {!videoSrc && (
          <div className="border-t border-slate-100 px-5 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">動画を追加</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>AI解析</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span>候補を選んで保存</span>
              <span className="ml-auto rounded-full bg-slate-50 px-3 py-1 text-slate-500">
                ブラウザ内で解析
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
