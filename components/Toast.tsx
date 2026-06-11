import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed left-1/2 top-5 z-50 -translate-x-1/2 animate-slide-up" role="status">
      <div className="flex min-w-[220px] items-center gap-2.5 rounded-xl border border-line-strong bg-ink-800/95 px-4 py-3 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.9)] backdrop-blur-md">
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full ${type === 'success' ? 'bg-amber' : 'bg-rec'}`}
        />
        <span className="text-sm font-medium text-hi">{message}</span>
      </div>
    </div>
  );
};
