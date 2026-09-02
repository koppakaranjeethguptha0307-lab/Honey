const express = require('express');
const router = express.Router();
const farmsRepository = require('../repositories/farmsRepository');
const hivesRepository = require('../repositories/hivesRepository');
const sensorReadingsRepository = require('../repositories/sensorReadingsRepository');
const alertsRepository = require('../repositories/alertsRepository');
const { validateCreateFarm, validateUpdateFarm } = require('../validators/farmsValidator');
const { authorizeRole } = require('../middleware/authMiddleware');
const { calculateHealthScore } = require('../services/automationEngine');

// POST /api/farms - Create a new farm (Protected: beekeeper, admin)
router.post('/', authorizeRole(['beekeeper', 'admin']), (req, res) => {
  try {
    const validation = validateCreateFarm(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const farmData = {
      ...req.body,
      hives_count: 0,
      created_at: new Date().toISOString()
    };

    const newFarm = farmsRepository.createFarm(farmData);
    return res.status(201).json({
      success: true,
      data: newFarm
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while creating the farm'
    });
  }
});

// GET /api/farms - List all farms (with optional state, district, search filters)
router.get('/', (req, res) => {
  try {
    const { state, district, search } = req.query;
    const farms = farmsRepository.getAllFarms({ state, district, search });
    return res.status(200).json({
      success: true,
      data: farms
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching farms'
    });
  }
});

// GET /api/farms/stats - Aggregate farm statistics
// IMPORTANT: Registered before GET /:id so "stats" is not parsed as farm ID
router.get('/stats', (req, res) => {
  try {
    const stats = farmsRepository.getFarmStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching farm statistics'
    });
  }
});

// GET /api/farms/:id - Get single farm by ID
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid farm ID'
      });
    }

    const farm = farmsRepository.getFarmById(id);
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: 'Farm not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: farm
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching the farm'
    });
  }
});

// GET /api/farms/:farmId/dashboard - Aggregated farm dashboard data
router.get('/:farmId/dashboard', (req, res) => {
  try {
    const farmId = Number(req.params.farmId);
    if (isNaN(farmId) || farmId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid farm ID'
      });
    }

    const farm = farmsRepository.getFarmById(farmId);
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: 'Farm not found'
      });
    }

    const hives = hivesRepository.getAllHives({ farm_id: farmId });
    const total_hives = hives.length;

    let healthy_hives = 0;
    let warning_hives = 0;
    let critical_hives = 0;

    let sumTemp = 0;
    let sumHumidity = 0;
    let sumWeight = 0;
    let countReadings = 0;

    const latest_readings = [];

    for (const hive of hives) {
      const latestReading = sensorReadingsRepository.getLatestReadingByHiveId(hive.id);
      if (latestReading) {
        latest_readings.push(latestReading);
        const previous24h = sensorReadingsRepository.getReadingFromHoursAgo(hive.id, 24);
        const { health_status } = calculateHealthScore(latestReading, previous24h);

        if (health_status === 'EXCELLENT' || health_status === 'HEALTHY') {
          healthy_hives++;
        } else if (health_status === 'WARNING') {
          warning_hives++;
        } else {
          critical_hives++;
        }

        if (latestReading.temp !== null && latestReading.temp !== undefined) {
          sumTemp += Number(latestReading.temp);
        }
        if (latestReading.humidity !== null && latestReading.humidity !== undefined) {
          sumHumidity += Number(latestReading.humidity);
        }
        if (latestReading.weight !== null && latestReading.weight !== undefined) {
          sumWeight += Number(latestReading.weight);
        }
        countReadings++;
      } else {
        healthy_hives++;
      }
    }

    const average_temperature = countReadings > 0 ? Number((sumTemp / countReadings).toFixed(1)) : 0;
    const average_humidity = countReadings > 0 ? Number((sumHumidity / countReadings).toFixed(1)) : 0;
    const total_hive_weight = Number(sumWeight.toFixed(1));

    const allAlerts = alertsRepository.getAllAlerts({ is_read: 0 });
    const active_alerts = allAlerts.filter(a => Number(a.farm_id) === farmId);

    return res.status(200).json({
      success: true,
      data: {
        farm,
        total_hives,
        healthy_hives,
        warning_hives,
        critical_hives,
        average_temperature,
        average_humidity,
        total_hive_weight,
        latest_readings,
        active_alerts
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching farm dashboard'
    });
  }
});

// PUT /api/farms/:id - Update an existing farm (Protected: beekeeper, admin)
router.put('/:id', authorizeRole(['beekeeper', 'admin']), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid farm ID'
      });
    }

    const existingFarm = farmsRepository.getFarmById(id);
    if (!existingFarm) {
      return res.status(404).json({
        success: false,
        error: 'Farm not found'
      });
    }

    const validation = validateUpdateFarm(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const updatedFarm = farmsRepository.updateFarm(id, req.body);
    return res.status(200).json({
      success: true,
      data: updatedFarm
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating the farm'
    });
  }
});

// DELETE /api/farms/:id - Delete a farm (Protected: admin)
router.delete('/:id', authorizeRole(['admin']), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid farm ID'
      });
    }

    const existingFarm = farmsRepository.getFarmById(id);
    if (!existingFarm) {
      return res.status(404).json({
        success: false,
        error: 'Farm not found'
      });
    }

    const hiveCount = hivesRepository.countHivesByFarmId(id);
    if (hiveCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete farm: ${hiveCount} hive(s) still belong to this farm.`
      });
    }

    farmsRepository.deleteFarm(id);
    return res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while deleting the farm'
    });
  }
});

module.exports = router;
