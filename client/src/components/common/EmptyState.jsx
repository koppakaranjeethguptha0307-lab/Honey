import React from 'react';
import { Database, Plus } from 'lucide-react';

export function EmptyState({ title = 'No records found', description = 'There are no items matching your filter or query.', actionLabel, onAction, icon: Icon = Database }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-2xl border border-stone-800 my-4">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-bold text-stone-200 font-['Outfit'] mb-1">{title}</h3>
      <p className="text-sm text-stone-400 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
