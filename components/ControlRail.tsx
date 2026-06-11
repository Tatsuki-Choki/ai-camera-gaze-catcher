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
  <div role="group" aria-label={label} className="flex rounded-lg border border-line bg-ink-950 p-0.5">
    {options.map(([key, text]) => (
      <button
        key={key}
        type="button"
        onClick={() => onChange(key)}
        disabled={disabled}
        aria-pressed={value === key}
        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
          value === key
            ? 'bg-ink-750 text-hi shadow-[inset_0_0_0_1px_var(--line-strong)]'
            : 'text-low hover:text-mid'
        } disabled:cursor-not-allowed disabled:opacity-40`}
      >
        {text}
      </button>
    ))}
  </div>
);

interface ControlRailProps {
  hasVideo: boolean;
  status: AnalysisStatus;
  progressPercent: number;
  etaSeconds: number | null;
  errorMessage: string | null;
  sensitivity: number;
  scanMode: ScanMode;
  exportFormat: ExportFormat;
  onSensitivityChange: (value: number) => void;
  onScanModeChange: (value: ScanMode) => void;
  onExportFormatChange: (value: ExportFormat) => void;
  onStartAnalysis: () => void;
  onCancelAnalysis: () => void;
}

export const ControlRail: React.FC<ControlRailProps> = ({
  hasVideo,
  status,
  progressPercent,
  etaSeconds,
  errorMessage,
  sensitivity,
  scanMode,
  exportFormat,
  onSensitivityChange,
  onScanModeChange,
  onExportFormatChange,
  onStartAnalysis,
  onCancelAnalysis,
}) => {
  const isProcessing = status === AnalysisStatus.Processing;
  const isInitializing = status === AnalysisStatus.Initializing;
  const isBusy = isProcessing || isInitializing;
  const sensitivityPercent = Math.round(((sensitivity - 0.1) / 0.8) * 100);
  const eta = formatEta(etaSeconds);

  return (
    <section
      aria-label="解析設定"
      className="rounded-2xl border border-line bg-ink-800 px-4 py-4 sm:px-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
        {/* 検出感度 */}
        <div className="min-w-0 flex-1 lg:max-w-xs">
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="sensitivity" className="text-xs font-medium text-mid">
              検出感度
            </label>
            <span className="font-tc text-xs text-amber">{sensitivityPercent}%</span>
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
          <div className="mt-1.5 flex justify-between text-[10px] text-low">
            <span>広く拾う</span>
            <span>厳しく絞る</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
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
        </div>

        {/* 実行 */}
        <div className="flex items-center gap-4 lg:ml-auto">
          {isProcessing && eta && (
            <span className="font-tc text-xs text-mid">{eta}</span>
          )}
          {isProcessing ? (
            <button
              type="button"
              onClick={onCancelAnalysis}
              className="rounded-xl border border-rec/50 bg-transparent px-6 py-3 text-sm font-bold text-rec transition hover:bg-rec/10"
            >
              停止
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartAnalysis}
              disabled={!hasVideo || isInitializing}
              className="rounded-xl bg-amber px-7 py-3 text-sm font-bold text-ink-950 shadow-[0_0_24px_var(--amber-glow)] transition hover:bg-amber-hi disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-low disabled:shadow-none"
            >
              {isInitializing ? '準備中…' : '解析を開始'}
            </button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-950">
            <div
              className="h-full rounded-full bg-amber transition-[width] duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
          <span className="font-tc text-xs text-mid">{Math.round(progressPercent)}%</span>
        </div>
      )}

      {errorMessage && (
        <p className="mt-3 rounded-lg border border-rec/30 bg-rec/10 px-3 py-2 text-xs leading-5 text-rec" role="alert">
          {errorMessage}
        </p>
      )}
    </section>
  );
};
