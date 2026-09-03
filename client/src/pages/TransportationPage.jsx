import React, { useState, useEffect } from 'react';
import { 
  Truck, Plus, Search, MapPin, CheckCircle2, ShieldCheck, Navigation, Calendar, Hash,
  Factory, Package, Eye, QrCode, Beaker, FileText, Info
} from 'lucide-react';
import { 
  getTransportationRecords, createTransportationRecord, pickupTransportation, 
  inTransitTransportation, deliverTransportation, getBatches,
  getProcessingRecords, getPackagingRecords, getBatchQR
} from '../utils/api';
import { useRole } from '../context/RoleContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';
import { QRDisplay } from '../components/common/QRDisplay';

export function TransportationPage() {
  const { user } = useRole();
  const activeUserName = user?.name || 'Authorized Transporter';

  const [activeTab, setActiveTab] = useState('dispatches'); // 'dispatches' | 'processing' | 'packaging'

  const [records, setRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [processingRecords, setProcessingRecords] = useState([]);
  const [packagingRecords, setPackagingRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deliverModalRecord, setDeliverModalRecord] = useState(null);
  const [qrModalBatch, setQrModalBatch] = useState(null);
  const [qrData, setQrData] = useState(null);

  const [formData, setFormData] = useState({
    batch_id: '',
    transporter_name: activeUserName,
    pickup_date: new Date().toISOString().split('T')[0],
    pickup_loc: 'EcoPack Plant 4',
    destination_loc: 'Metro Distribution Hub',
    delivery_date: ''
  });

  const [deliverData, setDeliverData] = useState({
    delivery_date: new Date().toISOString().split('T')[0],
    confirmation_code: `CONF-${Math.floor(100000 + Math.random() * 900000)}`
  });

  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [resTrans, resBatches, resProc, resPack] = await Promise.all([
      getTransportationRecords({ status: statusFilter }),
      getBatches(),
      getProcessingRecords(),
      getPackagingRecords()
    ]);

    if (resTrans.success) setRecords(resTrans.data || []);
    else setError(resTrans.error || 'Failed to fetch transportation records');

    if (resBatches.success) setBatches(resBatches.data || []);
    if (resProc.success) setProcessingRecords(resProc.data || []);
    if (resPack.success) setPackagingRecords(resPack.data || []);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const eligibleBatches = batches.filter(b => 
    String(b.status).toUpperCase() === 'PACKAGED' && 
    String(b.packaging_status).toUpperCase() === 'COMPLETED'
  );

  const handleOpenCreate = () => {
    const firstBatchId = eligibleBatches.length > 0 ? eligibleBatches[0].batch_id : '';

    setFormData({
      batch_id: firstBatchId,
      transporter_name: activeUserName,
      pickup_date: new Date().toISOString().split('T')[0],
      pickup_loc: 'EcoPack Plant 4',
      destination_loc: 'Metro Distribution Hub',
      delivery_date: ''
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const res = await createTransportationRecord(formData);
    if (res.success) {
      setIsCreateOpen(false);
      loadData();
    } else {
      setFormError(res.error || 'Failed to create transportation record');
    }
    setSubmitting(false);
  };

  const handlePickup = async (id) => {
    const res = await pickupTransportation(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to record pickup');
    }
  };

  const handleInTransit = async (id) => {
    const res = await inTransitTransportation(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to record in-transit state');
    }
  };

  const handleDeliverSubmit = async (e) => {
    e.preventDefault();
    if (!deliverModalRecord) return;
    setSubmitting(true);
    setFormError(null);

    const res = await deliverTransportation(deliverModalRecord.id, deliverData);
    if (res.success) {
      setDeliverModalRecord(null);
      loadData();
    } else {
      setFormError(res.error || 'Failed to confirm delivery');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <Truck className="w-7 h-7 text-amber-500" />
            <span>Cold-Chain Transportation & Logistics</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Dispatch management, pickup logging, in-transit tracking, and delivery confirmation codes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Logistics Dispatch</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs for Transporter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dispatches')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'dispatches'
                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Logistics Dispatches ({records.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('processing')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'processing'
                ? 'bg-cyan-500 text-stone-950 shadow-md shadow-cyan-500/20'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>Processing Records ({processingRecords.length})</span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-stone-950/60 rounded text-cyan-300 border border-cyan-500/30">Read-Only</span>
          </button>

          <button
            onClick={() => setActiveTab('packaging')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'packaging'
                ? 'bg-purple-500 text-stone-950 shadow-md shadow-purple-500/20'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Packaging Records ({packagingRecords.length})</span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase bg-stone-950/60 rounded text-purple-300 border border-purple-500/30">Read-Only</span>
          </button>
        </div>

        {activeTab === 'dispatches' && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-stone-400 font-['Outfit']">Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Logistics States</option>
              <option value="PENDING">PENDING</option>
              <option value="PICKED_UP">PICKED_UP</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="DELIVERED">DELIVERED</option>
            </select>
          </div>
        )}
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* TAB 1: LOGISTICS DISPATCHES (EXISTING FULL FUNCTIONALITY) */}
      {activeTab === 'dispatches' && (
        loading ? (
          <LoadingSpinner message="Loading cold-chain logistics records..." />
        ) : records.length === 0 ? (
          <EmptyState 
            title="No Logistics Records Found" 
            description="There are no transportation records matching your filter criteria." 
            actionLabel="New Logistics Dispatch"
            onAction={handleOpenCreate}
            icon={Truck}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((record) => {
              const isPending = String(record.status).toUpperCase() === 'PENDING';
              const isPickedUp = String(record.status).toUpperCase() === 'PICKED_UP';
              const isInTransit = String(record.status).toUpperCase() === 'IN_TRANSIT';

              const linkedProc = processingRecords.find(p => p.batch_id === record.batch_id);
              const linkedPack = packagingRecords.find(p => p.batch_id === record.batch_id);

              return (
                <div key={record.id} className="glass-panel glass-panel-hover rounded-2xl p-5 border border-stone-800 flex flex-col justify-between space-y-4">
                  
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-mono text-stone-500 uppercase">DISPATCH #{record.id}</span>
                        <h3 className="text-sm font-bold text-amber-400 font-mono">{record.batch_id}</h3>
                      </div>
                      <StatusBadge status={record.status} />
                    </div>

                    <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 space-y-2 mb-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Transporter:</span>
                        <span className="font-bold text-stone-200">{record.transporter_name}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Origin / Pickup:</span>
                        <span className="font-medium text-amber-300/90">{record.pickup_loc}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Destination:</span>
                        <span className="font-medium text-emerald-300/90">{record.destination_loc}</span>
                      </div>
                      {record.confirmation_code && (
                        <div className="flex justify-between items-center pt-1 border-t border-stone-800/60">
                          <span className="text-stone-400">Confirmation Code:</span>
                          <span className="font-mono font-bold text-amber-400">{record.confirmation_code}</span>
                        </div>
                      )}
                    </div>

                    {/* Batch Provenance Summary for Transporter */}
                    <div className="p-2.5 bg-stone-900/60 rounded-xl border border-stone-800 space-y-1 mb-3 text-[11px]">
                      <div className="flex items-center justify-between text-stone-400">
                        <span className="flex items-center gap-1"><Factory className="w-3 h-3 text-cyan-400" /> Processing:</span>
                        <span className={linkedProc ? 'text-emerald-400 font-semibold' : 'text-stone-500'}>
                          {linkedProc ? `${linkedProc.method} (${linkedProc.status})` : 'No Processing Record'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-stone-400">
                        <span className="flex items-center gap-1"><Package className="w-3 h-3 text-purple-400" /> Packaging:</span>
                        <span className={linkedPack ? 'text-emerald-400 font-semibold' : 'text-stone-500'}>
                          {linkedPack ? `${linkedPack.package_type} - ${linkedPack.bottle_count} bottles` : 'No Packaging Record'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-stone-400">
                      <p><span className="text-stone-500">Pickup Date:</span> {record.pickup_date || 'N/A'}</p>
                      <p><span className="text-stone-500">Delivery Date:</span> {record.delivery_date || 'Pending Delivery'}</p>
                    </div>
                  </div>

                  {/* Workflow Transitions */}
                  <div className="pt-3 border-t border-stone-800 flex flex-wrap items-center justify-between gap-2">
                    {isPending && (
                      <button
                        onClick={() => handlePickup(record.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-stone-950 bg-indigo-400 hover:bg-indigo-300 rounded-xl transition-all"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Record Pickup
                      </button>
                    )}

                    {isPickedUp && (
                      <button
                        onClick={() => handleInTransit(record.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-stone-950 bg-sky-400 hover:bg-sky-300 rounded-xl transition-all"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        Mark In-Transit
                      </button>
                    )}

                    {isInTransit && (
                      <button
                        onClick={() => {
                          setDeliverModalRecord(record);
                          setDeliverData({
                            delivery_date: new Date().toISOString().split('T')[0],
                            confirmation_code: `CONF-${Math.floor(100000 + Math.random() * 900000)}`
                          });
                          setFormError(null);
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-stone-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm Final Delivery
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )
      )}

      {/* TAB 2: TRANSPORTER VIEW-ONLY PROCESSING RECORDS */}
      {activeTab === 'processing' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-cyan-950/30 rounded-xl border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span><strong>Transporter View-Only Access:</strong> Viewing honey extraction, filtration, and processing logs associated with active honey batches.</span>
            </div>
          </div>

          {processingRecords.length === 0 ? (
            <EmptyState 
              title="No Processing Records Available" 
              description="No facility processing records are recorded in the database yet." 
              icon={Factory}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processingRecords.map((proc) => (
                <div key={proc.id} className="glass-panel rounded-2xl p-5 border border-stone-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-mono text-stone-500 uppercase">PROCESSING REC #{proc.id}</span>
                        <h3 className="text-sm font-bold text-cyan-400 font-mono">{proc.batch_id}</h3>
                      </div>
                      <StatusBadge status={proc.status} />
                    </div>

                    <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Processing Method:</span>
                        <span className="font-semibold text-stone-200">{proc.method}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Facility:</span>
                        <span className="font-medium text-stone-300">{proc.facility}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Operator / Processor:</span>
                        <span className="font-medium text-amber-300">{proc.processor || 'Facility Staff'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-stone-800/60">
                        <span className="text-stone-400">Processing Date:</span>
                        <span className="font-mono text-stone-200">{proc.processing_date || 'N/A'}</span>
                      </div>
                    </div>

                    {proc.notes && (
                      <p className="text-xs italic text-stone-300 bg-stone-950/40 p-2.5 rounded-lg border border-stone-800 mt-3">
                        "{proc.notes}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-500">
                    <span className="inline-flex items-center gap-1 font-mono uppercase text-cyan-400">
                      <ShieldCheck className="w-3.5 h-3.5" /> Read-Only Record
                    </span>
                    <span>Batch Link: <strong className="text-stone-300 font-mono">{proc.batch_id}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRANSPORTER VIEW-ONLY PACKAGING RECORDS */}
      {activeTab === 'packaging' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-purple-950/30 rounded-xl border border-purple-500/30 flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span><strong>Transporter View-Only Access:</strong> Viewing bottling, jar counts, packaging specifications, and QR code verification links.</span>
            </div>
          </div>

          {packagingRecords.length === 0 ? (
            <EmptyState 
              title="No Packaging Records Available" 
              description="No bottling or packaging records are recorded in the database yet." 
              icon={Package}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packagingRecords.map((pack) => (
                <div key={pack.id} className="glass-panel rounded-2xl p-5 border border-stone-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-mono text-stone-500 uppercase">PACKAGING REC #{pack.id}</span>
                        <h3 className="text-sm font-bold text-purple-400 font-mono">{pack.batch_id}</h3>
                      </div>
                      <StatusBadge status={pack.status} />
                    </div>

                    <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Bottles / Jars Packaged:</span>
                        <span className="font-bold text-amber-400 font-mono text-sm">{pack.bottle_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Package Type & Size:</span>
                        <span className="font-semibold text-stone-200">{pack.package_type} ({pack.package_size})</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-400">Facility:</span>
                        <span className="font-medium text-stone-300">{pack.facility}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-stone-800/60">
                        <span className="text-stone-400">Packaging Date:</span>
                        <span className="font-mono text-stone-200">{pack.packaging_date || 'N/A'}</span>
                      </div>
                    </div>

                    {pack.label_info && (
                      <p className="text-xs text-stone-300 bg-stone-950/40 p-2.5 rounded-lg border border-stone-800 mt-3">
                        <span className="text-stone-500">Label Specification:</span> {pack.label_info}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
                    <button
                      onClick={async () => {
                        setQrModalBatch(pack.batch_id);
                        setQrData(null);
                        const res = await getBatchQR(pack.batch_id);
                        if (res.success) setQrData(res.data);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-xl transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      View Batch QR Identity
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Dispatch Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Transportation Dispatch"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Target Packaged Batch *</label>
            <select
              required
              value={formData.batch_id}
              onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 font-mono focus:border-amber-500"
            >
              <option value="">Select Packaged Batch...</option>
              {eligibleBatches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>{b.batch_id} ({b.honey_type} - {b.status})</option>
              ))}
            </select>
            {eligibleBatches.length === 0 && (
              <p className="text-[11px] text-amber-400 mt-1 font-mono">
                ⚠️ No batches are currently in PACKAGED status. Honey batches must complete Quality Approval, Processing, and Bottling & Packaging before becoming eligible for logistics dispatch.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Transporter / Carrier Name *</label>
            <input
              type="text"
              required
              value={formData.transporter_name}
              onChange={(e) => setFormData({ ...formData, transporter_name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Pickup Location *</label>
            <input
              type="text"
              required
              value={formData.pickup_loc}
              onChange={(e) => setFormData({ ...formData, pickup_loc: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Destination Location *</label>
            <input
              type="text"
              required
              value={formData.destination_loc}
              onChange={(e) => setFormData({ ...formData, destination_loc: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Pickup Date *</label>
            <input
              type="date"
              required
              value={formData.pickup_date}
              onChange={(e) => setFormData({ ...formData, pickup_date: e.target.value })}
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
              {submitting ? 'Creating...' : 'Create Logistics Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delivery Modal */}
      <Modal
        isOpen={Boolean(deliverModalRecord)}
        onClose={() => setDeliverModalRecord(null)}
        title={`Confirm Final Delivery — Dispatch #${deliverModalRecord?.id}`}
      >
        <form onSubmit={handleDeliverSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Delivery Confirmation Code *</label>
            <input
              type="text"
              required
              value={deliverData.confirmation_code}
              onChange={(e) => setDeliverData({ ...deliverData, confirmation_code: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-amber-400 font-mono font-bold focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Delivery Date *</label>
            <input
              type="date"
              required
              value={deliverData.delivery_date}
              onChange={(e) => setDeliverData({ ...deliverData, delivery_date: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setDeliverModalRecord(null)}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all"
            >
              {submitting ? 'Confirming...' : 'Confirm Delivery'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code View Modal for Packaging Records */}
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
