import React, { useState } from 'react';
import type { Screenshot } from '../types';
import { getScoreLabel } from '../services/scoreLabel';
import { CopyIcon } from './icons/CopyIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ExpandIcon } from './icons/ExpandIcon';

interface ScreenshotCardProps {
  screenshot: Screenshot;
  compact?: boolean;
  onPreview: (screenshot: Screenshot) => void;
  onSeekTo: (timestamp: number) => void;
  onToggleSelected: (id: string) => void;
  onCopySuccess: () => void;
  onCopyError: () => void;
}

const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const copyImage = async (dataUrl: string) => {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard API is not available.');
  }

  const blob = await dataUrlToBlob(dataUrl);
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type || 'image/jpeg']: blob }),
  ]);
};

export const ScreenshotCard: React.FC<ScreenshotCardProps> = ({
  screenshot,
  compact = false,
  onPreview,
  onSeekTo,
  onToggleSelected,
  onCopySuccess,
  onCopyError,
}) => {
  const [copying, setCopying] = useState(false);
  const timestamp = formatTimestamp(screenshot.timestamp);
  const score = Math.round(screenshot.score * 100);
  const scoreLabel = getScoreLabel(screenshot.score);
  const fileName = `camera-gaze_${timestamp.replace(':', '-')}_${score}.jpg`;
  const toneClass = {
    strong: 'bg-emerald-100 text-emerald-700',
    good: 'bg-blue-100 text-blue-700',
    check: 'bg-amber-100 text-amber-700',
  }[scoreLabel.tone];

  const handleCopy = async () => {
    try {
      setCopying(true);
      await copyImage(screenshot.dataUrl);
      onCopySuccess();
    } catch {
      onCopyError();
    } finally {
      setCopying(false);
    }
  };

  return (
    <article
      className={`group shrink-0 overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70 ${
        screenshot.selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-white'
      } ${compact ? 'w-64' : ''}`}
    >
      <button
        type="button"
        onClick={() => onSeekTo(screenshot.timestamp)}
        className="relative block w-full bg-slate-100 text-left"
        aria-label={`${timestamp} に移動`}
      >
        <img
          src={screenshot.dataUrl}
          alt={`${timestamp} の候補`}
          className="aspect-video w-full object-cover"
        />
        <div className="absolute left-2 top-2 rounded-xl bg-white/90 px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur">
          {timestamp}
        </div>
        <div className={`absolute right-2 top-2 rounded-xl px-2 py-1 text-xs font-semibold ${toneClass}`}>
          {scoreLabel.label} {score}
        </div>
      </button>

      <div className="flex items-center justify-between gap-2 p-3">
        <label className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={screenshot.selected}
            onChange={() => onToggleSelected(screenshot.id)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
          />
          <span className="truncate">{screenshot.selected ? '選択中' : '候補'}</span>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPreview(screenshot)}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="拡大表示"
          >
            <ExpandIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={copying}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-50"
            aria-label="コピー"
          >
            <CopyIcon className="h-4 w-4" />
          </button>
          <a
            href={screenshot.dataUrl}
            download={fileName}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="ダウンロード"
          >
            <DownloadIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
};
