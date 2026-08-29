import React from 'react';

export function StatCard({ title, value, subtext, icon: Icon, color = 'amber', trend }) {
  const colorMap = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const badgeStyle = colorMap[color] || colorMap.amber;

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-stone-800 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Outfit']">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] mt-1 tracking-tight">
            {value !== undefined && value !== null ? value : '—'}
          </h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${badgeStyle} shrink-0`}>
            <Icon className="w-5 h-5 stroke-[2]" />
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-800/80">
          {subtext && <span className="text-stone-400 font-medium">{subtext}</span>}
          {trend && (
            <span className={`font-semibold ${trend.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.positive ? '↑' : '↓'} {trend.text}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
