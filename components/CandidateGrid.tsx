import React, { useMemo, useState } from 'react';
import type { Screenshot } from '../types';
import { ImageModal } from './ImageModal';
import { ScreenshotCard } from './ScreenshotCard';
import { Toast } from './Toast';

type SortKey = 'time' | 'score';

interface CandidateGridProps {
  screenshots: Screenshot[];
  selectedCount: number;
  onSeekTo: (timestamp: number) => void;
  onToggleSelected: (id: string) => void;
  onSelectAll: () => void;
}

export const CandidateGrid: React.FC<CandidateGridProps> = ({
  screenshots,
  selectedCount,
  onSeekTo,
  onToggleSelected,
  onSelectAll,
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('time');
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const sorted = useMemo(() => {
    const next = [...screenshots];
    if (sortKey === 'score') {
      next.sort((a, b) => b.score - a.score);
    } else {
      next.sort((a, b) => a.time - b.time);
    }
    return next;
  }, [screenshots, sortKey]);

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

  if (screenshots.length === 0) {
    return null;
  }

  return (
    <section aria-label="候補一覧">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-tc text-[10px] uppercase tracking-[0.4em] text-amber">
            Candidates
          </p>
          <h2 className="font-credit mt-1 text-xl font-bold tracking-wide text-hi">
            候補 <span className="font-tc text-base text-mid">{screenshots.length}</span>
          </h2>
          <p className="mt-1 text-xs text-mid">
            クリックで選択。選んだ候補は下のバーからまとめて保存できます。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="並び順" className="flex rounded-lg border border-line bg-inset p-0.5">
            {([['time', '時刻順'], ['score', 'スコア順']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                aria-pressed={sortKey === key}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  sortKey === key
                    ? 'bg-panel text-hi shadow-sm'
                    : 'text-low hover:text-mid'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onSelectAll}
            disabled={selectedCount === screenshots.length}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-mid transition hover:border-line-strong hover:text-hi disabled:cursor-not-allowed disabled:opacity-40"
          >
            全選択
          </button>
        </div>
      </div>

      <ul className="grid list-none grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((screenshot, index) => (
          <li
            key={screenshot.id}
            className="animate-rise"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
            <ScreenshotCard
              screenshot={screenshot}
              onPreview={handlePreview}
              onSeekTo={onSeekTo}
              onToggleSelected={onToggleSelected}
              onCopySuccess={() => showToast('クリップボードにコピーしました')}
              onCopyError={() => showToast('コピーに失敗しました。ブラウザの権限を確認してください。', 'error')}
            />
          </li>
        ))}
      </ul>

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
