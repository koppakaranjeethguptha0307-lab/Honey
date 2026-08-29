import React from 'react';
import { 
  CheckCircle2, MapPin, User, Calendar, Award, Beaker, Factory, Package, Truck, ShieldCheck
} from 'lucide-react';

export function TimelineView({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 text-center text-stone-400 bg-stone-900/40 rounded-xl border border-stone-800">
        No traceability events recorded for this batch yet.
      </div>
    );
  }

  const getEventIcon = (eventType) => {
    const type = String(eventType || '').toUpperCase();
    if (type.includes('HARVEST')) return Award;
    if (type.includes('QUALITY') || type.includes('TEST')) return Beaker;
    if (type.includes('PROCESS')) return Factory;
    if (type.includes('PACK')) return Package;
    if (type.includes('TRANSPORT') || type.includes('DELIVER') || type.includes('PICKUP')) return Truck;
    return ShieldCheck;
  };

  return (
    <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:via-amber-500/50 before:to-emerald-500/20">
      {events.map((evt, idx) => {
        const Icon = getEventIcon(evt.event_type);
        const detailsObj = typeof evt.details === 'object' ? evt.details : null;

        return (
          <div key={idx} className="relative group">
            {/* Timeline Marker Icon */}
            <div className="absolute -left-[31px] top-0 p-1.5 rounded-full bg-[#1a1613] border-2 border-amber-500 text-amber-400 group-hover:scale-110 transition-transform">
              <Icon className="w-4 h-4" />
            </div>

            {/* Event Card */}
            <div className="glass-panel rounded-xl p-4 sm:p-5 border border-stone-800 hover:border-amber-500/30 transition-all">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-amber-400 text-sm tracking-wide uppercase font-['Outfit']">
                  {String(evt.event_type || '').replace(/_/g, ' ')}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-stone-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {evt.timestamp ? new Date(evt.timestamp).toLocaleString() : 'N/A'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-300 mb-3">
                {evt.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{evt.location}</span>
                  </div>
                )}
                {evt.actor && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{evt.actor}</span>
                  </div>
                )}
              </div>

              {/* Extra Event Details */}
              {detailsObj ? (
                <div className="bg-stone-950/60 rounded-lg p-3 text-xs space-y-1 text-stone-300 font-mono border border-stone-800/80">
                  {Object.entries(detailsObj).map(([key, val]) => (
                    <div key={key} className="flex justify-between gap-4">
                      <span className="text-stone-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-amber-200/90 font-medium truncate">{String(val)}</span>
                    </div>
                  ))}
                </div>
              ) : evt.details && typeof evt.details === 'string' ? (
                <p className="text-xs text-stone-400 italic bg-stone-950/40 p-2.5 rounded-lg border border-stone-800">
                  {evt.details}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
