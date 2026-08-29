import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, Hexagon, Search, ArrowRight, Award, Cpu, 
  Database, MapPin, Truck, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react';
import { getFarmStats, getHiveStats, getBatchStats } from '../utils/api';
import { useRole } from '../context/RoleContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { setRoleById } = useRole();
  const [searchBatchId, setSearchBatchId] = useState('');
  const [stats, setStats] = useState({
    farms: null,
    hives: null,
    batches: null,
  });

  useEffect(() => {
    async function loadStats() {
      const [resFarms, resHives, resBatches] = await Promise.all([
        getFarmStats(),
        getHiveStats(),
        getBatchStats(),
      ]);
      setStats({
        farms: resFarms.success ? resFarms.data : null,
        hives: resHives.success ? resHives.data : null,
        batches: resBatches.success ? resBatches.data : null,
      });
    }
    loadStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchBatchId.trim()) {
      navigate(`/verify/${searchBatchId.trim()}`);
    }
  };

  const handleRoleSelect = (roleId, path) => {
    setRoleById(roleId);
    navigate(path);
  };

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden glass-panel border border-amber-500/20 p-8 sm:p-14 text-center bg-gradient-to-b from-amber-950/30 via-[#181410] to-[#120e0b]">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Agro-Tech Provenance & Smart Beekeeping</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-stone-100 tracking-tight max-w-4xl mx-auto font-['Outfit'] leading-tight">
          100% Pure Honey Traceability <br />
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            From Apiary to Consumer
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed">
          Powered by IoT smart hive monitoring, certified quality testing, cold-chain logistics tracking, and immutable SHA-256 cryptographic blockchain audit.
        </p>

        {/* Public Verification Search Bar */}
        <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchBatchId}
              onChange={(e) => setSearchBatchId(e.target.value)}
              placeholder="Enter Batch ID (e.g. HC-2026-000001)..."
              className="w-full pl-11 pr-4 py-3.5 text-sm bg-stone-900/90 border border-stone-700 rounded-xl text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono shadow-inner"
            />
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-4 pointer-events-none" />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/25 shrink-0"
          >
            <span>Verify Provenance</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        
        <p className="text-xs text-stone-400 mt-3 font-mono">
          Try sample batch: <Link to="/verify/HC-2026-000001" className="text-amber-400 hover:underline">HC-2026-000001</Link>
        </p>
      </section>

      {/* Real Statistics Row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-stone-800 text-center">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Outfit']">Managed Apiary Farms</p>
          <p className="text-3xl font-extrabold text-amber-400 font-['Outfit'] mt-1">
            {stats.farms ? stats.farms.total_farms : '—'}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {stats.farms ? `${stats.farms.states_count} States Covered` : 'Active Regional Network'}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-stone-800 text-center">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Outfit']">Smart IoT Hives</p>
          <p className="text-3xl font-extrabold text-amber-400 font-['Outfit'] mt-1">
            {stats.hives ? stats.hives.total_hives : '—'}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {stats.hives ? `${stats.hives.total_sensor_readings} Telemetry Logs` : 'Live Hive Sensors'}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-stone-800 text-center">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Outfit']">Tracked Batches</p>
          <p className="text-3xl font-extrabold text-amber-400 font-['Outfit'] mt-1">
            {stats.batches ? stats.batches.total_batches : '—'}
          </p>
          <p className="text-[11px] text-stone-400 mt-1">
            {stats.batches ? `${stats.batches.total_quantity_kg} Total Harvested` : 'Verified Provenance'}
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-stone-800 text-center">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-['Outfit']">Blockchain Verification</p>
          <p className="text-3xl font-extrabold text-emerald-400 font-['Outfit'] mt-1">
            100%
          </p>
          <p className="text-[11px] text-stone-400 mt-1">SHA-256 Hash Audited</p>
        </div>
      </section>

      {/* Role Entry Points */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-100 font-['Outfit']">
            Select Role Demo Workflows
          </h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-2">
            Switch quick-demo roles to experience the system from each stakeholder's perspective.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div 
            onClick={() => handleRoleSelect('beekeeper', '/farms')}
            className="glass-panel glass-panel-hover rounded-2xl p-6 border border-amber-500/20 cursor-pointer group"
          >
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] group-hover:text-amber-400 transition-colors">
              Beekeeper & Farm Manager
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Manage apiary locations, hives, bee colonies, IoT telemetry readings, and record fresh honey harvest batches.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 mt-4">
              <span>Open Farm Portal</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div 
            onClick={() => handleRoleSelect('inspector', '/quality')}
            className="glass-panel glass-panel-hover rounded-2xl p-6 border border-amber-500/20 cursor-pointer group"
          >
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] group-hover:text-blue-400 transition-colors">
              Quality Testing Inspector
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Log purity and moisture laboratory test results, perform adulteration screening, and issue quality approvals.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 mt-4">
              <span>Open Quality Lab</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div 
            onClick={() => handleRoleSelect('transporter', '/transportation')}
            className="glass-panel glass-panel-hover rounded-2xl p-6 border border-amber-500/20 cursor-pointer group"
          >
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] group-hover:text-emerald-400 transition-colors">
              Cold-Chain Transporter
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Track logistics dispatch, manage pickup & delivery confirmation codes, and maintain temperature chain integrity.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 mt-4">
              <span>Open Logistics</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>

          <div 
            onClick={() => handleRoleSelect('customer', '/verify/HC-2026-000001')}
            className="glass-panel glass-panel-hover rounded-2xl p-6 border border-amber-500/20 cursor-pointer group"
          >
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 w-fit mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] group-hover:text-purple-400 transition-colors">
              Consumer QR Verification
            </h3>
            <p className="text-xs text-stone-400 mt-2 leading-relaxed">
              Scan or enter a honey jar QR code to inspect complete farm origin, lab test grade, packaging date, and SHA-256 audit.
            </p>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-400 mt-4">
              <span>Scan / Verify Code</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
