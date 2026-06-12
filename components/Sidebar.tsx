import React from 'react';
import {
  AnalysisStatus,
  type ExportFormat,
  type ScanMode,
  type ScanModeOption,
} from '../types';

const scanModes: ScanModeOption[] = [
  { id: 'fast', label: '高速', intervalSeconds: 1 },
  { id: 'standard', label: '標準', intervalSeconds: 0.5 },
  { id: 'precise', label: '高精度', intervalSeconds: 0.25 },
];

const formatEta = (etaSeconds: number | null): string | null => {
  if (etaSeconds === null || !Number.isFinite(etaSeconds)) {
    return null;
  }
  if (etaSeconds < 1) {
    return 'まもなく完了';
  }
  if (etaSeconds < 60) {
    return `残り 約${Math.ceil(etaSeconds)}秒`;
  }
  return `残り 約${Math.ceil(etaSeconds / 60)}分`;
};

type StepState = 'todo' | 'active' | 'done';

const StepMarker: React.FC<{ state: StepState; number: number }> = ({ state, number }) => (
  <span
    aria-hidden="true"
    className={`font-tc flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
      state === 'done'
        ? 'border-accent bg-accent text-on-accent'
        : state === 'active'
          ? 'border-accent text-accent shadow-[0_0_0_3px_var(--accent-soft)]'
          : 'border-line-strong text-low'
    }`}
  >
    {state === 'done' ? (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ) : (
      number
    )}
  </span>
);

interface StepProps {
  number: number;
  state: StepState;
  title: string;
  description: string;
  isLast?: boolean;
  children?: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ number, state, title, description, isLast = false, children }) => (
  <li className="relative flex gap-3">
    {!isLast && (
      <span
        aria-hidden="true"
        className={`absolute left-3.5 top-8 h-[calc(100%-1.5rem)] w-px ${
          state === 'done' ? 'bg-accent/50' : 'bg-line'
        }`}
      />
    )}
    <StepMarker state={state} number={number} />
    <div className={`min-w-0 flex-1 pb-5 ${isLast ? 'pb-0' : ''}`}>
      <h3
        className={`pt-1 text-sm font-bold leading-5 ${
          state === 'active' ? 'text-hi' : state === 'done' ? 'text-mid' : 'text-low'
        }`}
      >
        {title}
      </h3>
      <p className={`mt-1 text-xs leading-5 ${state === 'active' ? 'text-mid' : 'text-low'}`}>
        {description}
      </p>
      {children && <div className="mt-3">{children}</div>}
    </div>
  </li>
);

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<readonly [T, string]>;
  disabled: boolean;
  onChange: (value: T) => void;
}

const Segmented = <T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: SegmentedProps<T>) => (
  <div role="group" aria-label={label} className="grid auto-cols-fr grid-flow-col rounded-lg bg-inset p-0.5">
    {options.map(([key, text]) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        disabled={disabled}
        aria-pressed={value === key}
        className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${
          value === key
            ? 'bg-panel text-hi shadow-sm'
            : 'text-low hover:text-mid'
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        {text}
      </button>
    ))}
  </div>
);

interface SidebarProps {
  hasVideo: boolean;
  status: AnalysisStatus;
  candidateCount: number;
  selectedCount: number;
  progressPercent: number;
  etaSeconds: number | null;
  errorMessage: string | null;
  sensitivity: number;
  scanMode: ScanMode;
  exportFormat: ExportFormat;
  zipping: boolean;
  onPickVideo: () => void;
  onSensitivityChange: (value: number) => void;
  onScanModeChange: (value: ScanMode) => void;
  onExportFormatChange: (value: ExportFormat) => void;
  onStartAnalysis: () => void;
  onCancelAnalysis: () => void;
  onSelectAll: () => void;
  onDownloadSelected: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  hasVideo,
  status,
  candidateCount,
  selectedCount,
  progressPercent,
  etaSeconds,
  errorMessage,
  sensitivity,
  scanMode,
  exportFormat,
  zipping,
  onPickVideo,
  onSensitivityChange,
  onScanModeChange,
  onExportFormatChange,
  onStartAnalysis,
  onCancelAnalysis,
  onSelectAll,
  onDownloadSelected,
}) => {
  const isProcessing = status === AnalysisStatus.Processing;
  const isInitializing = status === AnalysisStatus.Initializing;
  const isBusy = isProcessing || isInitializing;
  const isDone = status === AnalysisStatus.Done;
  const sensitivityPercent = Math.round(((sensitivity - 0.1) / 0.8) * 100);
  const eta = formatEta(etaSeconds);

  const step1: StepState = hasVideo ? 'done' : 'active';
  const step2: StepState = !hasVideo ? 'todo' : isDone || candidateCount > 0 ? 'done' : 'active';
  const step3: StepState = candidateCount > 0 ? 'active' : 'todo';

  return (
    <aside
      aria-label="ワークフロー"
      className="shrink-0 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:w-[300px] lg:overflow-y-auto"
    >
      <div className="flex flex-col gap-4 py-5 lg:pr-1">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-panel">
          <p className="font-tc mb-4 text-[10px] uppercase tracking-[0.35em] text-low">
            Workflow
          </p>
          <ol className="list-none">
            <Step
              number={1}
              state={step1}
              title="動画を選ぶ"
              description="MP4 / MOV / WebM をドラッグ＆ドロップ、またはクリックで選択。"
            >
              {!hasVideo && (
                <button
                  type="button"
                  onClick={onPickVideo}
                  className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-on-accent transition hover:bg-accent-hi"
                >
                  動画を選択
                </button>
              )}
            </Step>

            <Step
              number={2}
              state={step2}
              title="AIで解析"
              description="カメラ目線の瞬間をスキャンします。設定はそのままでも十分動きます。"
            >
              {hasVideo && (
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-baseline justify-between">
                      <label htmlFor="sensitivity" className="text-xs font-medium text-mid">
                        検出感度
                      </label>
                      <span className="font-tc text-xs text-accent">{sensitivityPercent}%</span>
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
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-low">
                      <span>広く拾う</span>
                      <span>厳しく絞る</span>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 text-xs font-medium text-mid">解析の細かさ</div>
                    <Segmented
                      label="解析の細かさ"
                      value={scanMode}
                      options={scanModes.map((mode) => [mode.id, mode.label] as const)}
                      disabled={isBusy}
                      onChange={onScanModeChange}
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 text-xs font-medium text-mid">保存形式</div>
                    <Segmented
                      label="保存形式"
                      value={exportFormat}
                      options={[['jpeg', 'JPEG'], ['png', 'PNG']] as const}
                      disabled={isBusy}
                      onChange={onExportFormatChange}
                    />
                  </div>

                  {isProcessing ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-tc text-xs text-mid">
                          {Math.round(progressPercent)}%
                        </span>
                        {eta && <span className="font-tc text-xs text-low">{eta}</span>}
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-inset">
                        <div
                          className="h-full rounded-full bg-accent transition-[width] duration-300"
                          style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={onCancelAnalysis}
                        className="w-full rounded-xl border border-rec/40 px-4 py-2.5 text-sm font-bold text-rec transition hover:bg-rec/10"
                      >
                        停止
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={onStartAnalysis}
                      disabled={isInitializing}
                      className={`w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-on-accent transition hover:bg-accent-hi disabled:cursor-not-allowed disabled:bg-inset disabled:text-low ${
                        step2 === 'active' ? '' : ''
                      }`}
                    >
                      {isInitializing ? '準備中…' : isDone || candidateCount > 0 ? 'もう一度解析' : '解析を開始'}
                    </button>
                  )}

                  {errorMessage && (
                    <p className="rounded-lg border border-rec/30 bg-rec/10 px-3 py-2 text-xs leading-5 text-rec" role="alert">
                      {errorMessage}
                    </p>
                  )}
                </div>
              )}
            </Step>

            <Step
              number={3}
              state={step3}
              title="候補を選んで保存"
              description="気に入った候補をクリックで選択し、まとめてZIP保存できます。"
              isLast
            >
              {candidateCount > 0 && (
                <div className="space-y-2">
                  <div className="font-tc flex items-baseline justify-between text-xs">
                    <span className="text-mid">
                      候補 <span className="text-hi">{candidateCount}</span>
                    </span>
                    <span className="text-mid">
                      選択 <span className={selectedCount > 0 ? 'text-accent' : 'text-hi'}>{selectedCount}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onSelectAll}
                      disabled={selectedCount === candidateCount}
                      className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-mid transition hover:border-line-strong hover:text-hi disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      全選択
                    </button>
                    <button
                      type="button"
                      onClick={onDownloadSelected}
                      disabled={zipping || selectedCount === 0}
                      className="rounded-xl bg-accent px-3 py-2 text-xs font-bold text-on-accent transition hover:bg-accent-hi disabled:cursor-not-allowed disabled:bg-inset disabled:text-low"
                    >
                      {zipping ? '作成中…' : 'ZIP保存'}
                    </button>
                  </div>
                </div>
              )}
            </Step>
          </ol>
        </div>

        <div className="rounded-2xl border border-line bg-panel p-4 shadow-panel">
          <div className="flex items-start gap-2.5">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-low" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" />
            </svg>
            <p className="text-[11px] leading-5 text-low">
              解析はすべてブラウザ内で実行されます。動画ファイルがサーバーへ送信されることはありません。
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
