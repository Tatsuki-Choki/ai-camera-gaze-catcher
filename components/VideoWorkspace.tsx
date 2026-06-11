import React from 'react';
import { AnalysisStatus, type EngineKind } from '../types';
import { VideoSelector } from './VideoSelector';

interface VideoWorkspaceProps {
  videoSrc: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: AnalysisStatus;
  progressPercent: number;
  engineKind: EngineKind | null;
  candidateCount: number;
  selectedCount: number;
  onVideoSelect: (file: File) => void;
}

export const VideoWorkspace: React.FC<VideoWorkspaceProps> = ({
  videoSrc,
  videoRef,
  status,
  progressPercent,
  engineKind,
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
            動画から正面視線に近い瞬間を検出し、候補を見比べて保存します。解析中も動画は自由に操作できます。
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
            <div className="text-lg font-semibold text-slate-950">{Math.round(progressPercent)}%</div>
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
                preload="metadata"
                playsInline
              />
              {isProcessing && (
                <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-600" />
                  {engineKind === 'webcodecs' ? '高速解析中' : '解析中'} {Math.round(progressPercent)}%
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
