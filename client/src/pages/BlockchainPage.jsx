import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Database, ShieldCheck, AlertTriangle, Key, Hash, Link as LinkIcon, RefreshCw, CheckCircle2
} from 'lucide-react';
import { getBatchBlockchain, getBatches } from '../utils/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { StatusBadge } from '../components/common/StatusBadge';

export function BlockchainPage() {
  const [searchParams] = useSearchParams();
  const initialBatchId = searchParams.get('batch_id') || '';

  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [blockchainData, setBlockchainData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBatches = async () => {
    setLoading(true);
    const res = await getBatches();
    if (res.success && res.data && res.data.length > 0) {
      setBatches(res.data);
      const targetId = selectedBatchId || res.data[0].batch_id;
      setSelectedBatchId(targetId);
      loadBlockchainLedger(targetId);
    } else {
      setLoading(false);
    }
  };

  const loadBlockchainLedger = async (batchId) => {
    if (!batchId) return;
    setLoading(true);
    setError(null);
    const res = await getBatchBlockchain(batchId);
    if (res.success) {
      setBlockchainData(res.data);
    } else {
      setError(res.error || 'Failed to fetch blockchain ledger');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    setSelectedBatchId(batchId);
    loadBlockchainLedger(batchId);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-['Plus_Jakarta_Sans']">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-950/20 via-[#181410] to-[#120e0b]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <Database className="w-7 h-7 text-purple-400" />
            <span>Demo SHA-256 Blockchain Traceability Ledger</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Immutably chained audit blocks verifying zero data tampering across the entire supply chain.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBatchId}
            onChange={handleBatchChange}
            className="px-3.5 py-2 text-xs font-bold bg-stone-900 border border-stone-800 rounded-xl text-amber-400 focus:border-purple-500 font-mono"
          >
            {batches.map(b => (
              <option key={b.batch_id} value={b.batch_id}>{b.batch_id} ({b.honey_type})</option>
            ))}
          </select>

          <button
            onClick={() => loadBlockchainLedger(selectedBatchId)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-300 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/60 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Audit Chain
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => loadBlockchainLedger(selectedBatchId)} />}

      {loading ? (
        <LoadingSpinner message={`Validating SHA-256 hash sequence for ${selectedBatchId}...`} />
      ) : blockchainData ? (
        <div className="space-y-6">
          
          {/* Audit Result Status Banner */}
          <div className={`glass-panel p-6 rounded-2xl border flex flex-wrap items-center justify-between gap-4 ${
            blockchainData.verified 
              ? 'border-emerald-500/30 bg-emerald-950/20' 
              : 'border-rose-500/30 bg-rose-950/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${blockchainData.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {blockchainData.verified ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-stone-400">CRYPTOGRAPHIC AUDIT STATUS</span>
                <h3 className="text-lg font-bold text-stone-100 font-['Outfit']">
                  {blockchainData.status || (blockchainData.verified ? 'DEMO BLOCKCHAIN VERIFIED' : 'VERIFICATION FAILED')}
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">{blockchainData.message}</p>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-stone-400">
              <span>Total Block Height:</span>
              <p className="text-xl font-bold text-amber-400 font-['Outfit']">{blockchainData.block_count || (blockchainData.blocks ? blockchainData.blocks.length : 0)} Blocks</p>
            </div>
          </div>

          {/* Blocks Sequence Chained Visualizer */}
          <div className="space-y-6 relative before:absolute before:left-6 before:top-8 before:bottom-8 before:w-1 before:bg-purple-500/30">
            {blockchainData.blocks && blockchainData.blocks.map((block, idx) => (
              <div key={block.index || idx} className="relative pl-12">
                
                {/* Block Connector Node */}
                <div className="absolute left-3 top-6 -translate-x-1/2 w-7 h-7 rounded-full bg-stone-900 border-2 border-purple-500 flex items-center justify-center text-purple-400 text-xs font-mono font-bold z-10 shadow-lg">
                  {block.index !== undefined ? block.index : idx}
                </div>

                {/* Block Body */}
                <div className="glass-panel glass-panel-hover rounded-2xl p-6 border border-stone-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 uppercase">
                        BLOCK #{block.index !== undefined ? block.index : idx} — {block.event_type || block.data?.event_type || 'GENESIS / EVENT'}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-stone-400">
                      Timestamp: {block.timestamp ? new Date(block.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>

                  {/* Previous & Current Hashes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-stone-950/80 rounded-xl border border-stone-800 space-y-1">
                      <span className="text-stone-500 flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-purple-400" />
                        PREVIOUS BLOCK HASH
                      </span>
                      <p className="text-stone-300 break-all">{block.previous_hash || '00000000000000000000000000000000'}</p>
                    </div>

                    <div className="p-3 bg-stone-950/80 rounded-xl border border-purple-500/20 space-y-1">
                      <span className="text-purple-400 flex items-center gap-1 font-bold">
                        <Hash className="w-3 h-3 text-amber-400" />
                        BLOCK SHA-256 HASH
                      </span>
                      <p className="text-amber-300 font-bold break-all">{block.hash}</p>
                    </div>
                  </div>

                  {/* Block Payload Data */}
                  {block.data && (
                    <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/60 text-xs font-mono space-y-1">
                      <span className="text-stone-400 text-[10px] uppercase">Payload Data Payload:</span>
                      <pre className="text-stone-300 whitespace-pre-wrap overflow-x-auto text-[11px]">
                        {JSON.stringify(block.data, null, 2)}
                      </pre>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="p-12 text-center text-stone-400 text-xs glass-panel rounded-2xl border border-stone-800">
          No blockchain data available for the selected batch.
        </div>
      )}

    </div>
  );
}
