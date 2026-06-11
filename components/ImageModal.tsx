import React, { useEffect, useRef, useState } from 'react';
import type { Screenshot } from '../types';
import { formatTimestamp } from '../services/formatTime';

interface ImageModalProps {
  screenshot: Screenshot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ screenshot, isOpen, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [fullUrl, setFullUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      closeButtonRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !screenshot) {
      return;
    }
    const url = URL.createObjectURL(screenshot.fullBlob);
    setFullUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setFullUrl(null);
    };
  }, [isOpen, screenshot]);

  if (!isOpen || !screenshot) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${formatTimestamp(screenshot.time)} の候補プレビュー`}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-7xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
          <span className="font-tc rounded-full border border-line bg-ink-900/90 px-3 py-1.5 text-xs text-hi backdrop-blur">
            {formatTimestamp(screenshot.time)}
            <span className="text-low"> / </span>
            <span className="text-amber">{Math.round(screenshot.score * 100)}</span>
          </span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-full border border-line bg-ink-900/90 p-2 text-mid backdrop-blur transition hover:text-hi focus-visible:ring-2 focus-visible:ring-amber outline-none"
            aria-label="閉じる"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <img
          src={fullUrl ?? screenshot.thumbUrl}
          alt={`${formatTimestamp(screenshot.time)} の候補`}
          className="max-h-[90vh] max-w-full rounded-lg border border-line object-contain"
        />
      </div>
    </div>
  );
};
