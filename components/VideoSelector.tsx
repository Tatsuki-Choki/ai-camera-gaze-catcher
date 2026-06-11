import React, { useRef, useState } from 'react';

interface VideoSelectorProps {
  onVideoSelect: (file: File) => void;
}

const isSupportedVideo = (file: File) => (
  file.type === 'video/mp4' || file.type === 'video/quicktime' || file.type === 'video/webm'
);

// ビューファインダーの四隅マーカー
const Corner: React.FC<{ className: string }> = ({ className }) => (
  <span
    aria-hidden="true"
    className={`pointer-events-none absolute h-6 w-6 border-amber/70 transition-all duration-300 group-hover:border-amber ${className}`}
  />
);

export const VideoSelector: React.FC<VideoSelectorProps> = ({ onVideoSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rejected, setRejected] = useState(false);

  const selectFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    if (isSupportedVideo(file)) {
      setRejected(false);
      onVideoSelect(file);
      return;
    }
    setRejected(true);
  };

  return (
    <button
      type="button"
      className={`group relative flex min-h-[420px] w-full flex-col items-center justify-center gap-6 overflow-hidden bg-ink-950 px-6 py-16 text-center outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-amber sm:min-h-[480px] ${
        isDragging ? 'bg-ink-850' : ''
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
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* ビューファインダー枠 */}
      <Corner className="left-6 top-6 border-l border-t" />
      <Corner className="right-6 top-6 border-r border-t" />
      <Corner className="bottom-6 left-6 border-b border-l" />
      <Corner className="bottom-6 right-6 border-b border-r" />

      {/* 中央クロスヘア */}
      <span
        aria-hidden="true"
        className={`absolute left-1/2 top-[18%] -translate-x-1/2 text-low transition-all duration-500 ${
          isDragging ? 'scale-125 text-amber' : 'group-hover:text-mid'
        }`}
      >
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="28" y1="0" x2="28" y2="12" stroke="currentColor" strokeWidth="1" />
          <line x1="28" y1="44" x2="28" y2="56" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="28" x2="12" y2="28" stroke="currentColor" strokeWidth="1" />
          <line x1="44" y1="28" x2="56" y2="28" stroke="currentColor" strokeWidth="1" />
        </svg>
      </span>

      <div className="relative mt-24 animate-rise">
        <p className="font-tc text-[10px] uppercase tracking-[0.4em] text-amber">
          Drop your footage
        </p>
        <h2 className="font-credit mt-4 text-3xl font-bold leading-snug tracking-wide text-hi sm:text-4xl">
          視線が、サムネになる。
        </h2>
        <p className="mt-4 text-sm leading-7 text-mid">
          動画をドロップすると、カメラ目線の一瞬をAIが探し出します。
          <br className="hidden sm:block" />
          解析はすべてブラウザ内。動画が外に出ることはありません。
        </p>
      </div>

      <div className="relative flex items-center gap-2 animate-rise" style={{ animationDelay: '120ms' }}>
        {['MP4', 'MOV', 'WEBM'].map((format) => (
          <span
            key={format}
            className="font-tc rounded border border-line px-2.5 py-1 text-[10px] tracking-[0.2em] text-mid"
          >
            {format}
          </span>
        ))}
      </div>

      {rejected && (
        <p className="relative text-sm text-rec" role="alert">
          対応していない形式です。MP4 / MOV / WebM を選んでください。
        </p>
      )}

      <span
        className={`font-tc relative text-[11px] tracking-[0.25em] transition-colors ${
          isDragging ? 'text-amber' : 'text-low'
        }`}
      >
        {isDragging ? 'RELEASE TO LOAD' : 'クリックでファイルを選択'}
      </span>
    </button>
  );
};
