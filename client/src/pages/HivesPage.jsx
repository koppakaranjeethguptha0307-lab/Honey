import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Cpu, Plus, Search, Edit3, Trash2, Zap, Thermometer, 
  Droplets, Scale, Activity, ShieldCheck, HeartPulse
} from 'lucide-react';
import { getHives, createHive, updateHive, deleteHive, getFarms, simulateSensorReading } from '../utils/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { StatusBadge } from '../components/common/StatusBadge';

export function HivesPage() {
  const [hives, setHives] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFarmFilter, setSelectedFarmFilter] = useState('');
  
  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedHive, setSelectedHive] = useState(null);

  const [formData, setFormData] = useState({
    farm_id: '',
    type: 'Langstroth',
    installation_date: new Date().toISOString().split('T')[0],
    bee_colony_info: 'Italian Honey Bees (Apis mellifera ligustica)',
    status: 'ACTIVE'
  });

  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [simulatingHiveId, setSimulatingHiveId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [resHives, resFarms] = await Promise.all([
      getHives({ farm_id: selectedFarmFilter }),
      getFarms()
    ]);

    if (resHives.success) setHives(resHives.data || []);
    else setError(resHives.error || 'Failed to fetch hives');

    if (resFarms.success) setFarms(resFarms.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedFarmFilter]);

  const handleOpenCreate = () => {
    setFormData({
      farm_id: farms.length > 0 ? farms[0].id : '',
      type: 'Langstroth',
      installation_date: new Date().toISOString().split('T')[0],
      bee_colony_info: 'Italian Honey Bees (Apis mellifera ligustica)',
      status: 'ACTIVE'
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (hive) => {
    setSelectedHive(hive);
    setFormData({
      farm_id: hive.farm_id,
      type: hive.type || 'Langstroth',
      installation_date: hive.installation_date ? hive.installation_date.split('T')[0] : '',
      bee_colony_info: hive.bee_colony_info || '',
      status: hive.status || 'ACTIVE'
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const res = await createHive({
      ...formData,
      farm_id: Number(formData.farm_id)
    });

    if (res.success) {
      setIsCreateOpen(false);
      loadData();
    } else {
      setFormError(res.error || 'Failed to create hive');
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHive) return;
    setSubmitting(true);
    setFormError(null);

    const res = await updateHive(selectedHive.id, {
      ...formData,
      farm_id: Number(formData.farm_id)
    });

    if (res.success) {
      setIsEditOpen(false);
      loadData();
    } else {
      setFormError(res.error || 'Failed to update hive');
    }
    setSubmitting(false);
  };

  const handleDelete = async (hiveId) => {
    if (!window.confirm(`Are you sure you want to delete Hive #${hiveId}?`)) return;
    const res = await deleteHive(hiveId);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to delete hive');
    }
  };

  const handleSimulateSensor = async (hiveId) => {
    setSimulatingHiveId(hiveId);
    const res = await simulateSensorReading(hiveId, { scenario: 'NORMAL' });
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Failed to simulate sensor reading');
    }
    setSimulatingHiveId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <Cpu className="w-7 h-7 text-amber-500" />
            <span>Smart Hive Telemetry Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Track hive installation dates, bee colony health scores, temperature/humidity/weight sensors, and IoT simulations.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Hive</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-400 font-['Outfit']">Filter by Farm:</label>
          <select
            value={selectedFarmFilter}
            onChange={(e) => setSelectedFarmFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-200 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Apiary Farms</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id}>{f.name} (#{f.id})</option>
            ))}
          </select>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* Hives List */}
      {loading ? (
        <LoadingSpinner message="Loading smart hives telemetry..." />
      ) : hives.length === 0 ? (
        <EmptyState 
          title="No Smart Hives Registered" 
          description="No hives match your selected filter. Register a hive under an apiary farm to begin monitoring." 
          actionLabel="Register New Hive"
          onAction={handleOpenCreate}
          icon={Cpu}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hives.map((hive) => {
            const parentFarm = farms.find(f => Number(f.id) === Number(hive.farm_id));

            return (
              <div key={hive.id} className="glass-panel glass-panel-hover rounded-2xl p-5 border border-stone-800 flex flex-col justify-between space-y-4">
                
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">HIVE #{hive.id}</span>
                      <h3 className="text-lg font-bold text-stone-100 font-['Outfit']">{hive.type || 'Standard Hive'}</h3>
                      <p className="text-xs text-amber-400/90 font-medium">Farm: {parentFarm ? parentFarm.name : `ID #${hive.farm_id}`}</p>
                    </div>
                    <StatusBadge status={hive.status} />
                  </div>

                  <div className="p-3 bg-stone-950/60 rounded-xl border border-stone-800/80 my-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 flex items-center gap-1">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                        Health Score:
                      </span>
                      <span className="font-bold text-amber-400 font-mono">
                        {hive.health_score !== null && hive.health_score !== undefined ? `${hive.health_score}%` : 'N/A'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-stone-800/60 text-[11px] text-center text-stone-300">
                      <div>
                        <span className="text-stone-500 flex items-center justify-center gap-0.5"><Thermometer className="w-3 h-3 text-amber-500" /> Temp</span>
                        <p className="font-bold mt-0.5">{hive.temp !== null && hive.temp !== undefined ? `${hive.temp}°C` : '—'}</p>
                      </div>
                      <div>
                        <span className="text-stone-500 flex items-center justify-center gap-0.5"><Droplets className="w-3 h-3 text-sky-400" /> Hum</span>
                        <p className="font-bold mt-0.5">{hive.humidity !== null && hive.humidity !== undefined ? `${hive.humidity}%` : '—'}</p>
                      </div>
                      <div>
                        <span className="text-stone-500 flex items-center justify-center gap-0.5"><Scale className="w-3 h-3 text-purple-400" /> Weight</span>
                        <p className="font-bold mt-0.5">{hive.weight !== null && hive.weight !== undefined ? `${hive.weight}kg` : '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-stone-400">
                    <p><span className="text-stone-500">Colony Info:</span> {hive.bee_colony_info || 'Not specified'}</p>
                    <p><span className="text-stone-500">Installed:</span> {hive.installation_date || 'N/A'}</p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to="/sensors"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800/60 rounded-lg transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      Readings
                    </Link>

                    <button
                      onClick={() => handleSimulateSensor(hive.id)}
                      disabled={simulatingHiveId === hive.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors"
                      title="Trigger IoT Sensor Reading Simulation"
                    >
                      <Zap className={`w-3.5 h-3.5 ${simulatingHiveId === hive.id ? 'animate-bounce text-amber-400' : ''}`} />
                      {simulatingHiveId === hive.id ? 'Simulating...' : 'Simulate'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(hive)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(hive.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Hive Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
        title={isCreateOpen ? 'Register New Smart Hive' : `Edit Hive #${selectedHive?.id}`}
      >
        <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Parent Farm *</label>
            <select
              required
              value={formData.farm_id}
              onChange={(e) => setFormData({ ...formData, farm_id: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            >
              <option value="">Select Apiary Farm...</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name} (#{f.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Hive Type *</label>
            <input
              type="text"
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="e.g. Langstroth, Top Bar, Warre"
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Installation Date</label>
            <input
              type="date"
              value={formData.installation_date}
              onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Bee Colony Details</label>
            <input
              type="text"
              value={formData.bee_colony_info}
              onChange={(e) => setFormData({ ...formData, bee_colony_info: e.target.value })}
              placeholder="e.g. Italian Honey Bees (Apis mellifera ligustica)"
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Hive Operational Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              {submitting ? 'Saving...' : isCreateOpen ? 'Create Hive' : 'Update Hive'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
