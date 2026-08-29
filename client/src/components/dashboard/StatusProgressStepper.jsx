import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';

const STAGES = [
  { key: 'HARVESTED', label: 'Harvested' },
  { key: 'QUALITY_TESTED', label: 'Quality Tested' },
  { key: 'PROCESSED', label: 'Processed' },
  { key: 'PACKAGED', label: 'Packaged' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DELIVERED', label: 'Delivered' }
];

export function StatusProgressStepper({ currentStatus }) {
  const currentUpper = String(currentStatus || '').toUpperCase().trim();
  
  let activeIndex = STAGES.findIndex(s => s.key === currentUpper);
  if (activeIndex === -1) {
    if (currentUpper === 'APPROVED') activeIndex = 1;
    else if (currentUpper === 'COMPLETED') activeIndex = 3;
    else activeIndex = 0;
  }

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-stone-800 -z-0 rounded-full" />
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-amber-500 to-emerald-500 -z-0 rounded-full transition-all duration-500"
          style={{ width: `${(activeIndex / (STAGES.length - 1)) * 100}%` }}
        />

        {STAGES.map((stage, idx) => {
          const isPassed = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10 group">
              <div 
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isPassed
                    ? 'bg-emerald-500 text-stone-950 shadow-md shadow-emerald-500/20 ring-4 ring-[#0f0d0b]'
                    : isCurrent
                    ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-500/30 animate-pulse'
                    : 'bg-stone-800 text-stone-500 border border-stone-700 ring-4 ring-[#0f0d0b]'
                }`}
              >
                {isPassed ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>
              <span className={`text-[10px] sm:text-xs font-semibold mt-2 font-['Outfit'] text-center ${
                isCurrent ? 'text-amber-400 font-bold' : isPassed ? 'text-emerald-400' : 'text-stone-500'
              }`}>
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
