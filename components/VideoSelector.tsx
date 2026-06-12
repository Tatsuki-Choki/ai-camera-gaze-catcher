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
    className={`pointer-events-none absolute h-6 w-6 border-stage-low transition-all duration-300 group-hover:border-stage-mid ${className}`}
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
      className={`group relative flex min-h-[400px] w-full flex-col items-center justify-center gap-5 overflow-hidden px-6 py-14 text-center outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:min-h-[460px] ${
        isDragging ? 'bg-white/5' : ''
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
      <Corner className="left-5 top-5 border-l border-t" />
      <Corner className="right-5 top-5 border-r border-t" />
      <Corner className="bottom-5 left-5 border-b border-l" />
      <Corner className="bottom-5 right-5 border-b border-r" />

      {/* クロスヘア */}
      <span
        aria-hidden="true"
        className={`text-stage-low transition-all duration-500 ${
          isDragging ? 'scale-125 text-stage-hi' : 'group-hover:text-stage-mid'
        }`}
      >
        <svg width="52" height="52" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="20" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="28" y1="0" x2="28" y2="12" stroke="currentColor" strokeWidth="1" />
          <line x1="28" y1="44" x2="28" y2="56" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="28" x2="12" y2="28" stroke="currentColor" strokeWidth="1" />
          <line x1="44" y1="28" x2="56" y2="28" stroke="currentColor" strokeWidth="1" />
        </svg>
      </span>

      <div className="relative animate-rise">
        <p className="font-tc text-[10px] uppercase tracking-[0.4em] text-stage-mid">
          Step 1 — Drop your footage
        </p>
        <h2 className="mt-3 text-3xl font-bold leading-snug tracking-wide text-stage-hi sm:text-4xl">
          視線が、サムネになる。
        </h2>
        <p className="mt-3 text-sm leading-7 text-stage-mid">
          ここに動画をドロップ（またはクリックで選択）すると、
          <br className="hidden sm:block" />
          カメラ目線の一瞬をAIが探し出します。
        </p>
      </div>

      <span
        className={`relative inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-[#191919] transition animate-rise ${
          isDragging ? 'bg-white' : 'bg-white/90 group-hover:bg-white'
        }`}
        style={{ animationDelay: '100ms' }}
      >
        {isDragging ? 'ここにドロップ' : '動画ファイルを選択'}
      </span>

      <div className="relative flex items-center gap-2 animate-rise" style={{ animationDelay: '160ms' }}>
        {['MP4', 'MOV', 'WEBM'].map((format) => (
          <span
            key={format}
            className="font-tc rounded border border-stage-line px-2.5 py-1 text-[10px] tracking-[0.2em] text-stage-mid"
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

      <span className="font-tc relative text-[10px] tracking-[0.25em] text-stage-low">
        動画はアップロードされません — 解析はブラウザ内で完結
      </span>
    </button>
  );
};
