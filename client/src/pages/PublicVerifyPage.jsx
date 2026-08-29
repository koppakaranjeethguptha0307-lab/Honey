import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, AlertTriangle, MapPin, Award, Beaker, Factory, 
  Package, Truck, Database, Calendar, CheckCircle2, ArrowLeft, QrCode, Search
} from 'lucide-react';
import { verifyBatchPublic } from '../utils/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { StatusBadge } from '../components/common/StatusBadge';
import { TimelineView } from '../components/common/TimelineView';
import { FarmMap } from '../components/common/FarmMap';
import { QRDisplay } from '../components/common/QRDisplay';

export function PublicVerifyPage() {
  const { batchId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notAvailableData, setNotAvailableData] = useState(null);

  const loadVerification = async () => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    setNotAvailableData(null);
    setData(null);

    const res = await verifyBatchPublic(batchId);
    
    if (res.success) {
      if (res.verified === false) {
        setNotAvailableData(res);
      } else {
        setData(res.data);
      }
    } else {
      setError(res.error || `Honey batch '${batchId}' not found`);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVerification();
  }, [batchId]);

  if (loading) return <LoadingSpinner message={`Verifying cryptographic hash chain for ${batchId}...`} />;

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-['Plus_Jakarta_Sans']">
      
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-amber-400 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <span className="text-xs font-mono text-stone-500">
          Public Verification API (Unauthenticated)
        </span>
      </div>

      {/* Error state (404) */}
      {error && (
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/30 text-center space-y-4 max-w-lg mx-auto">
          <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl w-fit mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-stone-100 font-['Outfit']">Batch Verification Failed</h2>
          <p className="text-sm text-stone-300">{error}</p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all"
            >
              <Search className="w-4 h-4" />
              Try Another Batch ID
            </Link>
          </div>
        </div>
      )}

      {/* Batch Not Yet Available for Public Verification */}
      {notAvailableData && (
        <div className="glass-panel p-8 rounded-3xl border border-amber-500/30 text-center space-y-4 max-w-xl mx-auto">
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl w-fit mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
            {notAvailableData.verification_status || 'NOT AVAILABLE FOR PUBLIC VERIFICATION'}
          </span>
          <h2 className="text-xl font-bold text-stone-100 font-['Outfit'] mt-2">
            Batch #{notAvailableData.batch_id || batchId} Incomplete
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-md mx-auto">
            {notAvailableData.message}
          </p>
          <div className="pt-2 text-xs text-stone-400">
            Current Stage: <StatusBadge status={notAvailableData.current_stage || 'IN_PROGRESS'} />
          </div>
        </div>
      )}

      {/* VERIFIED HONEY BATCH DISPLAY */}
      {data && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Provenance Header Banner */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 via-[#181410] to-[#120e0b] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>VERIFIED HONEY BATCH</span>
              </div>
              <span className="font-mono text-xs text-stone-400">SHA-256 PROVENANCE GUARANTEED</span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-stone-400">BATCH IDENTIFIER</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-mono tracking-tight">{data.batch_id}</h1>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-stone-400">HONEY TYPE & QUANTITY</span>
                <p className="text-lg font-bold text-stone-100 font-['Outfit']">{data.honey_type} ({data.quantity} {data.unit})</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-stone-800">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block font-['Outfit']">Apiary Farm</span>
              <p className="text-sm font-bold text-stone-100 mt-1 truncate">{data.farm ? data.farm.name : 'Registered Apiary'}</p>
              <p className="text-[11px] text-stone-500">{data.farm ? `${data.farm.district || ''}, ${data.farm.state || ''}` : 'Location Verified'}</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-stone-800">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block font-['Outfit']">Quality Grade</span>
              <p className="text-sm font-bold text-amber-400 mt-1">{data.quality_summary?.quality_grade || 'GRADE_A'}</p>
              <p className="text-[11px] text-stone-500">Purity: {data.quality_summary?.purity_pct || 98}%</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-stone-800">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block font-['Outfit']">Bottling Facility</span>
              <p className="text-sm font-bold text-stone-100 mt-1 truncate">{data.packaging_summary?.facility || 'Certified Plant'}</p>
              <p className="text-[11px] text-stone-500">{data.packaging_summary?.bottle_count || 0} Glass Jars</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-stone-800">
              <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block font-['Outfit']">Logistics Status</span>
              <p className="text-sm font-bold text-emerald-400 mt-1">{data.transportation_summary?.status || data.status}</p>
              <p className="text-[11px] text-stone-500">{data.transportation_summary?.transporter_name || 'Swift Express'}</p>
            </div>
          </div>

          {/* Farm Origin & Geolocation Map */}
          {data.farm && (
            <div className="glass-panel rounded-2xl p-6 border border-stone-800 space-y-4">
              <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                <span>Origin Apiary Farm</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-2 text-xs text-stone-300">
                  <p><span className="text-stone-500">Farm Name:</span> <strong className="text-stone-100">{data.farm.name}</strong></p>
                  <p><span className="text-stone-500">Beekeeper:</span> {data.farm.farmer_name || 'N/A'}</p>
                  <p><span className="text-stone-500">Location:</span> {[data.farm.location, data.farm.village, data.farm.district, data.farm.state, data.farm.country].filter(Boolean).join(', ')}</p>
                  <p><span className="text-stone-500">Coordinates:</span> <code className="font-mono text-amber-400">{data.farm.lat}, {data.farm.lng}</code></p>
                </div>

                <FarmMap 
                  lat={data.farm.lat} 
                  lng={data.farm.lng} 
                  farmName={data.farm.name} 
                  farmerName={data.farm.farmer_name} 
                  location={data.farm.location} 
                  height="180px"
                />
              </div>
            </div>
          )}

          {/* Quality Analysis & Lab Results */}
          {data.quality_summary && (
            <div className="glass-panel rounded-2xl p-6 border border-stone-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-blue-400" />
                  <span>Certified Laboratory Quality Analysis</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                  {data.quality_summary.data_source || 'DEMO_QUALITY_RESULT'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-mono">Purity</span>
                  <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{data.quality_summary.purity_pct}%</p>
                </div>

                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-mono">Moisture</span>
                  <p className="text-lg font-bold text-sky-400 font-mono mt-0.5">{data.quality_summary.moisture_pct}%</p>
                </div>

                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-mono">Adulteration Check</span>
                  <p className="text-lg font-bold text-emerald-400 font-mono mt-0.5">{data.quality_summary.adulteration_check}</p>
                </div>

                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <span className="text-[10px] text-stone-500 uppercase font-mono">Assigned Grade</span>
                  <p className="text-lg font-bold text-amber-400 font-mono mt-0.5">{data.quality_summary.quality_grade}</p>
                </div>
              </div>
            </div>
          )}

          {/* Full Traceability Timeline */}
          <div className="glass-panel rounded-2xl p-6 border border-stone-800 space-y-4">
            <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              <span>Complete Batch Provenance Timeline</span>
            </h3>

            <TimelineView events={data.traceability_timeline} />
          </div>

          {/* SHA-256 Blockchain Verification Section */}
          {data.blockchain_summary && (
            <div className="glass-panel rounded-2xl p-6 border border-stone-800 space-y-4 bg-gradient-to-b from-purple-950/20 via-[#181410] to-[#120e0b]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  <span>Demo SHA-256 Blockchain Traceability Audit</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800">
                  {data.blockchain_summary.verification_status || 'DEMO BLOCKCHAIN VERIFIED'}
                </span>
              </div>

              <p className="text-xs text-stone-400 leading-relaxed">
                {data.blockchain_summary.message}
              </p>

              {data.blockchain_summary.latest_tx_hash && (
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-[10px] text-stone-500 font-mono uppercase">Latest Transaction Hash</span>
                  <p className="text-xs font-mono text-amber-400 break-all">{data.blockchain_summary.latest_tx_hash}</p>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to={`/blockchain?batch_id=${data.batch_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:underline"
                >
                  <span>Inspect Full Raw Blockchain Block Ledger</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                </Link>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
