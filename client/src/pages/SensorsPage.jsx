import React, { useState, useEffect } from 'react';
import { 
  Activity, Thermometer, Droplets, Scale, Plus, RefreshCw, Zap
} from 'lucide-react';
import { getHives, getSensorReadings, addSensorReading, simulateSensorReading } from '../utils/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorAlert } from '../components/common/ErrorAlert';
import { Modal } from '../components/common/Modal';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';

export function SensorsPage() {
  const [hives, setHives] = useState([]);
  const [selectedHiveId, setSelectedHiveId] = useState('');
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    temp: 35.0,
    humidity: 60.0,
    weight: 42.5,
    activity: 'HIGH'
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadHives = async () => {
    setLoading(true);
    const res = await getHives();
    if (res.success && res.data && res.data.length > 0) {
      setHives(res.data);
      const firstId = String(res.data[0].id);
      setSelectedHiveId(firstId);
      loadReadings(firstId);
    } else {
      setLoading(false);
    }
  };

  const loadReadings = async (hiveId) => {
    if (!hiveId) return;
    setLoading(true);
    setError(null);
    const res = await getSensorReadings(hiveId, { limit: 20 });
    if (res.success) {
      setReadings((res.data || []).reverse()); // Oldest to newest for charts
    } else {
      setError(res.error || 'Failed to fetch sensor readings');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHives();
  }, []);

  const handleHiveChange = (e) => {
    const id = e.target.value;
    setSelectedHiveId(id);
    loadReadings(id);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHiveId) return;
    setSubmitting(true);
    setFormError(null);

    const res = await addSensorReading(Number(selectedHiveId), {
      temp: Number(formData.temp),
      humidity: Number(formData.humidity),
      weight: Number(formData.weight),
      activity: formData.activity
    });

    if (res.success) {
      setIsAddOpen(false);
      loadReadings(selectedHiveId);
    } else {
      setFormError(res.error || 'Failed to add sensor reading');
    }
    setSubmitting(false);
  };

  const handleSimulate = async () => {
    if (!selectedHiveId) return;
    setLoading(true);
    const res = await simulateSensorReading(Number(selectedHiveId));
    if (res.success) {
      loadReadings(selectedHiveId);
    } else {
      alert(res.error || 'Simulation failed');
      setLoading(false);
    }
  };

  const chartData = readings.map(r => ({
    time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
    temp: r.temp !== null ? Number(r.temp) : 0,
    humidity: r.humidity !== null ? Number(r.humidity) : 0,
    weight: r.weight !== null ? Number(r.weight) : 0,
    health_score: r.health_score !== null ? Number(r.health_score) : 0,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-amber-500/20">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-2">
            <Activity className="w-7 h-7 text-amber-500" />
            <span>IoT Sensor Monitoring & Telemetry</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Real-time hive environmental analytics built directly from raw sensor telemetry histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedHiveId}
            onChange={handleHiveChange}
            className="px-3.5 py-2 text-xs font-bold bg-stone-900 border border-stone-800 rounded-xl text-amber-400 focus:border-amber-500 font-mono"
          >
            {hives.map(h => (
              <option key={h.id} value={h.id}>Hive #{h.id} ({h.type})</option>
            ))}
          </select>

          <button
            onClick={handleSimulate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/60 rounded-xl transition-all"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Simulate
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Input Manual Reading
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => loadReadings(selectedHiveId)} />}

      {/* Main Charts */}
      {loading ? (
        <LoadingSpinner message="Loading telemetry sensor charts..." />
      ) : chartData.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl text-center border border-stone-800 space-y-4">
          <Activity className="w-10 h-10 text-amber-500/50 mx-auto" />
          <h3 className="text-lg font-bold text-stone-200 font-['Outfit']">No Telemetry Readings Recorded</h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            Click 'Simulate' or 'Input Manual Reading' to record sensor data for Hive #{selectedHiveId}.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Temperature & Humidity Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-stone-800 space-y-4">
            <h3 className="text-base font-bold text-stone-100 font-['Outfit'] flex items-center justify-between">
              <span>Temperature (°C) & Humidity (%) Trends</span>
              <span className="text-xs font-mono text-stone-400">Hive #{selectedHiveId}</span>
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                  <XAxis dataKey="time" stroke="#a8a29e" fontSize={10} />
                  <YAxis stroke="#a8a29e" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', color: '#f5f5f4', borderRadius: '0.5rem' }} />
                  <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2.5} name="Temp (°C)" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="humidity" stroke="#38bdf8" strokeWidth={2} name="Humidity (%)" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weight & Computed Health Score Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-stone-800 space-y-4">
              <h3 className="text-base font-bold text-stone-100 font-['Outfit']">Hive Scale Weight (kg)</h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                    <XAxis dataKey="time" stroke="#a8a29e" fontSize={10} />
                    <YAxis stroke="#a8a29e" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', color: '#f5f5f4', borderRadius: '0.5rem' }} />
                    <Line type="monotone" dataKey="weight" stroke="#c084fc" strokeWidth={2.5} name="Weight (kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-stone-800 space-y-4">
              <h3 className="text-base font-bold text-stone-100 font-['Outfit']">Computed Colony Health Score</h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                    <XAxis dataKey="time" stroke="#a8a29e" fontSize={10} />
                    <YAxis domain={[0, 100]} stroke="#a8a29e" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#44403c', color: '#f5f5f4', borderRadius: '0.5rem' }} />
                    <Line type="monotone" dataKey="health_score" stroke="#10b981" strokeWidth={2.5} name="Health (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Raw Log Table */}
          <div className="glass-panel rounded-2xl p-6 border border-stone-800 space-y-4">
            <h3 className="text-base font-bold text-stone-100 font-['Outfit']">Telemetry Log History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-stone-300">
                <thead className="bg-stone-900 text-stone-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Temperature</th>
                    <th className="p-3">Humidity</th>
                    <th className="p-3">Weight</th>
                    <th className="p-3">Bee Activity</th>
                    <th className="p-3">Health Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {readings.slice().reverse().map((r) => (
                    <tr key={r.id} className="hover:bg-stone-900/60 transition-colors">
                      <td className="p-3 font-mono text-stone-400">{r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A'}</td>
                      <td className="p-3 font-bold text-amber-400">{r.temp}°C</td>
                      <td className="p-3 font-bold text-sky-400">{r.humidity}%</td>
                      <td className="p-3 font-bold text-purple-400">{r.weight} kg</td>
                      <td className="p-3 font-semibold uppercase">{r.activity}</td>
                      <td className="p-3 font-bold text-emerald-400">{r.health_score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Manual Input Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={`Manual Sensor Input — Hive #${selectedHiveId}`}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && <ErrorAlert message={formError} />}

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Temperature (°C) *</label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.temp}
              onChange={(e) => setFormData({ ...formData, temp: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Humidity (%) *</label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.humidity}
              onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Weight (kg) *</label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-1">Bee Activity Level *</label>
            <select
              value={formData.activity}
              onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:border-amber-500"
            >
              <option value="NORMAL">NORMAL</option>
              <option value="HIGH">HIGH</option>
              <option value="LOW">LOW</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-stone-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-400 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-md shadow-amber-500/20"
            >
              {submitting ? 'Submitting...' : 'Save Sensor Reading'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
