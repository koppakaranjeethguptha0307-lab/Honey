import React, { useState, useEffect } from 'react';
import { 
  Bell, AlertTriangle, CheckCircle, Eye, EyeOff, Filter, RefreshCw
} from 'lucide-react';
import { getAlerts, markAlertRead, markAlertUnread } from '../utils/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';

export function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [severityFilter, setSeverityFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (severityFilter) params.severity = severityFilter;
    if (readFilter !== '') params.is_read = readFilter;

    const res = await getAlerts(params);
    if (res.success) {
      setAlerts(res.data || []);
    } else {
      setError(res.error || 'Failed to fetch alerts');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, readFilter]);

  const handleToggleRead = async (alertId, currentIsRead) => {
    const res = currentIsRead 
      ? await markAlertUnread(alertId) 
      : await markAlertRead(alertId);

    if (res.success) {
      loadAlerts();
    } else {
      alert(res.error || 'Failed to update alert state');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <Bell className="w-7 h-7 text-amber-500" />
            <span>Smart Automated Alerts Feed</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Real-time hive anomaly detection notifications (temperature spikes, humidity shifts, weight loss).
          </p>
        </div>

        <button
          onClick={loadAlerts}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Alerts
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs font-semibold text-stone-400 font-['Outfit']">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-400 font-['Outfit']">Status:</span>
            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Notifications</option>
              <option value="0">Unread Only</option>
              <option value="1">Read Only</option>
            </select>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadAlerts} />}

      {/* Alerts Feed List */}
      {loading ? (
        <LoadingSpinner message="Loading alert notifications..." />
      ) : alerts.length === 0 ? (
        <EmptyState 
          title="No Alerts Found" 
          description="There are no alert notifications matching your current filter criteria." 
          icon={Bell}
        />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isCritical = String(alert.severity).toUpperCase() === 'CRITICAL';
            const isWarning = String(alert.severity).toUpperCase() === 'WARNING';
            const isRead = Number(alert.is_read) === 1;

            return (
              <div 
                key={alert.id} 
                className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isRead 
                    ? 'opacity-60 border-stone-800/60 bg-stone-950/40' 
                    : isCritical 
                    ? 'border-rose-500/30 bg-rose-950/20' 
                    : isWarning 
                    ? 'border-amber-500/30 bg-amber-950/20' 
                    : 'border-stone-800'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    isWarning ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isCritical ? 'bg-rose-900/80 text-rose-200' :
                        isWarning ? 'bg-amber-900/80 text-amber-200' :
                        'bg-stone-800 text-stone-300'
                      }`}>
                        {alert.severity || 'INFO'}
                      </span>
                      {alert.alert_type && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                          {alert.alert_type}
                        </span>
                      )}
                      <span className="text-[11px] text-stone-500">
                        {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-stone-100 font-['Outfit']">{alert.title}</h4>
                    <p className="text-xs text-stone-300 leading-relaxed">{alert.message}</p>
                    
                    {(alert.hive_id || alert.farm_id) && (
                      <div className="pt-1 text-[11px] text-stone-400 font-mono space-x-3">
                        {alert.hive_id && <span>Hive ID: #{alert.hive_id}</span>}
                        {alert.farm_id && <span>Farm ID: #{alert.farm_id}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleToggleRead(alert.id, isRead)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
                      isRead
                        ? 'text-stone-400 bg-stone-900 hover:bg-stone-800 border-stone-800'
                        : 'text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border-amber-800/60'
                    }`}
                  >
                    {isRead ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{isRead ? 'Mark Unread' : 'Mark Read'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
