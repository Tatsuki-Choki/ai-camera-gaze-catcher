import React from 'react';
import { AnalysisStatus, type EngineKind } from '../types';
import type { Theme } from '../hooks/useTheme';

interface TopBarProps {
  status: AnalysisStatus;
  engineKind: EngineKind | null;
  candidateCount: number;
  selectedCount: number;
  hasVideo: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  onNewVideo: () => void;
}

const statusLabel: Record<AnalysisStatus, string> = {
  [AnalysisStatus.Idle]: 'STANDBY',
  [AnalysisStatus.Initializing]: 'LOADING',
  [AnalysisStatus.Processing]: 'SCANNING',
  [AnalysisStatus.Done]: 'COMPLETE',
  [AnalysisStatus.Error]: 'ERROR',
  [AnalysisStatus.Canceled]: 'STOPPED',
};

export const TopBar: React.FC<TopBarProps> = ({
  status,
  engineKind,
  candidateCount,
  selectedCount,
  hasVideo,
  theme,
  onToggleTheme,
  onNewVideo,
}) => {
  const isProcessing = status === AnalysisStatus.Processing;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-panel/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              isProcessing ? 'bg-rec animate-lamp' : status === AnalysisStatus.Done ? 'bg-amber' : 'bg-inset'
            }`}
            aria-hidden="true"
          />
          <h1 className="font-credit text-base font-bold tracking-wide text-hi">
            カメラ目線キャッチャー
          </h1>
          <span className="font-tc hidden text-[10px] uppercase tracking-[0.3em] text-low md:inline">
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
              className="hidden rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-mid transition hover:border-line-strong hover:text-hi disabled:cursor-not-allowed disabled:opacity-40 sm:block"
            >
              別の動画
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            className="rounded-lg border border-line p-2 text-mid transition hover:border-line-strong hover:text-hi focus-visible:ring-2 focus-visible:ring-amber outline-none"
            aria-label={theme === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え'}
            title={theme === 'light' ? 'ダークモード' : 'ライトモード'}
          >
            {theme === 'light' ? (
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M13.5 9.5A5.5 5.5 0 016.5 2.5a5.5 5.5 0 107 7z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M8 1v2M8 13v2M15 8h-2M3 8H1M12.95 3.05l-1.41 1.41M4.46 11.54l-1.41 1.41M12.95 12.95l-1.41-1.41M4.46 4.46L3.05 3.05"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
