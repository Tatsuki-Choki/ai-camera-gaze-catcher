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

const SeekIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 2.5v11l9-5.5-9-5.5z" fill="currentColor" />
    <rect x="13" y="2.5" width="1.5" height="11" fill="currentColor" />
  </svg>
);

const overlayButtonClass =
  'rounded-lg bg-panel-2 p-2 text-mid transition hover:bg-inset hover:text-hi focus-visible:ring-2 focus-visible:ring-accent outline-none disabled:opacity-50';

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
    strong: 'bg-accent text-on-accent',
    good: 'border border-white/60 text-accent',
    check: 'border border-line-strong text-mid',
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
    const fileName = `camera-gaze_${formatTimestamp(screenshot.time, '-')}_${score}.${extension}`;
    const url = URL.createObjectURL(screenshot.fullBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-xl border bg-panel shadow-panel transition duration-200 ${
        screenshot.selected
          ? 'border-accent shadow-[0_0_0_1px_var(--accent)]'
          : 'border-line hover:border-line-strong hover:bg-panel-2'
      }`}
    >
      {/* 画像クリック = 選択トグル（サムネ選びの主動作） */}
      <button
        type="button"
        onClick={() => onToggleSelected(screenshot.id)}
        aria-pressed={screenshot.selected}
        aria-label={`${timestamp} の候補を${screenshot.selected ? '選択解除' : '選択'}（スコア ${score}）`}
        className="relative block w-full bg-stage-deep outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <img
          src={screenshot.thumbUrl}
          alt=""
          loading="lazy"
          className={`aspect-video w-full object-cover transition duration-200 ${
            screenshot.selected ? '' : 'opacity-90 group-hover:opacity-100'
          }`}
        />

        {/* 選択チェック */}
        <span
          aria-hidden="true"
          className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border transition ${
            screenshot.selected
              ? 'border-accent bg-accent text-on-accent'
              : 'border-white/30 bg-black/50 text-transparent backdrop-blur group-hover:text-white/60'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <span
          className={`font-tc absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wider backdrop-blur ${toneClass}`}
        >
          {scoreLabel.label} {score}
        </span>
      </button>

      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="font-tc text-xs text-mid">{timestamp}</span>
        <div className="flex items-center gap-0.5 opacity-60 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onSeekTo(screenshot.time)}
            className={overlayButtonClass}
            aria-label={`${timestamp} に移動`}
            title="この時刻へ移動"
          >
            <SeekIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPreview(screenshot)}
            className={overlayButtonClass}
            aria-label="拡大表示"
            title="拡大表示"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={copying}
            className={overlayButtonClass}
            aria-label="クリップボードにコピー"
            title="コピー"
          >
            <CopyIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={overlayButtonClass}
            aria-label="ダウンロード"
            title="ダウンロード"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
