import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading Honey Chain telemetry...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-amber-500/80 animate-ping" />
        </div>
      </div>
      <p className="text-sm font-medium text-amber-300/80 font-['Outfit'] tracking-wide">{message}</p>
    </div>
  );
}
