import React from 'react';

interface SelectionBarProps {
  selectedCount: number;
  zipping: boolean;
  onClearSelection: () => void;
  onDownloadSelected: () => void;
}

/** 候補を選択している間だけ画面下部に現れるアクションバー */
export const SelectionBar: React.FC<SelectionBarProps> = ({
  selectedCount,
  zipping,
  onClearSelection,
  onDownloadSelected,
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line-strong bg-ink-800/95 py-2 pl-5 pr-2 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md animate-slide-up">
        <span className="font-tc text-sm text-hi">
          <span className="text-amber">{selectedCount}</span>
          <span className="text-mid"> 件選択中</span>
        </span>
        <span className="h-5 w-px bg-line-strong" aria-hidden="true" />
        <button
          type="button"
          onClick={onClearSelection}
          className="rounded-lg px-3 py-2 text-xs font-medium text-mid transition hover:text-hi"
        >
          解除
        </button>
        <button
          type="button"
          onClick={onDownloadSelected}
          disabled={zipping}
          className="rounded-xl bg-amber px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-amber-hi disabled:cursor-not-allowed disabled:opacity-60"
        >
          {zipping ? 'ZIP作成中…' : 'ZIPで保存'}
        </button>
      </div>
    </div>
  );
};
