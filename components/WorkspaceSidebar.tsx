import React from 'react';
import { AnalysisStatus, type ScanMode, type ScanModeOption } from '../types';

const scanModes: ScanModeOption[] = [
  { id: 'fast', label: '高速', intervalSeconds: 1 },
  { id: 'standard', label: '標準', intervalSeconds: 0.5 },
  { id: 'precise', label: '高精度', intervalSeconds: 0.25 },
];

interface WorkspaceSidebarProps {
  hasVideo: boolean;
  candidateCount: number;
  selectedCount: number;
  status: AnalysisStatus;
  progress: number;
  sensitivity: number;
  scanMode: ScanMode;
  zipping: boolean;
  onSensitivityChange: (value: number) => void;
  onScanModeChange: (value: ScanMode) => void;
  onStartAnalysis: () => void;
  onCancelAnalysis: () => void;
  onNewVideo: () => void;
  onDownloadSelected: () => void;
}

const statusLabel: Record<AnalysisStatus, string> = {
  [AnalysisStatus.Idle]: '待機中',
  [AnalysisStatus.Initializing]: '準備中',
  [AnalysisStatus.Processing]: '解析中',
  [AnalysisStatus.Done]: '完了',
  [AnalysisStatus.Error]: 'エラー',
  [AnalysisStatus.Canceled]: '停止',
};

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  hasVideo,
  candidateCount,
  selectedCount,
  status,
  progress,
  sensitivity,
  scanMode,
  zipping,
  onSensitivityChange,
  onScanModeChange,
  onStartAnalysis,
  onCancelAnalysis,
  onNewVideo,
  onDownloadSelected,
}) => {
  const isProcessing = status === AnalysisStatus.Processing;
  const isInitializing = status === AnalysisStatus.Initializing;
  const isBusy = isProcessing || isInitializing;
  const sensitivityPercent = Math.round(((sensitivity - 0.1) / 0.8) * 100);

  return (
    <aside className="border-b border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-xl lg:sticky lg:top-0 lg:h-screen lg:w-[340px] lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
      <div className="flex h-full flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20">
              AI
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-950">Gaze Catcher</div>
              <div className="text-xs text-slate-500">Thumbnail workspace</div>
            </div>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {statusLabel[status]}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-blue-50 p-3">
            <div className="text-xl font-semibold text-blue-700">{candidateCount}</div>
            <div className="text-xs text-blue-700/70">候補</div>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3">
            <div className="text-xl font-semibold text-slate-950">{selectedCount}</div>
            <div className="text-xs text-slate-500">選択</div>
          </div>
          <div className="rounded-2xl bg-blue-50 p-3">
            <div className="text-xl font-semibold text-blue-700">{Math.round(progress)}%</div>
            <div className="text-xs text-blue-700/70">進捗</div>
          </div>
        </div>

        <details className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:hidden">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-950">
            解析設定を開く
          </summary>
          <div className="mt-4 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="mobile-sensitivity" className="text-sm font-medium text-slate-700">
                  検出感度
                </label>
                <span className="text-sm font-semibold text-blue-700">{sensitivityPercent}%</span>
              </div>
              <input
                id="mobile-sensitivity"
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={sensitivity}
                onChange={(event) => onSensitivityChange(Number(event.target.value))}
                disabled={isBusy}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${sensitivityPercent}%, #e2e8f0 ${sensitivityPercent}%, #e2e8f0 100%)`,
                }}
              />
            </div>
            <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
              {scanModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onScanModeChange(mode.id)}
                  disabled={isBusy}
                  className={`rounded-xl px-2 py-2 text-sm font-semibold transition ${
                    scanMode === mode.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {isProcessing ? (
                <button
                  type="button"
                  onClick={onCancelAnalysis}
                  className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  解析をキャンセル
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartAnalysis}
                  disabled={!hasVideo || isInitializing}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300"
                >
                  解析を開始
                </button>
              )}
              <button
                type="button"
                onClick={onDownloadSelected}
                disabled={zipping || selectedCount === 0}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 disabled:text-slate-400"
              >
                {zipping ? 'ZIP作成中...' : `選択中${selectedCount}件を保存`}
              </button>
            </div>
          </div>
        </details>

        <div className="hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-950">解析設定</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">候補の拾い方と保存をここで管理します。</p>
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="sensitivity" className="text-sm font-medium text-slate-700">
                  検出感度
                </label>
                <span className="text-sm font-semibold text-blue-700">{sensitivityPercent}%</span>
              </div>
              <input
                id="sensitivity"
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={sensitivity}
                onChange={(event) => onSensitivityChange(Number(event.target.value))}
                disabled={isBusy}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, #2563eb 0%, #2563eb ${sensitivityPercent}%, #e2e8f0 ${sensitivityPercent}%, #e2e8f0 100%)`,
                }}
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>広く拾う</span>
                <span>厳しく絞る</span>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-medium text-slate-700">解析速度</div>
              <div className="grid grid-cols-3 rounded-2xl bg-slate-100 p-1">
                {scanModes.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onScanModeChange(mode.id)}
                    disabled={isBusy}
                    className={`rounded-xl px-2 py-2 text-sm font-semibold transition ${
                      scanMode === mode.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-950'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    title={`${mode.intervalSeconds}秒ごとに解析`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">解析進捗</span>
                <span className="font-semibold text-slate-950">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {isProcessing ? (
                <button
                  type="button"
                  onClick={onCancelAnalysis}
                  className="w-full rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600"
                >
                  解析をキャンセル
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartAnalysis}
                  disabled={!hasVideo || isInitializing}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                >
                  解析を開始
                </button>
              )}
              <button
                type="button"
                onClick={onDownloadSelected}
                disabled={zipping || selectedCount === 0}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {zipping ? 'ZIP作成中...' : `選択中${selectedCount}件を保存`}
              </button>
              <button
                type="button"
                onClick={onNewVideo}
                disabled={!hasVideo || isProcessing}
                className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                新しい動画に切り替え
              </button>
            </div>
          </div>
        </div>

        <div className="hidden rounded-3xl bg-slate-50 p-4 lg:block">
          <div className="text-sm font-semibold text-slate-950">プライバシー</div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            動画解析はブラウザ内で実行します。動画ファイルはアップロードされません。
          </p>
        </div>
      </div>
    </aside>
  );
};
