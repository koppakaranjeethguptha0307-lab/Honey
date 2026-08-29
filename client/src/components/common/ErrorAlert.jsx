import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function ErrorAlert({ message = 'An unexpected error occurred', statusCode, onRetry }) {
  return (
    <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 flex items-start justify-between gap-4 my-4 shadow-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-2 font-semibold text-sm text-rose-300 font-['Outfit']">
            <span>Server Error</span>
            {statusCode && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-900/80 text-rose-200 border border-rose-700">
                HTTP {statusCode}
              </span>
            )}
          </div>
          <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-900/80 hover:bg-rose-800 border border-rose-700 rounded-lg transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
