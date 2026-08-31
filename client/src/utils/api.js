/**
 * Honey Chain Centralized API Service Layer
 * Consumes VITE_API_URL and normalizes backend response envelopes.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      json = { success: false, error: text || 'Invalid server response' };
    }

    if (!response.ok) {
      const errorMessage = json?.error || json?.message || `HTTP error ${response.status}`;
      return {
        success: false,
        statusCode: response.status,
        error: errorMessage,
        data: null
      };
    }

    return {
      success: true,
      statusCode: response.status,
      error: null,
      ...json
    };
  } catch (err) {
    return {
      success: false,
      statusCode: 0,
      error: err.message === 'Failed to fetch' 
        ? 'Cannot connect to Honey Chain backend server. Please verify the backend is running.'
        : err.message || 'Network request failed',
      data: null
    };
  }
}

// System Health
export const getHealth = () => apiFetch('/api/health');
export const getDbHealth = () => apiFetch('/api/health/db');

// Farms
export const getFarms = (params = {}) => {
  const query = new URLSearchParams();
  if (params.state) query.append('state', params.state);
  if (params.district) query.append('district', params.district);
  if (params.search) query.append('search', params.search);
  const qStr = query.toString();
  return apiFetch(`/api/farms${qStr ? '?' + qStr : ''}`);
};
export const getFarmStats = () => apiFetch('/api/farms/stats');
export const getFarm = (id) => apiFetch(`/api/farms/${id}`);
export const getFarmDashboard = (farmId) => apiFetch(`/api/farms/${farmId}/dashboard`);
export const createFarm = (data) => apiFetch('/api/farms', { method: 'POST', body: data });
export const updateFarm = (id, data) => apiFetch(`/api/farms/${id}`, { method: 'PUT', body: data });
export const deleteFarm = (id) => apiFetch(`/api/farms/${id}`, { method: 'DELETE' });

// Hives
export const getHives = (params = {}) => {
  const query = new URLSearchParams();
  if (params.farm_id) query.append('farm_id', params.farm_id);
  const qStr = query.toString();
  return apiFetch(`/api/hives${qStr ? '?' + qStr : ''}`);
};
export const getHiveStats = () => apiFetch('/api/hives/stats');
export const getHive = (id) => apiFetch(`/api/hives/${id}`);
export const createHive = (data) => apiFetch('/api/hives', { method: 'POST', body: data });
export const updateHive = (id, data) => apiFetch(`/api/hives/${id}`, { method: 'PUT', body: data });
export const deleteHive = (id) => apiFetch(`/api/hives/${id}`, { method: 'DELETE' });

// Sensors & IoT
export const addSensorReading = (hiveId, data) => apiFetch(`/api/hives/${hiveId}/sensor-readings`, { method: 'POST', body: data });
export const getSensorReadings = (hiveId, params = {}) => {
  const query = new URLSearchParams();
  if (params.limit) query.append('limit', params.limit);
  const qStr = query.toString();
  return apiFetch(`/api/hives/${hiveId}/sensor-readings${qStr ? '?' + qStr : ''}`);
};
export const simulateSensorReading = (hiveId, data = {}) => apiFetch(`/api/hives/${hiveId}/simulate-reading`, { method: 'POST', body: data });

// Alerts
export const getAlerts = (params = {}) => {
  const query = new URLSearchParams();
  if (params.severity) query.append('severity', params.severity);
  if (params.hive_id) query.append('hive_id', params.hive_id);
  if (params.is_read !== undefined) query.append('is_read', params.is_read);
  const qStr = query.toString();
  return apiFetch(`/api/alerts${qStr ? '?' + qStr : ''}`);
};
export const markAlertRead = (id) => apiFetch(`/api/alerts/${id}/read`, { method: 'PATCH' });
export const markAlertUnread = (id) => apiFetch(`/api/alerts/${id}/unread`, { method: 'PATCH' });

// Honey Batches
export const getBatches = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.quality_status) query.append('quality_status', params.quality_status);
  if (params.farm_id) query.append('farm_id', params.farm_id);
  if (params.search) query.append('search', params.search);
  const qStr = query.toString();
  return apiFetch(`/api/honey-batches${qStr ? '?' + qStr : ''}`);
};
export const getBatchStats = () => apiFetch('/api/honey-batches/stats');
export const getBatch = (batchId) => apiFetch(`/api/honey-batches/${batchId}`);
export const createBatch = (data) => apiFetch('/api/honey-batches', { method: 'POST', body: data });
export const updateBatch = (batchId, data) => apiFetch(`/api/honey-batches/${batchId}`, { method: 'PUT', body: data });
export const deleteBatch = (batchId) => apiFetch(`/api/honey-batches/${batchId}`, { method: 'DELETE' });
export const getBatchQR = (batchId) => apiFetch(`/api/honey-batches/${batchId}/qr-code`);
export const getBatchBlockchain = (batchId) => apiFetch(`/api/honey-batches/${batchId}/blockchain`);

// Quality Testing
export const getQualityTests = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.batch_id) query.append('batch_id', params.batch_id);
  const qStr = query.toString();
  return apiFetch(`/api/quality-tests${qStr ? '?' + qStr : ''}`);
};
export const getQualityStats = () => apiFetch('/api/quality-tests/stats');
export const getQualityTest = (id) => apiFetch(`/api/quality-tests/${id}`);
export const createQualityTest = (data) => apiFetch('/api/quality-tests', { method: 'POST', body: data });
export const updateQualityTest = (id, data) => apiFetch(`/api/quality-tests/${id}`, { method: 'PUT', body: data });
export const deleteQualityTest = (id) => apiFetch(`/api/quality-tests/${id}`, { method: 'DELETE' });
export const approveQualityTest = (id, data = {}) => apiFetch(`/api/quality-tests/${id}/approve`, { method: 'PATCH', body: data });
export const rejectQualityTest = (id, data = {}) => apiFetch(`/api/quality-tests/${id}/reject`, { method: 'PATCH', body: data });

// Processing
export const getProcessingRecords = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.batch_id) query.append('batch_id', params.batch_id);
  const qStr = query.toString();
  return apiFetch(`/api/processing-records${qStr ? '?' + qStr : ''}`);
};
export const getProcessingStats = () => apiFetch('/api/processing-records/stats');
export const getProcessingRecord = (id) => apiFetch(`/api/processing-records/${id}`);
export const createProcessingRecord = (data) => apiFetch('/api/processing-records', { method: 'POST', body: data });
export const updateProcessingRecord = (id, data) => apiFetch(`/api/processing-records/${id}`, { method: 'PUT', body: data });
export const deleteProcessingRecord = (id) => apiFetch(`/api/processing-records/${id}`, { method: 'DELETE' });
export const startProcessingRecord = (id) => apiFetch(`/api/processing-records/${id}/start`, { method: 'PATCH' });
export const completeProcessingRecord = (id, data = {}) => apiFetch(`/api/processing-records/${id}/complete`, { method: 'PATCH', body: data });

// Packaging
export const getPackagingRecords = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.batch_id) query.append('batch_id', params.batch_id);
  const qStr = query.toString();
  return apiFetch(`/api/packaging-records${qStr ? '?' + qStr : ''}`);
};
export const getPackagingStats = () => apiFetch('/api/packaging-records/stats');
export const getPackagingRecord = (id) => apiFetch(`/api/packaging-records/${id}`);
export const createPackagingRecord = (data) => apiFetch('/api/packaging-records', { method: 'POST', body: data });
export const updatePackagingRecord = (id, data) => apiFetch(`/api/packaging-records/${id}`, { method: 'PUT', body: data });
export const deletePackagingRecord = (id) => apiFetch(`/api/packaging-records/${id}`, { method: 'DELETE' });
export const startPackagingRecord = (id) => apiFetch(`/api/packaging-records/${id}/start`, { method: 'PATCH' });
export const completePackagingRecord = (id) => apiFetch(`/api/packaging-records/${id}/complete`, { method: 'PATCH' });

// Transportation
export const getTransportationRecords = (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.batch_id) query.append('batch_id', params.batch_id);
  const qStr = query.toString();
  return apiFetch(`/api/transportation-records${qStr ? '?' + qStr : ''}`);
};
export const getTransportationStats = () => apiFetch('/api/transportation-records/stats');
export const getTransportationRecord = (id) => apiFetch(`/api/transportation-records/${id}`);
export const createTransportationRecord = (data) => apiFetch('/api/transportation-records', { method: 'POST', body: data });
export const updateTransportationRecord = (id, data) => apiFetch(`/api/transportation-records/${id}`, { method: 'PUT', body: data });
export const deleteTransportationRecord = (id) => apiFetch(`/api/transportation-records/${id}`, { method: 'DELETE' });
export const pickupTransportation = (id) => apiFetch(`/api/transportation-records/${id}/pickup`, { method: 'PATCH' });
export const inTransitTransportation = (id) => apiFetch(`/api/transportation-records/${id}/in-transit`, { method: 'PATCH' });
export const deliverTransportation = (id, data = {}) => apiFetch(`/api/transportation-records/${id}/deliver`, { method: 'PATCH', body: data });

// Public Verification
export const verifyBatchPublic = (batchId) => apiFetch(`/verify/${batchId}`);

// Authentication
export const loginUser = (credentials) => apiFetch('/api/auth/login', { method: 'POST', body: credentials });
export const registerUser = (userData) => apiFetch('/api/auth/register', { method: 'POST', body: userData });
export const getCurrentUser = (token) => apiFetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });

