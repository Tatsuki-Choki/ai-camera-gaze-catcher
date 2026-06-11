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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`${formatTimestamp(screenshot.time)} の候補プレビュー`}
      onClick={onClose}
    >
      <div
        className="relative max-w-7xl max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <span className="text-sm text-slate-700 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {formatTimestamp(screenshot.time)} / score {Math.round(screenshot.score * 100)}
          </span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="bg-white/90 backdrop-blur-sm text-slate-700 rounded-full p-2 hover:bg-white transition-all focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <img
          src={fullUrl ?? screenshot.thumbUrl}
          alt={`${formatTimestamp(screenshot.time)} の候補`}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};
