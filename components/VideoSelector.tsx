
import React, { useRef } from 'react';

interface VideoSelectorProps {
  onVideoSelect: (file: File) => void;
}

export const VideoSelector: React.FC<VideoSelectorProps> = ({ onVideoSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === 'video/mp4' || file.type === 'video/quicktime' || file.type === 'video/webm')) {
      onVideoSelect(file);
    } else if (file) {
      alert('有効なビデオファイル（MP4, MOV, WebM）を選択してください。');
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className="relative bg-surface rounded-2xl border border-outline-variant hover:border-primary transition-all cursor-pointer overflow-hidden group min-h-[200px] flex items-center justify-center"
      onClick={handleClick}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="video/mp4,video/quicktime,video/webm"
      />
      <div className="text-center p-6 sm:p-8">
        <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-full bg-primary-container flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary-on-container" xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'>
            <path fill='currentColor' d='M20 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-4 2H8v14h8zm4 12h-2v2h2zM6 17H4v2h2zm14-4h-2v2h2zM6 13H4v2h2zm14-4h-2v2h2zM6 9H4v2h2zm14-4h-2v2h2zM6 5H4v2h2z'/>
          </svg>
        </div>
        <h2 className="text-base sm:text-lg font-medium text-on-surface mb-1">動画を選択</h2>
        <p className="text-xs sm:text-sm text-on-surface-variant mb-2 sm:mb-3">クリックしてアップロード</p>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs">
          <span className="px-2 py-0.5 sm:py-1 bg-surface-container-low rounded-full text-on-surface-variant">MP4</span>
          <span className="px-2 py-0.5 sm:py-1 bg-surface-container-low rounded-full text-on-surface-variant">MOV</span>
          <span className="px-2 py-0.5 sm:py-1 bg-surface-container-low rounded-full text-on-surface-variant">WebM</span>
        </div>
      </div>
    </div>
  );
};