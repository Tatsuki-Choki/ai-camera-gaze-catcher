
import React, { useState } from 'react';
import type { Screenshot } from '../types';
import { ScreenshotCard } from './ScreenshotCard';
import { ImageModal } from './ImageModal';
import { Toast } from './Toast';

interface ResultsGridProps {
  screenshots: Screenshot[];
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({ screenshots }) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleExpand = (screenshot: Screenshot) => {
    setSelectedScreenshot(screenshot);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedScreenshot(null), 300);
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleCopySuccess = () => {
    showToast('クリップボードにコピーしました');
  };

  const handleCopyError = () => {
    showToast('コピーに失敗しました。ブラウザの設定を確認してください。', 'error');
  };
  return (
    <div className="mt-6 sm:mt-8 animate-slide-up">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">検出されたシーン</h2>
      {screenshots.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">カメラ目線のシーンがまだ見つかっていません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {screenshots.map((screenshot) => (
            <ScreenshotCard 
              key={screenshot.id} 
              screenshot={screenshot} 
              onExpand={handleExpand}
              onCopySuccess={handleCopySuccess}
              onCopyError={handleCopyError}
            />
          ))}
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
    </div>
  );
};