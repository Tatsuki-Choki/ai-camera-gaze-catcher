import React from 'react';
import { AnalysisStatus, type EngineKind } from '../types';

interface TopBarProps {
  status: AnalysisStatus;
  engineKind: EngineKind | null;
  candidateCount: number;
  selectedCount: number;
  hasVideo: boolean;
  onNewVideo: () => void;
}

const statusLabel: Record<AnalysisStatus, string> = {
  [AnalysisStatus.Idle]: 'STANDBY',
  [AnalysisStatus.Initializing]: 'LOADING',
  [AnalysisStatus.Processing]: 'SCANNING',
  [AnalysisStatus.Done]: 'COMPLETE',
  [AnalysisStatus.Error]: 'ERROR',
  [AnalysisStatus.Canceled]: 'STOPPED',
}

export const TopBar: React.FC<TopBarProps> = ({
  status,
  engineKind,
  candidateCount,
  selectedCount,
  hasVideo,
  onNewVideo,
}) => {
  const isProcessing = status === AnalysisStatus.Processing;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isProcessing ? 'bg-rec animate-lamp' : status === AnalysisStatus.Done ? 'bg-amber' : 'bg-ink-700'
            }`}
            aria-hidden="true"
          />
          <h1 className="font-credit text-base font-bold tracking-wide text-hi">
            カメラ目線キャッチャー
          </h1>
          <span className="font-tc hidden text-[10px] uppercase tracking-[0.3em] text-low sm:inline">
            Gaze Catcher
          </span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div
            className="font-tc hidden items-center gap-1.5 text-[11px] tracking-widest text-mid sm:flex"
            role="status"
          >
            <span className={isProcessing ? 'text-rec' : status === AnalysisStatus.Done ? 'text-amber' : ''}>
              {statusLabel[status]}
            </span>
            {isProcessing && engineKind === 'seek' && (
              <span className="text-low">/ COMPAT</span>
            )}
          </div>

          <div className="font-tc flex items-center gap-3 text-xs text-mid">
            <span>
              候補 <span className="text-hi">{candidateCount}</span>
            </span>
            <span className="text-low">·</span>
            <span>
              選択 <span className={selectedCount > 0 ? 'text-amber' : 'text-hi'}>{selectedCount}</span>
            </span>
          </div>

          {hasVideo && (
            <button
              type="button"
              onClick={onNewVideo}
              disabled={isProcessing}
              className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-mid transition hover:border-line-strong hover:text-hi disabled:cursor-not-allowed disabled:opacity-40"
            >
              別の動画
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
