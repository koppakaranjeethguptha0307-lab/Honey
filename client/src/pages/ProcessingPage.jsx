import React, { useState, useEffect } from 'react';
import { 
  Factory, Plus, Search, Play, CheckCircle2, User, Calendar, FileText
} from 'lucide-react';
import { 
  getProcessingRecords, createProcessingRecord, startProcessingRecord, 
  completeProcessingRecord, getBatches 
} from '../utils/api';
import { useRole } from '../context/RoleContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';

export function ProcessingPage() {
  const { user } = useRole();
  const activeUserName = user?.name || 'Master Processor';

  const [records, setRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [completeModalRecord, setCompleteModalRecord] = useState(null);

  const [formData, setFormData] = useState({
    batch_id: '',
    facility: 'Central Honey Processors Inc',
    processing_date: new Date().toISOString().split('T')[0],
    method: 'Cold Extraction & Micro-filtration',
    processor: activeUserName,
    notes: 'Standard filtration parameters set.'
  });

  const [completeData, setCompleteData] = useState({ notes: 'Extraction and micro-filtration completed successfully.' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [resProc, resBatches] = await Promise.all([
      getProcessingRecords({ status: statusFilter }),
      getBatches()
    ]);

    if (resProc.success) setRecords(resProc.data || []);
    else setError(resProc.error || 'Failed to fetch processing records');

    if (resBatches.success) setBatches(resBatches.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    const approvedBatches = batches.filter(b => b.status === 'QUALITY_TESTED' || b.quality_status === 'APPROVED');
    const firstBatchId = approvedBatches.length > 0 ? approvedBatches[0].batch_id : (batches.length > 0 ? batches[0].batch_id : '');

    setFormData({
      batch_id: firstBatchId,
      facility: 'Central Honey Processors Inc',
      processing_date: new Date().toISOString().split('T')[0],
      method: 'Cold Extraction & Micro-filtration',
      processor: activeUserName,
      notes: 'Standard cold filtration'
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const res = await createProcessingRecord(formData);
    if (res.success) {
      setIsCreateOpen(false);
      loadData();
    } else {
      setFormError(res.error || 'Failed to create processing record');
    }
    setSubmitting(false);
  };

  const handleStart = async (id) => {
    const res = await startProcessingRecord(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to start processing');
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completeModalRecord) return;
    setSubmitting(true);
    setFormError(null);

    const res = await completeProcessingRecord(completeModalRecord.id, completeData);
    if (res.success) {
      setCompleteModalRecord(null);
      loadData();
    } else {
      setFormError(res.error || 'Failed to complete processing');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <Factory className="w-7 h-7 text-amber-500" />
            <span>Honey Extraction & Facility Processing</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Cold extraction, micro-filtration, moisture control, and processing stage transitions.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Processing Record</span>
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
            <option value="">All Processing States</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Processing Records Grid */}
      {loading ? (
        <LoadingSpinner message="Loading facility processing records..." />
      ) : records.length === 0 ? (
        <EmptyState 
          title="No Processing Records Found" 
          description="There are no processing records matching your current filter criteria." 
          actionLabel="New Processing Record"
          onAction={handleOpenCreate}
          icon={Factory}
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

                  <div className="space-y-2 text-xs text-stone-300">
                    <p className="flex items-center gap-1.5">
                      <span className="text-stone-500">Facility:</span>
                      <span className="font-semibold text-stone-200">{record.facility}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-stone-500">Method:</span>
                      <span className="font-semibold text-sky-400">{record.method}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-stone-500">Processor:</span>
                      <span>{record.processor || 'Facility Operator'}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="text-stone-500">Date:</span>
                      <span>{record.processing_date || 'N/A'}</span>
                    </p>

                    {record.notes && (
                      <p className="italic text-stone-300 bg-stone-950/40 p-2.5 rounded-lg border border-stone-800 mt-2">
                        "{record.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Workflow Transitions */}
                {!isCompleted && (
                  <div className="pt-3 border-t border-stone-800 flex items-center gap-2">
                    {isPending && (
                      <button
                        onClick={() => handleStart(record.id)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-stone-950 bg-sky-400 hover:bg-sky-300 rounded-xl transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-stone-950" />
                        Start Processing
                      </button>
                    )}

                    {isInProgress && (
                      <button
                        onClick={() => {
                          setCompleteModalRecord(record);
                          setCompleteData({ notes: 'Micro-filtration completed with 0 contamination.' });
                          setFormError(null);
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-stone-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Complete Processing
                      </button>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Create Processing Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Honey Facility Processing"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Target Quality Tested Batch *</label>
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
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Processing Facility Name *</label>
            <input
              type="text"
              required
              value={formData.facility}
              onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Processing Method *</label>
            <input
              type="text"
              required
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              placeholder="e.g. Cold Extraction & Micro-filtration"
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Processor / Operator Name</label>
            <input
              type="text"
              value={formData.processor}
              onChange={(e) => setFormData({ ...formData, processor: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Processing Date *</label>
            <input
              type="date"
              required
              value={formData.processing_date}
              onChange={(e) => setFormData({ ...formData, processing_date: e.target.value })}
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
              {submitting ? 'Creating...' : 'Create Processing Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Processing Modal */}
      <Modal
        isOpen={Boolean(completeModalRecord)}
        onClose={() => setCompleteModalRecord(null)}
        title={`Complete Processing Record #${completeModalRecord?.id}`}
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Completion Notes</label>
            <textarea
              rows={3}
              value={completeData.notes}
              onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setCompleteModalRecord(null)}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all"
            >
              {submitting ? 'Completing...' : 'Mark Completed'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
