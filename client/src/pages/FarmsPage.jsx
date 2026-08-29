import React, { useState, useEffect } from 'react';
import { 
  MapPin, Plus, Search, Edit3, Trash2, LayoutDashboard, Globe, Navigation
} from 'lucide-react';
import { getFarms, createFarm, updateFarm, deleteFarm, getFarmDashboard } from '../utils/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { FarmMap } from '../components/common/FarmMap';

export function FarmsPage() {
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const [selectedFarm, setSelectedFarm] = useState(null);
  const [farmDashData, setFarmDashData] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    farmer_name: '',
    location: '',
    village: '',
    district: '',
    state: '',
    country: 'Countryland',
    lat: '',
    lng: ''
  });
  
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadFarms = async () => {
    setLoading(true);
    setError(null);
    const res = await getFarms({ search });
    if (res.success) {
      setFarms(res.data || []);
    } else {
      setError(res.error || 'Failed to fetch farms');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFarms();
  }, [search]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      farmer_name: '',
      location: '',
      village: '',
      district: '',
      state: '',
      country: 'Countryland',
      lat: '',
      lng: ''
    });
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (farm) => {
    setSelectedFarm(farm);
    setFormData({
      name: farm.name || '',
      farmer_name: farm.farmer_name || '',
      location: farm.location || '',
      village: farm.village || '',
      district: farm.district || '',
      state: farm.state || '',
      country: farm.country || 'Countryland',
      lat: farm.lat !== null && farm.lat !== undefined ? farm.lat : '',
      lng: farm.lng !== null && farm.lng !== undefined ? farm.lng : ''
    });
    setFormError(null);
    setIsEditOpen(true);
  };

  const handleOpenDashboard = async (farm) => {
    setSelectedFarm(farm);
    setIsDashboardOpen(true);
    setFarmDashData(null);
    const res = await getFarmDashboard(farm.id);
    if (res.success) {
      setFarmDashData(res.data);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      ...formData,
      lat: formData.lat !== '' ? Number(formData.lat) : null,
      lng: formData.lng !== '' ? Number(formData.lng) : null,
    };

    const res = await createFarm(payload);
    if (res.success) {
      setIsCreateOpen(false);
      loadFarms();
    } else {
      setFormError(res.error || 'Failed to create farm');
    }
    setSubmitting(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarm) return;
    setSubmitting(true);
    setFormError(null);

    const payload = {
      ...formData,
      lat: formData.lat !== '' ? Number(formData.lat) : null,
      lng: formData.lng !== '' ? Number(formData.lng) : null,
    };

    const res = await updateFarm(selectedFarm.id, payload);
    if (res.success) {
      setIsEditOpen(false);
      loadFarms();
    } else {
      setFormError(res.error || 'Failed to update farm');
    }
    setSubmitting(false);
  };

  const handleDelete = async (farmId) => {
    if (!window.confirm(`Are you sure you want to delete Farm #${farmId}?`)) return;
    const res = await deleteFarm(farmId);
    if (res.success) {
      loadFarms();
    } else {
      alert(res.error || 'Failed to delete farm');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <MapPin className="w-7 h-7 text-amber-500" />
            <span>Apiary Farm Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Register and monitor beekeeping farm locations, farmer details, and geolocation coordinates.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Farm</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search farm name, farmer, state, district..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadFarms} />}

      {/* Farms List */}
      {loading ? (
        <LoadingSpinner message="Loading apiary farms..." />
      ) : farms.length === 0 ? (
        <EmptyState 
          title="No Apiary Farms Registered" 
          description="There are no farms matching your criteria. Register a new farm to begin tracking hives." 
          actionLabel="Register New Farm"
          onAction={handleOpenCreate}
          icon={MapPin}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <div key={farm.id} className="glass-panel glass-panel-hover rounded-2xl p-5 border border-stone-800 flex flex-col justify-between space-y-4">
              
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">FARM #{farm.id}</span>
                    <h3 className="text-lg font-bold text-stone-100 font-['Outfit']">{farm.name}</h3>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {farm.hives_count || 0} Hives
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-stone-300">
                  <p className="flex items-center gap-1.5">
                    <span className="text-stone-400">Farmer:</span>
                    <span className="font-semibold text-stone-200">{farm.farmer_name || 'N/A'}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-stone-400">Location:</span>
                    <span>{[farm.location, farm.village, farm.district, farm.state].filter(Boolean).join(', ') || 'Not specified'}</span>
                  </p>
                </div>
              </div>

              {/* Geolocation Map */}
              <FarmMap 
                lat={farm.lat} 
                lng={farm.lng} 
                farmName={farm.name} 
                farmerName={farm.farmer_name} 
                location={farm.location} 
                height="160px" 
              />

              {/* Actions Footer */}
              <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenDashboard(farm)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(farm)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
                    title="Edit Farm"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(farm.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 transition-colors"
                    title="Delete Farm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Farm Modal */}
      <Modal
        isOpen={isCreateOpen || isEditOpen}
        onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
        title={isCreateOpen ? 'Register New Apiary Farm' : `Edit Farm #${selectedFarm?.id}`}
      >
        <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Farm Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Royal Valley Apiary"
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Farmer Name *</label>
            <input
              type="text"
              required
              value={formData.farmer_name}
              onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Location / Area</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Alpine Hillside"
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Village</label>
              <input
                type="text"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                placeholder="e.g. Greenfield"
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="e.g. Highland"
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="e.g. Northland"
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Latitude (GPS)</label>
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                placeholder="e.g. 45.123"
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Longitude (GPS)</label>
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                placeholder="e.g. 12.456"
                className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
              />
            </div>
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
              {submitting ? 'Saving...' : isCreateOpen ? 'Create Farm' : 'Update Farm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Farm Dashboard Detail Modal */}
      <Modal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        title={`Farm Telemetry Dashboard — ${selectedFarm?.name}`}
        maxWidth="max-w-2xl"
      >
        {!farmDashData ? (
          <LoadingSpinner message="Fetching farm live telemetry..." />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl">
                <p className="text-[10px] text-emerald-300 uppercase font-mono">Healthy Hives</p>
                <p className="text-xl font-bold text-emerald-400 font-['Outfit'] mt-1">{farmDashData.healthy_hives}</p>
              </div>
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl">
                <p className="text-[10px] text-amber-300 uppercase font-mono">Warning Hives</p>
                <p className="text-xl font-bold text-amber-400 font-['Outfit'] mt-1">{farmDashData.warning_hives}</p>
              </div>
              <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl">
                <p className="text-[10px] text-rose-300 uppercase font-mono">Critical Hives</p>
                <p className="text-xl font-bold text-rose-400 font-['Outfit'] mt-1">{farmDashData.critical_hives}</p>
              </div>
            </div>

            <div className="p-4 bg-stone-900 rounded-xl border border-stone-800 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-stone-400">Avg Temp:</span>
                <p className="font-bold text-amber-400 text-sm mt-0.5">{farmDashData.average_temperature} °C</p>
              </div>
              <div>
                <span className="text-stone-400">Avg Humidity:</span>
                <p className="font-bold text-amber-400 text-sm mt-0.5">{farmDashData.average_humidity} %</p>
              </div>
              <div>
                <span className="text-stone-400">Total Weight:</span>
                <p className="font-bold text-amber-400 text-sm mt-0.5">{farmDashData.total_hive_weight} kg</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
