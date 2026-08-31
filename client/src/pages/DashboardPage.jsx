import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, Cpu, Package, Beaker, Factory, Truck, Bell, ShieldCheck, 
  ArrowUpRight, AlertTriangle, RefreshCw, Search
} from 'lucide-react';
import { 
  getFarmStats, getHiveStats, getBatchStats, getQualityStats, 
  getProcessingStats, getPackagingStats, getTransportationStats, 
  getAlerts, getBatches 
} from '../utils/api';
import { useRole } from '../context/RoleContext';
import { StatCard } from '../components/dashboard/StatCard';
import { StatusProgressStepper } from '../components/dashboard/StatusProgressStepper';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export function DashboardPage() {
  const { currentRole, user } = useRole();
  const activeRole = (user?.role || currentRole?.id || 'admin').toLowerCase();

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
            {activeRole === 'beekeeper' && 'Beekeeper Command Center'}
            {activeRole === 'inspector' && 'Quality Inspection Hub'}
            {activeRole === 'transporter' && 'Logistics & Dispatch Center'}
            {activeRole === 'customer' && 'Honey Chain Provenance Portal'}
            {activeRole === 'admin' && 'Honey Chain Command Center'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Real-time supply chain overview & role-tailored operations monitoring.
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

      {/* Top Metrics Grid — Adapted by Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(activeRole === 'admin' || activeRole === 'beekeeper') && (
          <>
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
          </>
        )}

        {(activeRole === 'admin' || activeRole === 'beekeeper' || activeRole === 'inspector' || activeRole === 'transporter') && (
          <StatCard 
            title="Harvested Batches" 
            value={stats.batches?.total_batches} 
            subtext={`${stats.batches?.total_quantity_kg || 0} kg Total Honey`}
            icon={Package}
            color="purple"
          />
        )}

        {(activeRole === 'admin' || activeRole === 'inspector') && (
          <StatCard 
            title="Quality Tests" 
            value={stats.quality?.total_tests} 
            subtext={`Avg Purity: ${stats.quality?.average_purity || 0}%`}
            icon={Beaker}
            color="blue"
          />
        )}

        {(activeRole === 'admin' || activeRole === 'transporter') && (
          <StatCard 
            title="Transport Records" 
            value={stats.transport?.total_transport_records || stats.transport?.total_records} 
            subtext="Logistics & Dispatch Events"
            icon={Truck}
            color="emerald"
          />
        )}

        {(activeRole === 'admin' || activeRole === 'beekeeper') && (
          <StatCard 
            title="Active Alerts" 
            value={stats.activeAlerts.length} 
            subtext="Requires Attention"
            icon={Bell}
            color={stats.activeAlerts.length > 0 ? 'rose' : 'emerald'}
          />
        )}

        {activeRole === 'customer' && (
          <>
            <StatCard 
              title="Total Honey Batches" 
              value={stats.batches?.total_batches} 
              subtext="Blockchain Verified Batches"
              icon={Package}
              color="amber"
            />
            <StatCard 
              title="Lab Quality Average" 
              value={`${stats.quality?.average_purity || 99}%`} 
              subtext="Certified Pure Honey"
              icon={ShieldCheck}
              color="emerald"
            />
          </>
        )}
      </div>

      {/* Pipeline Stage Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Beaker className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase font-mono">Quality Pending</p>
              <p className="text-base font-bold text-stone-100 font-mono">
                {stats.quality?.by_status?.find(s => s.status === 'PENDING')?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase font-mono">Processing Active</p>
              <p className="text-base font-bold text-stone-100 font-mono">
                {stats.processing?.total_processing_records || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase font-mono">Packaging Records</p>
              <p className="text-base font-bold text-stone-100 font-mono">
                {stats.packaging?.total_packaging_records || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-stone-400 uppercase font-mono">In-Transit / Delivered</p>
              <p className="text-base font-bold text-stone-100 font-mono">
                {stats.transport?.total_transport_records || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Batches & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Honey Batches */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-100 font-['Outfit'] flex items-center gap-2">
              <Package className="w-4 h-4 text-amber-500" />
              <span>Recent Honey Batches</span>
            </h2>
            <Link to="/batches" className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium">
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.recentBatches.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">No recent batches available.</p>
            ) : (
              stats.recentBatches.map((batch) => (
                <div key={batch.batch_id} className="p-3.5 bg-stone-900/80 rounded-xl border border-stone-800/80 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{batch.batch_id}</span>
                      <StatusBadge status={batch.status} />
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      {batch.honey_type} • {batch.quantity} {batch.unit || 'kg'} • Grade: {batch.quality_grade || 'N/A'}
                    </p>
                  </div>
                  <Link 
                    to={`/verify/${batch.batch_id}`} 
                    className="px-2.5 py-1 text-[11px] font-semibold text-stone-300 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors shrink-0"
                  >
                    Verify QR
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-stone-800 flex flex-col justify-between space-y-4">
          <h2 className="text-base font-bold text-stone-100 font-['Outfit']">Batch Status Distribution</h2>
          
          <div className="h-48 w-full flex items-center justify-center">
            {batchStatusData.length === 0 ? (
              <p className="text-xs text-stone-500">No status data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={batchStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {batchStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800/80">
            {batchStatusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-stone-400">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="truncate">{entry.name}: <strong className="text-stone-200">{entry.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}

export default DashboardPage;
