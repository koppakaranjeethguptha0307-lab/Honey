import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Plus, Search, Award, ExternalLink, QrCode, Database, 
  ChevronRight, Calendar, Scale, MapPin, Beaker
} from 'lucide-react';
import { getBatches, createBatch, getFarms, getHives, getBatchQR } from '../utils/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { StatusProgressStepper } from '../components/dashboard/StatusProgressStepper';
import { QRDisplay } from '../components/common/QRDisplay';

const ALLOWED_HONEY_TYPES = [
  'Raw Honey',
  'Organic Honey',
  'Wildflower Honey',
  'Forest Honey',
  'Multi-floral Honey',
  'Monofloral Honey'
];

export function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [farms, setFarms] = useState([]);
  const [hives, setHives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [qrModalBatch, setQrModalBatch] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [qrError, setQrError] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const [formData, setFormData] = useState({
    farm_id: '',
    hive_id: '',
    harvest_date: new Date().toISOString().split('T')[0],
    honey_type: 'Wildflower Honey',
    quantity: 100.0,
    unit: 'kg'
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [resBatches, resFarms] = await Promise.all([
      getBatches({ search, status: statusFilter }),
      getFarms()
    ]);

    if (resBatches.success) setBatches(resBatches.data || []);
    else setError(resBatches.error || 'Failed to fetch honey batches');

    if (resFarms.success) setFarms(resFarms.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleFarmChangeInModal = async (farmId) => {
    setFormData(prev => ({ ...prev, farm_id: farmId, hive_id: '' }));
    if (farmId) {
      const res = await getHives({ farm_id: farmId });
      if (res.success && res.data) {
        setHives(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, hive_id: res.data[0].id }));
        }
      }
    } else {
      setHives([]);
    }
  };

  const handleOpenCreate = () => {
    const firstFarmId = farms.length > 0 ? farms[0].id : '';
    setFormData({
      farm_id: firstFarmId,
      hive_id: '',
      harvest_date: new Date().toISOString().split('T')[0],
      honey_type: 'Wildflower Honey',
      quantity: 100.0,
      unit: 'kg'
    });
    if (firstFarmId) handleFarmChangeInModal(firstFarmId);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const res = await createBatch({
      ...formData,
      farm_id: Number(formData.farm_id),
      hive_id: Number(formData.hive_id),
      quantity: Number(formData.quantity)
    });

    if (res.success) {
      setIsCreateOpen(false);
      loadData();
    } else {
      setFormError(res.error || 'Failed to record honey harvest');
    }
    setSubmitting(false);
  };

  const handleOpenQRModal = async (batchId) => {
    setQrModalBatch(batchId);
    setQrData(null);
    setQrError(null);
    setQrLoading(true);
    const res = await getBatchQR(batchId);
    if (res.success) {
      setQrData(res.data);
    } else {
      setQrError(res.error || 'QR code is generated upon bottling/packaging completion.');
    }
    setQrLoading(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <Package className="w-7 h-7 text-amber-500" />
            <span>Honey Batches & Harvest Provenance</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Record raw honey harvests, track multi-stage supply chain status, and generate public QR verification identities.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Record Fresh Honey Harvest</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Batch ID, honey type, farm..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-400 font-['Outfit']">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="HARVESTED">HARVESTED</option>
            <option value="QUALITY_TESTED">QUALITY_TESTED</option>
            <option value="PROCESSED">PROCESSED</option>
            <option value="PACKAGED">PACKAGED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Batches Table List */}
      {loading ? (
        <LoadingSpinner message="Loading honey batches provenance..." />
      ) : batches.length === 0 ? (
        <EmptyState 
          title="No Honey Batches Found" 
          description="There are no honey batches recorded matching your criteria. Click 'Record Fresh Honey Harvest' to create one." 
          actionLabel="Record Fresh Honey Harvest"
          onAction={handleOpenCreate}
          icon={Package}
        />
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => (
            <div key={batch.batch_id} className="glass-panel glass-panel-hover rounded-2xl p-6 border border-stone-800 space-y-4">
              
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-400 text-base">{batch.batch_id}</span>
                    <StatusBadge status={batch.status} />
                  </div>
                  <h3 className="text-lg font-bold text-stone-100 font-['Outfit'] mt-1">{batch.honey_type}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenQRModal(batch.batch_id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR Identity
                  </button>

                  <Link
                    to={`/verify/${batch.batch_id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Public Verify
                  </Link>
                </div>
              </div>

              {/* Progress Stepper */}
              <StatusProgressStepper currentStatus={batch.status} />

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 text-xs">
                <div>
                  <span className="text-stone-500 flex items-center gap-1"><Scale className="w-3 h-3 text-amber-500" /> Quantity</span>
                  <p className="font-bold text-stone-200 mt-0.5">{batch.quantity} {batch.unit || 'kg'}</p>
                </div>

                <div>
                  <span className="text-stone-500 flex items-center gap-1"><Calendar className="w-3 h-3 text-sky-400" /> Harvest Date</span>
                  <p className="font-bold text-stone-200 mt-0.5">{batch.harvest_date || 'N/A'}</p>
                </div>

                <div>
                  <span className="text-stone-500 flex items-center gap-1"><Beaker className="w-3 h-3 text-purple-400" /> Quality Grade</span>
                  <p className="font-bold text-amber-400 mt-0.5">{batch.quality_grade || 'PENDING'}</p>
                </div>

                <div>
                  <span className="text-stone-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-emerald-400" /> Current Location</span>
                  <p className="font-bold text-stone-200 mt-0.5 truncate">{batch.current_location || 'Apiary Farm'}</p>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Record Harvest Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Fresh Honey Harvest Batch"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Source Apiary Farm *</label>
            <select
              required
              value={formData.farm_id}
              onChange={(e) => handleFarmChangeInModal(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            >
              <option value="">Select Farm...</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name} (#{f.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Source Hive *</label>
            <select
              required
              value={formData.hive_id}
              onChange={(e) => setFormData({ ...formData, hive_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            >
              <option value="">Select Hive...</option>
              {hives.map((h) => (
                <option key={h.id} value={h.id}>Hive #{h.id} ({h.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Honey Floral Type *</label>
            <select
              value={formData.honey_type}
              onChange={(e) => setFormData({ ...formData, honey_type: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            >
              {ALLOWED_HONEY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Quantity *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="litre">litre</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Harvest Date *</label>
            <input
              type="date"
              required
              value={formData.harvest_date}
              onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
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
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              {submitting ? 'Recording Harvest...' : 'Record Harvest Batch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Identity Modal */}
      <Modal
        isOpen={Boolean(qrModalBatch)}
        onClose={() => {
          setQrModalBatch(null);
          setQrData(null);
          setQrError(null);
        }}
        title={`Batch QR Identity — ${qrModalBatch}`}
      >
        {qrLoading ? (
          <LoadingSpinner message="Generating QR identity..." />
        ) : qrData ? (
          <QRDisplay 
            batchId={qrModalBatch} 
            qrCodeUrl={qrData?.qr_code_data_url || qrData?.qr_code_url} 
            publicVerifyUrl={qrData?.verification_path ? `${window.location.origin}${qrData.verification_path}` : qrData?.public_verify_url} 
          />
        ) : (
          <div className="p-5 bg-stone-900/60 rounded-xl border border-stone-800 space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-stone-200 font-['Outfit']">QR Identity Pending Packaging</h4>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm mx-auto">
              {qrError || 'Public customer QR codes and verification paths are officially generated when a batch completes Bottling & Packaging.'}
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Link
                to="/packaging"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-lg transition-all"
              >
                Go to Packaging Workflow
              </Link>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
