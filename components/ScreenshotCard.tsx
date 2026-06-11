import React, { useState } from 'react';
import type { Screenshot } from '../types';
import { formatTimestamp } from '../services/formatTime';
import { getScoreLabel } from '../services/scoreLabel';
import { CopyIcon } from './icons/CopyIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { ExpandIcon } from './icons/ExpandIcon';

interface ScreenshotCardProps {
  screenshot: Screenshot;
  onPreview: (screenshot: Screenshot) => void;
  onSeekTo: (timestamp: number) => void;
  onToggleSelected: (id: string) => void;
  onCopySuccess: () => void;
  onCopyError: () => void;
}

// Chromeのクリップボードはimage/pngのみ受け付けるため、PNGへ変換してから書き込む
const copyImage = async (blob: Blob) => {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard API is not available.');
  }

  if (blob.type === 'image/png') {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return;
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvasコンテキストを取得できませんでした。');
    }
    context.drawImage(bitmap, 0, 0);
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('PNGへの変換に失敗しました。'));
        }
      }, 'image/png');
    });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
  } finally {
    bitmap.close();
  }
};

export const ScreenshotCard: React.FC<ScreenshotCardProps> = ({
  screenshot,
  onPreview,
  onSeekTo,
  onToggleSelected,
  onCopySuccess,
  onCopyError,
}) => {
  const [copying, setCopying] = useState(false);
  const timestamp = formatTimestamp(screenshot.time);
  const score = Math.round(screenshot.score * 100);
  const scoreLabel = getScoreLabel(screenshot.score);
  const toneClass = {
    strong: 'bg-emerald-100 text-emerald-700',
    good: 'bg-blue-100 text-blue-700',
    check: 'bg-amber-100 text-amber-700',
  }[scoreLabel.tone];

  const handleCopy = async () => {
    try {
      setCopying(true);
      await copyImage(screenshot.fullBlob);
      onCopySuccess();
    } catch {
      onCopyError();
    } finally {
      setCopying(false);
    }
  };

  const handleDownload = () => {
    const extension = screenshot.fullBlob.type === 'image/png' ? 'png' : 'jpg';
    const fileName = `camera-gaze_${timestamp.replace(':', '-')}_${score}.${extension}`;
    const url = URL.createObjectURL(screenshot.fullBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article
      className={`group overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70 ${
        screenshot.selected ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={() => onSeekTo(screenshot.time)}
        className="relative block w-full bg-slate-100 text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={`${timestamp} に移動`}
      >
        <img
          src={screenshot.thumbUrl}
          alt={`${timestamp} の候補（スコア ${score}）`}
          loading="lazy"
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
        <label className="flex min-w-0 cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
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
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="拡大表示"
          >
            <ExpandIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={copying}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
            aria-label="クリップボードにコピー"
          >
            <CopyIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="ダウンロード"
          >
            <DownloadIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
