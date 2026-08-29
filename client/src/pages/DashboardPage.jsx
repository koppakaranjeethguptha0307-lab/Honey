import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, Cpu, Package, Beaker, Factory, Truck, Bell, ShieldCheck, 
  ArrowUpRight, AlertTriangle, RefreshCw
} from 'lucide-react';
import { 
  getFarmStats, getHiveStats, getBatchStats, getQualityStats, 
  getProcessingStats, getPackagingStats, getTransportationStats, 
  getAlerts, getBatches 
} from '../utils/api';
import { StatCard } from '../components/dashboard/StatCard';
import { StatusProgressStepper } from '../components/dashboard/StatusProgressStepper';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

export function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    farms: null,
    hives: null,
    batches: null,
    quality: null,
    processing: null,
    packaging: null,
    transport: null,
    activeAlerts: [],
    recentBatches: []
  });

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        resFarms, resHives, resBatches, resQuality, 
        resProc, resPack, resTrans, resAlerts, resBatchList
      ] = await Promise.all([
        getFarmStats(),
        getHiveStats(),
        getBatchStats(),
        getQualityStats(),
        getProcessingStats(),
        getPackagingStats(),
        getTransportationStats(),
        getAlerts({ is_read: 0 }),
        getBatches()
      ]);

      setStats({
        farms: resFarms.success ? resFarms.data : null,
        hives: resHives.success ? resHives.data : null,
        batches: resBatches.success ? resBatches.data : null,
        quality: resQuality.success ? resQuality.data : null,
        processing: resProc.success ? resProc.data : null,
        packaging: resPack.success ? resPack.data : null,
        transport: resTrans.success ? resTrans.data : null,
        activeAlerts: resAlerts.success && Array.isArray(resAlerts.data) ? resAlerts.data.slice(0, 5) : [],
        recentBatches: resBatchList.success && Array.isArray(resBatchList.data) ? resBatchList.data.slice(0, 5) : []
      });
    } catch (err) {
      setError('Failed to connect to backend telemetry endpoints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading System Telemetry Dashboard..." />;

  const batchStatusData = stats.batches && stats.batches.status_breakdown ? 
    Object.entries(stats.batches.status_breakdown).map(([name, value]) => ({ name, value })) : [];

  const COLORS = ['#f59e0b', '#3b82f6', '#06b6d4', '#a855f7', '#6366f1', '#10b981'];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight">
            Honey Chain Command Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Real-time supply chain overview & smart apiary monitoring metrics.
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadDashboardData} />}

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Apiary Farms" 
          value={stats.farms?.total_farms} 
          subtext={`${stats.farms?.total_hives || 0} Total Hives Registered`}
          icon={MapPin}
          color="amber"
        />
        <StatCard 
          title="Active Hives" 
          value={stats.hives?.active_hives} 
          subtext={`${stats.hives?.total_sensor_readings || 0} Telemetry Readings`}
          icon={Cpu}
          color="sky"
        />
        <StatCard 
          title="Harvested Batches" 
          value={stats.batches?.total_batches} 
          subtext={`${stats.batches?.total_quantity_kg || 0} kg Total Honey`}
          icon={Package}
          color="purple"
        />
        <StatCard 
          title="Active Alerts" 
          value={stats.activeAlerts.length} 
          subtext="Requires Attention"
          icon={Bell}
          color={stats.activeAlerts.length > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Pipeline Stage Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-['Outfit'] font-semibold">Quality Tests</p>
            <p className="text-xl font-bold text-stone-100 font-['Outfit'] mt-0.5">
              {stats.quality?.approved_tests || 0} <span className="text-xs text-stone-400 font-normal">/ {stats.quality?.total_tests || 0} Approved</span>
            </p>
          </div>
          <Beaker className="w-6 h-6 text-blue-400" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-['Outfit'] font-semibold">Processing</p>
            <p className="text-xl font-bold text-stone-100 font-['Outfit'] mt-0.5">
              {stats.processing?.completed_records || 0} <span className="text-xs text-stone-400 font-normal">/ {stats.processing?.total_records || 0} Complete</span>
            </p>
          </div>
          <Factory className="w-6 h-6 text-sky-400" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-['Outfit'] font-semibold">Packaging</p>
            <p className="text-xl font-bold text-stone-100 font-['Outfit'] mt-0.5">
              {stats.packaging?.total_bottles_packaged || 0} <span className="text-xs text-stone-400 font-normal">Bottles</span>
            </p>
          </div>
          <Package className="w-6 h-6 text-purple-400" />
        </div>

        <div className="glass-panel p-4 rounded-xl border border-stone-800 flex items-center justify-between">
          <div>
            <p className="text-xs text-stone-400 font-['Outfit'] font-semibold">Transport Deliveries</p>
            <p className="text-xl font-bold text-stone-100 font-['Outfit'] mt-0.5">
              {stats.transport?.delivered_records || 0} <span className="text-xs text-stone-400 font-normal">/ {stats.transport?.total_records || 0} Delivered</span>
            </p>
          </div>
          <Truck className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* Visual Charts & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Batch Status Breakdown Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-stone-800 lg:col-span-2">
          <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] mb-4 flex items-center justify-between">
            <span>Honey Batch Lifecycle Breakdown</span>
            <span className="text-xs text-stone-400 font-normal">Real Data</span>
          </h3>

          {batchStatusData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={batchStatusData}>
                  <XAxis dataKey="name" stroke="#a8a29e" fontSize={11} />
                  <YAxis stroke="#a8a29e" fontSize={11} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '0.5rem', color: '#f5f5f4' }} 
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-stone-400 text-xs">
              No honey batch status data available.
            </div>
          )}
        </div>

        {/* Unread Smart Alerts */}
        <div className="glass-panel rounded-2xl p-6 border border-stone-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Active Smart Alerts</span>
              </h3>
              <Link to="/alerts" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                View All <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {stats.activeAlerts.length > 0 ? (
              <div className="space-y-3">
                {stats.activeAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-xl bg-stone-950/60 border border-stone-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-rose-400 uppercase font-mono">{alert.severity || 'ALERT'}</span>
                      <span className="text-[10px] text-stone-400">{new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs font-medium text-stone-200">{alert.title}</p>
                    <p className="text-[11px] text-stone-400 truncate">{alert.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-stone-400 text-xs border border-dashed border-stone-800 rounded-xl">
                No active unread alerts. All hives operating in optimal status.
              </div>
            )}
          </div>

          <Link
            to="/alerts"
            className="mt-4 w-full py-2.5 text-center text-xs font-semibold text-amber-400 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/50 rounded-xl transition-all block"
          >
            Manage Alert Subscriptions
          </Link>
        </div>

      </div>

      {/* Latest Honey Batches Stepper Feed */}
      <div className="glass-panel rounded-2xl p-6 border border-stone-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-100 font-['Outfit']">Recent Honey Batches & Lifecycle Progress</h3>
          <Link to="/batches" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
            View All Batches <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats.recentBatches.length > 0 ? (
          <div className="space-y-4 divide-y divide-stone-800/60">
            {stats.recentBatches.map((batch) => (
              <div key={batch.batch_id} className="pt-4 first:pt-0 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Link to={`/verify/${batch.batch_id}`} className="font-mono font-bold text-amber-400 hover:underline text-sm">
                      {batch.batch_id}
                    </Link>
                    <span className="text-xs text-stone-300 font-medium">{batch.honey_type}</span>
                    <span className="text-xs text-stone-400">({batch.quantity} {batch.unit})</span>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>
                <StatusProgressStepper currentStatus={batch.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-stone-400 text-xs">
            No honey batches created yet. Visit Farm or Batch Management to harvest a batch.
          </div>
        )}
      </div>

    </div>
  );
}
