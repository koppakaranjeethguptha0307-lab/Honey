import React, { useState, useEffect } from 'react';
import { 
  Beaker, Plus, Search, CheckCircle2, XCircle, Award, 
  ShieldCheck, AlertCircle, Calendar, User, FileText
} from 'lucide-react';
import { getQualityTests, createQualityTest, approveQualityTest, rejectQualityTest, getBatches } from '../utils/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';

export function QualityPage() {
  const [tests, setTests] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [approveModalTest, setApproveModalTest] = useState(null);
  const [rejectModalTest, setRejectModalTest] = useState(null);

  const [formData, setFormData] = useState({
    batch_id: '',
    test_date: new Date().toISOString().split('T')[0],
    purity_pct: 98.5,
    moisture_pct: 17.0,
    color: 'Amber',
    aroma: 'Floral',
    taste: 'Sweet',
    adulteration_check: 'PASSED',
    quality_grade: 'GRADE_A',
    inspector_name: 'Dr. Jane Smith',
    remarks: 'Sample purity exceeds industry benchmark.'
  });

  const [approveData, setApproveData] = useState({ quality_grade: 'GRADE_A', remarks: 'Approved for processing' });
  const [rejectData, setRejectData] = useState({ remarks: '' });
  
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [resTests, resBatches] = await Promise.all([
      getQualityTests({ status: statusFilter }),
      getBatches()
    ]);

    if (resTests.success) setTests(resTests.data || []);
    else setError(resTests.error || 'Failed to fetch quality tests');

    if (resBatches.success) setBatches(resBatches.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenCreate = () => {
    const firstBatchId = batches.length > 0 ? batches[0].batch_id : '';
    setFormData({
      batch_id: firstBatchId,
      test_date: new Date().toISOString().split('T')[0],
      purity_pct: 98.5,
      moisture_pct: 17.0,
      color: 'Amber',
      aroma: 'Floral',
      taste: 'Sweet',
      adulteration_check: 'PASSED',
      quality_grade: 'GRADE_A',
      inspector_name: 'Dr. Jane Smith',
      remarks: 'Pristine lab sample'
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const res = await createQualityTest({
      ...formData,
      purity_pct: Number(formData.purity_pct),
      moisture_pct: Number(formData.moisture_pct)
    });

    if (res.success) {
      setIsCreateOpen(false);
      loadData();
    } else {
      setFormError(res.error || 'Failed to create quality test');
    }
    setSubmitting(false);
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!approveModalTest) return;
    setSubmitting(true);
    setFormError(null);

    const res = await approveQualityTest(approveModalTest.id, approveData);
    if (res.success) {
      setApproveModalTest(null);
      loadData();
    } else {
      setFormError(res.error || 'Failed to approve quality test');
    }
    setSubmitting(false);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalTest) return;
    if (!rejectData.remarks || !rejectData.remarks.trim()) {
      setFormError('Rejection reason/remarks is required when rejecting a quality test');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    const res = await rejectQualityTest(rejectModalTest.id, rejectData);
    if (res.success) {
      setRejectModalTest(null);
      loadData();
    } else {
      setFormError(res.error || 'Failed to reject quality test');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <Beaker className="w-7 h-7 text-amber-500" />
            <span>Quality Testing & Laboratory Inspection</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Certified purity testing, moisture analysis, adulteration screening, and inspector approval workflow.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Lab Inspection</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-400 font-['Outfit']">Test Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Inspection Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Tests Grid */}
      {loading ? (
        <LoadingSpinner message="Loading lab test results..." />
      ) : tests.length === 0 ? (
        <EmptyState 
          title="No Quality Tests Recorded" 
          description="There are no quality tests matching your status filter." 
          actionLabel="New Lab Inspection"
          onAction={handleOpenCreate}
          icon={Beaker}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => {
            const isPending = String(test.status).toUpperCase() === 'PENDING';
            const isApproved = String(test.status).toUpperCase() === 'APPROVED';

            return (
              <div key={test.id} className="glass-panel glass-panel-hover rounded-2xl p-5 border border-stone-800 flex flex-col justify-between space-y-4">
                
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono text-stone-500 uppercase">TEST #{test.id}</span>
                      <h3 className="text-sm font-bold text-amber-400 font-mono">{test.batch_id}</h3>
                    </div>
                    <StatusBadge status={test.status} />
                  </div>

                  <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 space-y-2 mb-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Purity Level:</span>
                      <span className="font-bold text-emerald-400 font-mono">{test.purity_pct}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Moisture Content:</span>
                      <span className="font-bold text-sky-400 font-mono">{test.moisture_pct}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-stone-400">Adulteration Check:</span>
                      <span className={`font-bold font-mono ${test.adulteration_check === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {test.adulteration_check}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-stone-800/60">
                      <span className="text-stone-400">Grade Assigned:</span>
                      <StatusBadge status={test.quality_grade || 'GRADE_A'} />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-stone-400">
                    <p><span className="text-stone-500">Inspector:</span> {test.inspector_name || 'Lab Staff'}</p>
                    <p><span className="text-stone-500">Test Date:</span> {test.test_date || 'N/A'}</p>
                    {test.remarks && <p className="italic text-stone-300 bg-stone-950/40 p-2 rounded border border-stone-800 mt-2">"{test.remarks}"</p>}
                  </div>
                </div>

                {/* Inspector Workflow Actions */}
                {isPending && (
                  <div className="pt-3 border-t border-stone-800 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setApproveModalTest(test);
                        setApproveData({ quality_grade: test.quality_grade || 'GRADE_A', remarks: 'Approved for processing' });
                        setFormError(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-stone-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalTest(test);
                        setRejectData({ remarks: '' });
                        setFormError(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-bold text-stone-950 bg-rose-500 hover:bg-rose-400 rounded-lg transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Create Quality Test Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Record Quality Inspection Test"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Target Honey Batch *</label>
            <select
              required
              value={formData.batch_id}
              onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 font-mono focus:border-amber-500"
            >
              <option value="">Select Honey Batch...</option>
              {batches.map((b) => (
                <option key={b.batch_id} value={b.batch_id}>{b.batch_id} ({b.honey_type} - {b.status})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Purity (%) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.purity_pct}
                onChange={(e) => setFormData({ ...formData, purity_pct: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Moisture (%) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.moisture_pct}
                onChange={(e) => setFormData({ ...formData, moisture_pct: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Adulteration Check *</label>
              <select
                value={formData.adulteration_check}
                onChange={(e) => setFormData({ ...formData, adulteration_check: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              >
                <option value="PASSED">PASSED (No Adulterants)</option>
                <option value="FAILED">FAILED (Adulteration Detected)</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Assigned Grade *</label>
              <select
                value={formData.quality_grade}
                onChange={(e) => setFormData({ ...formData, quality_grade: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              >
                <option value="GRADE_A">GRADE_A (Premium Pure)</option>
                <option value="GRADE_B">GRADE_B (Standard)</option>
                <option value="GRADE_C">GRADE_C (Industrial)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Inspector Name *</label>
            <input
              type="text"
              required
              value={formData.inspector_name}
              onChange={(e) => setFormData({ ...formData, inspector_name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Remarks</label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
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
              {submitting ? 'Submitting...' : 'Save Quality Test'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspector Approve Modal */}
      <Modal
        isOpen={Boolean(approveModalTest)}
        onClose={() => setApproveModalTest(null)}
        title={`Approve Quality Test #${approveModalTest?.id}`}
      >
        <form onSubmit={handleApproveSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Final Approved Quality Grade</label>
            <select
              value={approveData.quality_grade}
              onChange={(e) => setApproveData({ ...approveData, quality_grade: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            >
              <option value="GRADE_A">GRADE_A</option>
              <option value="GRADE_B">GRADE_B</option>
              <option value="GRADE_C">GRADE_C</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Approval Remarks</label>
            <textarea
              rows={2}
              value={approveData.remarks}
              onChange={(e) => setApproveData({ ...approveData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setApproveModalTest(null)}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all"
            >
              {submitting ? 'Approving...' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Inspector Reject Modal */}
      <Modal
        isOpen={Boolean(rejectModalTest)}
        onClose={() => setRejectModalTest(null)}
        title={`Reject Quality Test #${rejectModalTest?.id}`}
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1">Rejection Reason / Remarks *</label>
            <textarea
              rows={3}
              required
              placeholder="State clear failure reason (e.g. Moisture content exceeds allowable threshold of 20%)..."
              value={rejectData.remarks}
              onChange={(e) => setRejectData({ ...rejectData, remarks: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-rose-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setRejectModalTest(null)}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-rose-500 hover:bg-rose-400 rounded-xl transition-all"
            >
              {submitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
