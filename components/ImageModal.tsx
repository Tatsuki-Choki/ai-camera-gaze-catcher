import React, { useEffect } from 'react';
import type { Screenshot } from '../types';

interface ImageModalProps {
  screenshot: Screenshot | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export const ImageModal: React.FC<ImageModalProps> = ({ screenshot, isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !screenshot) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative max-w-7xl max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
          <span className="text-sm text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {formatTimestamp(screenshot.timestamp)}
          </span>
          <button
            onClick={onClose}
            className="bg-black/40 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/60 transition-all"
            aria-label="閉じる"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <img 
          src={screenshot.dataUrl} 
          alt={`Screenshot at ${formatTimestamp(screenshot.timestamp)}`}
          className="max-w-full max-h-[90vh] object-contain rounded-xl"
        />
      </div>
    </div>
  );
};