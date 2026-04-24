import React, { useRef, useState } from 'react';

interface VideoSelectorProps {
  onVideoSelect: (file: File) => void;
}

const isSupportedVideo = (file: File) => (
  file.type === 'video/mp4' || file.type === 'video/quicktime' || file.type === 'video/webm'
);

export const VideoSelector: React.FC<VideoSelectorProps> = ({ onVideoSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (isSupportedVideo(file)) {
      onVideoSelect(file);
      return;
    }
    alert('有効なビデオファイル（MP4, MOV, WebM）を選択してください。');
  };

  return (
    <div
      className={`group relative flex min-h-[320px] cursor-pointer items-center justify-center overflow-hidden rounded-3xl border border-dashed bg-white transition hover:shadow-lg ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-500'
      }`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        selectFile(event.dataTransfer.files[0]);
      }}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={(event) => selectFile(event.target.files?.[0])}
        className="hidden"
        accept="video/mp4,video/quicktime,video/webm"
      />
      <div className="p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 transition group-hover:scale-105 group-hover:bg-blue-200">
          <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <path fill="currentColor" d="M20 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-4 2H8v14h8zm4 12h-2v2h2zM6 17H4v2h2zm14-4h-2v2h2zM6 13H4v2h2zm14-4h-2v2h2zM6 9H4v2h2zm14-4h-2v2h2zM6 5H4v2h2z" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-slate-950">動画を選択</h2>
        <p className="mb-4 text-sm text-slate-600">ドラッグ＆ドロップ、またはクリックして解析する動画を選択します。</p>
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">MP4</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">MOV</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">WebM</span>
        </div>
      </div>
    </div>
  );
};
