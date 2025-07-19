
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
      className="relative bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all cursor-pointer overflow-hidden group min-h-[200px] flex items-center justify-center hover:shadow-lg"
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
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-blue-200">
          <svg className="w-8 h-8 text-blue-600" xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'>
            <path fill='currentColor' d='M20 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-4 2H8v14h8zm4 12h-2v2h2zM6 17H4v2h2zm14-4h-2v2h2zM6 13H4v2h2zm14-4h-2v2h2zM6 9H4v2h2zm14-4h-2v2h2zM6 5H4v2h2z'/>
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">動画を選択</h2>
        <p className="text-sm text-gray-600 mb-4">ドラッグ＆ドロップまたはクリックしてアップロード</p>
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs">
          <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-xs font-medium">MP4</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-xs font-medium">MOV</span>
          <span className="px-3 py-1 bg-gray-100 rounded-full text-gray-700 text-xs font-medium">WebM</span>
        </div>
      </div>
    </div>
  );
};