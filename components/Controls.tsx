
import React from 'react';
import { AnalysisStatus } from '../types';

interface ControlsProps {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  onStartAnalysis: () => void;
  onNewVideo: () => void;
  status: AnalysisStatus;
  progress: number;
}

export const Controls: React.FC<ControlsProps> = ({
  sensitivity,
  onSensitivityChange,
  onStartAnalysis,
  onNewVideo,
  status,
  progress,
}) => {
  const isProcessing = status === AnalysisStatus.Processing || status === AnalysisStatus.Initializing;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label htmlFor="sensitivity" className="text-sm font-medium text-gray-700">
              検出感度
            </label>
            <span className="text-sm font-medium text-blue-600">
              {Math.round((sensitivity - 0.1) / 0.8 * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">甘め</span>
            <div className="relative flex-1">
              <input
                id="sensitivity"
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={sensitivity}
                onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
                disabled={isProcessing}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(sensitivity - 0.1) / 0.8 * 100}%, #E5E7EB ${(sensitivity - 0.1) / 0.8 * 100}%, #E5E7EB 100%)`
                }}
              />
            </div>
            <span className="text-xs text-gray-500">厳しめ</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={onStartAnalysis}
            disabled={isProcessing}
            className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-lg hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                解析中...
              </>
            ) : '解析を開始'}
          </button>
          <button
            onClick={onNewVideo}
            disabled={isProcessing}
            className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            新しい動画
          </button>
        </div>
      </div>

      {(status !== AnalysisStatus.Idle) && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {status === AnalysisStatus.Initializing && 'AIモデルを初期化中...'}
              {status === AnalysisStatus.Processing && '動画を分析中...'}
              {status === AnalysisStatus.Done && '分析完了'}
              {status === AnalysisStatus.Error && 'エラーが発生しました'}
            </span>
            {status === AnalysisStatus.Processing && (
              <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};