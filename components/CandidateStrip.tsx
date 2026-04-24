import React, { useState } from 'react';
import type { Screenshot } from '../types';
import { ImageModal } from './ImageModal';
import { ScreenshotCard } from './ScreenshotCard';
import { Toast } from './Toast';

interface CandidateStripProps {
  screenshots: Screenshot[];
  selectedCount: number;
  zipping: boolean;
  onSeekTo: (timestamp: number) => void;
  onToggleSelected: (id: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDownloadSelected: () => void;
}

export const CandidateStrip: React.FC<CandidateStripProps> = ({
  screenshots,
  selectedCount,
  zipping,
  onSeekTo,
  onToggleSelected,
  onSelectAll,
  onClearSelection,
  onDownloadSelected,
}) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handlePreview = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedScreenshot(null), 200);
  };

  return (
    <section className="rounded-[28px] border border-white bg-white/85 p-4 shadow-xl shadow-slate-200/60 backdrop-blur">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-semibold text-slate-950">候補フィルムストリップ</h2>
          <p className="mt-1 text-sm text-slate-500">
            {screenshots.length === 0
              ? '解析すると候補が時刻順に並びます。'
              : `${selectedCount} / ${screenshots.length} 件を選択中`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={screenshots.length === 0}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            全選択
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            disabled={screenshots.length === 0}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            選択解除
          </button>
          <button
            type="button"
            onClick={onDownloadSelected}
            disabled={zipping || selectedCount === 0}
            className="rounded-2xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {zipping ? 'ZIP作成中...' : '選択分を保存'}
          </button>
        </div>
      </div>

      {screenshots.length === 0 ? (
        <div className="flex min-h-36 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-4 text-center text-sm text-slate-500">
          候補はここに横並びで表示されます。動画を見ながら、使う画像だけを選択できます。
        </div>
      ) : (
        <div className="-mx-1 overflow-x-auto px-1 pb-2">
          <div className="flex min-w-full gap-4">
            {screenshots.map((screenshot) => (
              <ScreenshotCard
                key={screenshot.id}
                screenshot={screenshot}
                compact
                onPreview={handlePreview}
                onSeekTo={onSeekTo}
                onToggleSelected={onToggleSelected}
                onCopySuccess={() => showToast('クリップボードにコピーしました')}
                onCopyError={() => showToast('コピーに失敗しました。ブラウザの権限を確認してください。', 'error')}
              />
            ))}
          </div>
        </div>
      )}

      <ImageModal
        screenshot={selectedScreenshot}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        type={toastType}
      />
    </section>
  );
};
