const express = require('express');
const router = express.Router();
const hivesRepository = require('../repositories/hivesRepository');
const farmsRepository = require('../repositories/farmsRepository');
const sensorReadingsRepository = require('../repositories/sensorReadingsRepository');
const alertsRepository = require('../repositories/alertsRepository');
const { validateCreateHive, validateUpdateHive } = require('../validators/hivesValidator');
const { validateSensorReading } = require('../validators/sensorReadingsValidator');
const { generateSimulatedReading } = require('../services/iotSimulator');
const { calculateHealthScore, evaluateAutomationRules } = require('../services/automationEngine');

// POST /api/hives - Create a new hive under a given farm_id
router.post('/', (req, res) => {
  try {
    const validation = validateCreateHive(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const farmId = Number(req.body.farm_id);
    const parentFarm = farmsRepository.getFarmById(farmId);
    if (!parentFarm) {
      return res.status(404).json({
        success: false,
        error: `Farm with ID ${farmId} does not exist`
      });
    }

    const newHive = hivesRepository.createHive(req.body);

    // Increment parent farm's hives_count
    farmsRepository.incrementHivesCount(farmId);

    return res.status(201).json({
      success: true,
      data: newHive
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while creating the hive'
    });
  }
});

// GET /api/hives - List all hives (optional ?farm_id= query param)
router.get('/', (req, res) => {
  try {
    const { farm_id } = req.query;
    const hives = hivesRepository.getAllHives({ farm_id });
    return res.status(200).json({
      success: true,
      data: hives
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching hives'
    });
  }
});

// GET /api/hives/stats - Aggregated hive statistics
// IMPORTANT: Registered before GET /:id so "stats" is not parsed as hive ID
router.get('/stats', (req, res) => {
  try {
    const stats = hivesRepository.getHiveStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching hive statistics'
    });
  }
});

// GET /api/hives/:id - Get single hive by ID
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hive ID'
      });
    }

    const hive = hivesRepository.getHiveById(id);
    if (!hive) {
      return res.status(404).json({
        success: false,
        error: 'Hive not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: hive
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching the hive'
    });
  }
});

// PUT /api/hives/:id - Update an existing hive
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hive ID'
      });
    }

    const existingHive = hivesRepository.getHiveById(id);
    if (!existingHive) {
      return res.status(404).json({
        success: false,
        error: 'Hive not found'
      });
    }

    const validation = validateUpdateHive(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    // If farm_id is being changed, check if new farm exists and update hives_count for both farms
    if (req.body.farm_id !== undefined && req.body.farm_id !== null && Number(req.body.farm_id) !== existingHive.farm_id) {
      const newFarmId = Number(req.body.farm_id);
      const newFarm = farmsRepository.getFarmById(newFarmId);
      if (!newFarm) {
        return res.status(404).json({
          success: false,
          error: `New target farm with ID ${newFarmId} does not exist`
        });
      }
      farmsRepository.decrementHivesCount(existingHive.farm_id);
      farmsRepository.incrementHivesCount(newFarmId);
    }

    const updatedHive = hivesRepository.updateHive(id, req.body);
    return res.status(200).json({
      success: true,
      data: updatedHive
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating the hive'
    });
  }
});

// DELETE /api/hives/:id - Delete a hive and decrement parent farm's hives_count
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hive ID'
      });
    }

    const existingHive = hivesRepository.getHiveById(id);
    if (!existingHive) {
      return res.status(404).json({
        success: false,
        error: 'Hive not found'
      });
    }

    const farmId = existingHive.farm_id;
    hivesRepository.deleteHive(id);
    farmsRepository.decrementHivesCount(farmId);

    return res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while deleting the hive'
    });
  }
});

// --- PHASE 4: SMART MONITORING & AUTOMATION ENDPOINTS ---

// POST /api/hives/:hiveId/sensor-readings - Submit a manual sensor reading
router.post('/:hiveId/sensor-readings', (req, res) => {
  try {
    const hiveId = Number(req.params.hiveId);
    if (isNaN(hiveId) || hiveId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid hive ID' });
    }

    const hive = hivesRepository.getHiveById(hiveId);
    if (!hive) {
      return res.status(404).json({ success: false, error: 'Hive not found' });
    }

    const validation = validateSensorReading(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: validation.errors.join('; ') });
    }

    const previous24h = sensorReadingsRepository.getReadingFromHoursAgo(hiveId, 24);
    const { health_score, health_status, health_explanation } = calculateHealthScore(req.body, previous24h);

    const timestamp = req.body.timestamp || new Date().toISOString();
    const readingData = {
      hive_id: hiveId,
      temp: req.body.temp,
      humidity: req.body.humidity,
      weight: req.body.weight,
      activity: req.body.activity.toUpperCase().trim(),
      health_score,
      is_simulated: 0,
      timestamp
    };

    const savedReading = sensorReadingsRepository.createReading(readingData);

    // Update hive state
    hivesRepository.updateHive(hiveId, {
      temp: req.body.temp,
      humidity: req.body.humidity,
      weight: req.body.weight,
      activity: req.body.activity.toUpperCase().trim(),
      health_score,
      last_inspection: timestamp
    });

    const { alerts_created } = evaluateAutomationRules(hiveId, hive.farm_id, savedReading, previous24h);

    return res.status(201).json({
      success: true,
      data: {
        hive_id: hiveId,
        temperature: Number(savedReading.temp),
        humidity: Number(savedReading.humidity),
        weight: Number(savedReading.weight),
        activity: savedReading.activity,
        simulated: false,
        data_source: 'MANUAL SENSOR INPUT',
        health_score,
        health_status,
        health_explanation,
        alerts_created: alerts_created.map(a => ({
          id: a.id,
          alert_type: a.alert_type,
          severity: a.severity,
          title: a.title,
          message: a.message
        }))
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'An unexpected error occurred while saving sensor reading' });
  }
});

// GET /api/hives/:hiveId/sensor-readings - List sensor readings history
router.get('/:hiveId/sensor-readings', (req, res) => {
  try {
    const hiveId = Number(req.params.hiveId);
    if (isNaN(hiveId) || hiveId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid hive ID' });
    }

    const hive = hivesRepository.getHiveById(hiveId);
    if (!hive) {
      return res.status(404).json({ success: false, error: 'Hive not found' });
    }

    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const readings = sensorReadingsRepository.getReadingsByHiveId(hiveId, { limit });

    return res.status(200).json({
      success: true,
      data: readings
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'An unexpected error occurred while fetching sensor readings' });
  }
});

// GET /api/hives/:hiveId/latest-reading - Get latest reading for a hive
router.get('/:hiveId/latest-reading', (req, res) => {
  try {
    const hiveId = Number(req.params.hiveId);
    if (isNaN(hiveId) || hiveId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid hive ID' });
    }

    const hive = hivesRepository.getHiveById(hiveId);
    if (!hive) {
      return res.status(404).json({ success: false, error: 'Hive not found' });
    }

    const latest = sensorReadingsRepository.getLatestReadingByHiveId(hiveId);
    return res.status(200).json({
      success: true,
      data: latest || null
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'An unexpected error occurred while fetching latest reading' });
  }
});

// POST /api/hives/:hiveId/simulate-reading - Generate and process a simulated IoT reading
router.post('/:hiveId/simulate-reading', (req, res) => {
  try {
    const hiveId = Number(req.params.hiveId);
    if (isNaN(hiveId) || hiveId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid hive ID' });
    }

    const hive = hivesRepository.getHiveById(hiveId);
    if (!hive) {
      return res.status(404).json({ success: false, error: 'Hive not found' });
    }

    const latestKnown = sensorReadingsRepository.getLatestReadingByHiveId(hiveId);
    const forceAnomaly = req.body && req.body.force_anomaly === true;
    const simReading = generateSimulatedReading(hive, latestKnown, forceAnomaly);

    const previous24h = sensorReadingsRepository.getReadingFromHoursAgo(hiveId, 24);
    const { health_score, health_status, health_explanation } = calculateHealthScore(simReading, previous24h);

    const readingData = {
      hive_id: hiveId,
      temp: simReading.temp,
      humidity: simReading.humidity,
      weight: simReading.weight,
      activity: simReading.activity,
      health_score,
      is_simulated: 1,
      timestamp: simReading.timestamp
    };

    const savedReading = sensorReadingsRepository.createReading(readingData);

    // Update hive state
    hivesRepository.updateHive(hiveId, {
      temp: simReading.temp,
      humidity: simReading.humidity,
      weight: simReading.weight,
      activity: simReading.activity,
      health_score,
      last_inspection: simReading.timestamp
    });

    const { alerts_created } = evaluateAutomationRules(hiveId, hive.farm_id, savedReading, previous24h);

    return res.status(201).json({
      success: true,
      data: {
        hive_id: hiveId,
        temperature: Number(savedReading.temp),
        humidity: Number(savedReading.humidity),
        weight: Number(savedReading.weight),
        activity: savedReading.activity,
        simulated: true,
        data_source: 'SIMULATED SENSOR DATA',
        health_score,
        health_status,
        health_explanation,
        alerts_created: alerts_created.map(a => ({
          id: a.id,
          alert_type: a.alert_type,
          severity: a.severity,
          title: a.title,
          message: a.message
        }))
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'An unexpected error occurred while simulating reading' });
  }
});

// GET /api/hives/:hiveId/dashboard - Get detailed hive dashboard data
router.get('/:hiveId/dashboard', (req, res) => {
  try {
    const hiveId = Number(req.params.hiveId);
    if (isNaN(hiveId) || hiveId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid hive ID' });
    }

    const hive = hivesRepository.getHiveById(hiveId);
    if (!hive) {
      return res.status(404).json({ success: false, error: 'Hive not found' });
    }

    const latest_sensor_reading = sensorReadingsRepository.getLatestReadingByHiveId(hiveId);
    const recent_readings = sensorReadingsRepository.getReadingsByHiveId(hiveId, { limit: 10 });
    const active_alerts = alertsRepository.getAlertsByHiveId(hiveId, { is_read: 0 });

    let health_score = 100;
    let health_status = 'EXCELLENT';
    let health_explanation = 'No sensor readings submitted yet';

    if (latest_sensor_reading) {
      const previous24h = sensorReadingsRepository.getReadingFromHoursAgo(hiveId, 24);
      const computed = calculateHealthScore(latest_sensor_reading, previous24h);
      health_score = computed.health_score;
      health_status = computed.health_status;
      health_explanation = computed.health_explanation;
    }

    return res.status(200).json({
      success: true,
      data: {
        hive,
        latest_sensor_reading,
        health_score,
        health_status,
        health_explanation,
        recent_readings,
        active_alerts
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'An unexpected error occurred while fetching hive dashboard' });
  }
});

// GET /api/hives/:hiveId/alerts - Get alerts for specific hive
router.get('/:hiveId/alerts', (req, res) => {
  try {
    const hiveId = Number(req.params.hiveId);
    if (isNaN(hiveId) || hiveId <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid hive ID' });
    }

    const hive = hivesRepository.getHiveById(hiveId);
    if (!hive) {
      return res.status(404).json({ success: false, error: 'Hive not found' });
    }

    const is_read = req.query.is_read;
    const alerts = alertsRepository.getAlertsByHiveId(hiveId, { is_read });

    return res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'An unexpected error occurred while fetching hive alerts' });
  }
});

module.exports = router;
