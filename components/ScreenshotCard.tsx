import React, { useState } from 'react';
import type { Screenshot } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { CopyIcon } from './icons/CopyIcon';
import { ExpandIcon } from './icons/ExpandIcon';

interface ScreenshotCardProps {
  screenshot: Screenshot;
  onExpand: (screenshot: Screenshot) => void;
  onCopySuccess?: () => void;
  onCopyError?: () => void;
}

const formatTimestamp = (seconds: number): string => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export const ScreenshotCard: React.FC<ScreenshotCardProps> = ({ screenshot, onExpand, onCopySuccess, onCopyError }) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const timestampFormatted = formatTimestamp(screenshot.timestamp);
  const fileName = `スクリーンショット_${timestampFormatted.replace(':', '-')}.jpg`;

  const copyToClipboard = async () => {
    try {
      setCopyStatus('copying');
      
      // Method 1: Try modern Clipboard API with blob
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          // Convert data URL to blob
          const response = await fetch(screenshot.dataUrl);
          const blob = await response.blob();
          
          // Create PNG blob if needed
          const pngBlob = blob.type === 'image/png' ? blob : await convertToPNG(blob);
          
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': pngBlob
            })
          ]);
          
          setCopyStatus('success');
          if (onCopySuccess) {
            onCopySuccess();
          }
          setTimeout(() => setCopyStatus('idle'), 2000);
          return;
        } catch (clipboardError) {
          console.warn('ClipboardItem method failed:', clipboardError);
          // Fall through to alternative method
        }
      }
      
      // Method 2: Create a canvas and copy as image
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              try {
                await navigator.clipboard.write([
                  new ClipboardItem({ 'image/png': blob })
                ]);
                setCopyStatus('success');
                if (onCopySuccess) {
                  onCopySuccess();
                }
              } catch (err) {
                throw err;
              }
            }
          }, 'image/png');
        }
      };
      img.onerror = () => {
        throw new Error('Failed to load image');
      };
      img.src = screenshot.dataUrl;
      
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
      setCopyStatus('error');
      if (onCopyError) {
        onCopyError();
      }
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };
  
  // Helper function to convert blob to PNG
  const convertToPNG = (blob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              resolve(pngBlob);
            } else {
              reject(new Error('Failed to convert to PNG'));
            }
          }, 'image/png');
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(blob);
    });
  };

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden transition-all hover:shadow-xl cursor-pointer border border-gray-200">
      <img 
        src={screenshot.dataUrl} 
        alt={`Screenshot at ${timestampFormatted}`} 
        className="w-full h-auto aspect-video object-cover" 
        onClick={() => onExpand(screenshot)}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white font-medium">
            {timestampFormatted}
          </span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard();
              }}
              disabled={copyStatus === 'copying'}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all disabled:opacity-50"
              aria-label="コピー"
            >
              <CopyIcon className="w-4 h-4" />
            </button>
            <a
              href={screenshot.dataUrl}
              download={fileName}
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all"
              aria-label="ダウンード"
            >
              <DownloadIcon className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};