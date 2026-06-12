import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ScorePoint, Screenshot } from '../types';
import { formatTimestamp } from '../services/formatTime';

interface ScoreTimelineProps {
  points: ScorePoint[];
  candidates: Screenshot[];
  duration: number;
  currentTime: number;
  threshold: number;
  onSeek: (time: number) => void;
}

export const ScoreTimeline: React.FC<ScoreTimelineProps> = ({
  points,
  candidates,
  duration,
  currentTime,
  threshold,
  onSeek,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playheadCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(0);
  const height = 96;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.floor(entries[0].contentRect.width));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || duration <= 0) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const xOf = (time: number) => (time / duration) * width;
    const yOf = (score: number) => height - score * (height - 8) - 4;

    // ピクセル列ごとに最大スコアを取り、ピークを潰さずに間引く
    const columns = new Float32Array(width).fill(-1);
    for (const point of points) {
      const x = Math.min(width - 1, Math.max(0, Math.floor(xOf(point.time))));
      if (point.score > columns[x]) {
        columns[x] = point.score;
      }
    }

    // 閾値ライン
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, yOf(threshold));
    ctx.lineTo(width, yOf(threshold));
    ctx.stroke();
    ctx.setLineDash([]);

    // スコア曲線（エリア + ライン）
    ctx.beginPath();
    let started = false;
    for (let x = 0; x < width; x += 1) {
      if (columns[x] < 0) {
        continue;
      }
      const y = yOf(columns[x]);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    if (started) {
      ctx.strokeStyle = '#9b9b9b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(155, 155, 155, 0.22)');
      gradient.addColorStop(1, 'rgba(155, 155, 155, 0.02)');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    // 候補マーカー
    for (const candidate of candidates) {
      const x = xOf(candidate.time);
      const y = yOf(candidate.score);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = candidate.selected ? '#ffffff' : '#191919';
      ctx.fill();
      ctx.strokeStyle = '#9b9b9b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [points, candidates, duration, threshold, width]);

  // 再生位置は別レイヤーに描き、timeupdateごとの曲線全体の再描画を避ける
  useEffect(() => {
    const canvas = playheadCanvasRef.current;
    if (!canvas || width === 0 || duration <= 0) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const playheadX = (currentTime / duration) * width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [currentTime, duration, width]);

  const seekFromPointer = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container || duration <= 0) {
      return;
    }
    const rect = container.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }, [duration, onSeek]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (duration <= 0) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onSeek(Math.max(0, currentTime - 1));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      onSeek(Math.min(duration, currentTime + 1));
    }
  }, [currentTime, duration, onSeek]);

  if (points.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-tc text-[10px] uppercase tracking-[0.3em] text-stage-low">
          Gaze Score
        </span>
        <span className="font-tc text-xs text-stage-mid">
          <span className="text-stage-hi">{formatTimestamp(currentTime)}</span>
          <span className="text-stage-low"> / {formatTimestamp(duration)}</span>
        </span>
      </div>
      <div
        ref={containerRef}
        role="slider"
        aria-label="スコアタイムライン（クリックまたは左右キーでシーク）"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={formatTimestamp(currentTime)}
        tabIndex={0}
        className="relative cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent"
        onClick={(event) => seekFromPointer(event.clientX)}
        onKeyDown={handleKeyDown}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height }} />
        <canvas
          ref={playheadCanvasRef}
          className="pointer-events-none absolute inset-0"
          style={{ width: '100%', height }}
        />
      </div>
    </div>
  );
};
