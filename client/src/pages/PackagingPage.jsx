import React, { useState, useEffect } from 'react';
import { 
  Package, Plus, Search, Play, CheckCircle2, QrCode, Calendar, MapPin
} from 'lucide-react';
import { 
  getPackagingRecords, createPackagingRecord, startPackagingRecord, 
  completePackagingRecord, getBatches, getBatchQR 
} from '../utils/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { QRDisplay } from '../components/common/QRDisplay';

export function PackagingPage() {
  const [records, setRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [qrModalBatch, setQrModalBatch] = useState(null);
  const [qrData, setQrData] = useState(null);

  const [formData, setFormData] = useState({
    batch_id: '',
    facility: 'EcoPack Plant 4',
    packaging_date: new Date().toISOString().split('T')[0],
    package_type: 'Glass Jar',
    package_size: '500g',
    bottle_count: 300,
    label_info: '100% Raw Organic Wildflower Honey'
  });

  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [resPack, resBatches] = await Promise.all([
      getPackagingRecords({ status: statusFilter }),
      getBatches()
    ]);

    if (resPack.success) setRecords(resPack.data || []);
    else setError(resPack.error || 'Failed to fetch packaging records');

    if (resBatches.success) setBatches(resBatches.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    const processedBatches = batches.filter(b => b.status === 'PROCESSED' || b.processing_status === 'COMPLETED');
    const firstBatchId = processedBatches.length > 0 ? processedBatches[0].batch_id : (batches.length > 0 ? batches[0].batch_id : '');

    setFormData({
      batch_id: firstBatchId,
      facility: 'EcoPack Plant 4',
      packaging_date: new Date().toISOString().split('T')[0],
      package_type: 'Glass Jar',
      package_size: '500g',
      bottle_count: 300,
      label_info: '100% Raw Organic Wildflower Honey'
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const res = await createPackagingRecord({
      ...formData,
      bottle_count: Number(formData.bottle_count)
    });

    if (res.success) {
      setIsCreateOpen(false);
      loadData();
    } else {
      setFormError(res.error || 'Failed to create packaging record');
    }
    setSubmitting(false);
  };

  const handleStart = async (id) => {
    const res = await startPackagingRecord(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to start packaging');
    }
  };

  const handleComplete = async (record) => {
    const res = await completePackagingRecord(record.id);
    if (res.success) {
      loadData();
      handleOpenQR(record.batch_id);
    } else {
      alert(res.error || 'Failed to complete packaging');
    }
  };

  const handleOpenQR = async (batchId) => {
    setQrModalBatch(batchId);
    setQrData(null);
    const res = await getBatchQR(batchId);
    if (res.success) {
      setQrData(res.data);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-500" />
            <span>Bottling, Packaging & QR Generation</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Bottle count tracking, label printing, and automatic backend QR code identity generation.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Packaging Batch</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-400 font-['Outfit']">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Packaging States</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Packaging Records Grid */}
      {loading ? (
        <LoadingSpinner message="Loading packaging records..." />
      ) : records.length === 0 ? (
        <EmptyState 
          title="No Packaging Records Found" 
          description="There are no packaging records matching your filter criteria." 
          actionLabel="New Packaging Batch"
          onAction={handleOpenCreate}
          icon={Package}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => {
            const isPending = String(record.status).toUpperCase() === 'PENDING';
            const isInProgress = String(record.status).toUpperCase() === 'IN_PROGRESS';
            const isCompleted = String(record.status).toUpperCase() === 'COMPLETED';

            return (
              <div key={record.id} className="glass-panel glass-panel-hover rounded-2xl p-5 border border-stone-800 flex flex-col justify-between space-y-4">
                
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono text-stone-500 uppercase">RECORD #{record.id}</span>
                      <h3 className="text-sm font-bold text-amber-400 font-mono">{record.batch_id}</h3>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>

                  <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 space-y-2 mb-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Bottles Packaged:</span>
                      <span className="font-bold text-amber-400 font-mono">{record.bottle_count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Package Type / Size:</span>
                      <span className="font-semibold text-stone-200">{record.package_type} ({record.package_size})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Facility:</span>
                      <span className="font-medium text-stone-300">{record.facility}</span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-stone-400">
                    <p><span className="text-stone-500">Label Info:</span> {record.label_info || '100% Pure Honey'}</p>
                    <p><span className="text-stone-500">Date:</span> {record.packaging_date || 'N/A'}</p>
                  </div>
                </div>

                {/* Workflow Transitions */}
                <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                  {!isCompleted ? (
                    isPending ? (
                      <button
                        onClick={() => handleStart(record.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-stone-950 bg-purple-400 hover:bg-purple-300 rounded-xl transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-stone-950" />
                        Start Packaging
                      </button>
                    ) : (
                      <button
                        onClick={() => handleComplete(record)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-stone-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete & Generate QR
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleOpenQR(record.batch_id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-xl transition-all"
                    >
                      <QrCode className="w-4 h-4" />
                      View Generated QR Code
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create Packaging Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Honey Packaging & Bottling"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Target Processed Batch *</label>
            <select
              required
              value={formData.batch_id}
              onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 font-mono focus:border-amber-500"
            >
              <option value="">Select Batch...</option>
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>{b.batch_id} ({b.honey_type} - {b.status})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Packaging Facility *</label>
            <input
              type="text"
              required
              value={formData.facility}
              onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Package Type *</label>
              <input
                type="text"
                required
                value={formData.package_type}
                onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
                placeholder="e.g. Glass Jar, Squeeze Bottle"
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Package Size *</label>
              <input
                type="text"
                required
                value={formData.package_size}
                onChange={(e) => setFormData({ ...formData, package_size: e.target.value })}
                placeholder="e.g. 500g, 1kg, 250ml"
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Total Bottle Count *</label>
            <input
              type="number"
              required
              min="1"
              value={formData.bottle_count}
              onChange={(e) => setFormData({ ...formData, bottle_count: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Label Info / Remarks</label>
            <input
              type="text"
              value={formData.label_info}
              onChange={(e) => setFormData({ ...formData, label_info: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Packaging Date *</label>
            <input
              type="date"
              required
              value={formData.packaging_date}
              onChange={(e) => setFormData({ ...formData, packaging_date: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all"
            >
              {submitting ? 'Creating...' : 'Create Packaging Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={Boolean(qrModalBatch)}
        onClose={() => setQrModalBatch(null)}
        title={`Batch QR Identity — ${qrModalBatch}`}
      >
        <QRDisplay 
          batchId={qrModalBatch} 
          qrCodeUrl={qrData?.qr_code_data_url || qrData?.qr_code_url} 
          publicVerifyUrl={qrData?.verification_path ? `${window.location.origin}${qrData.verification_path}` : qrData?.public_verify_url} 
        />
      </Modal>

    </div>
  );
}
