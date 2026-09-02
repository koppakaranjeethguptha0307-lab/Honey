const express = require('express');
const router = express.Router();
const honeyBatchesRepository = require('../repositories/honeyBatchesRepository');
const farmsRepository = require('../repositories/farmsRepository');
const hivesRepository = require('../repositories/hivesRepository');
const sensorReadingsRepository = require('../repositories/sensorReadingsRepository');
const qualityTestsRepository = require('../repositories/qualityTestsRepository');
const processingRepository = require('../repositories/processingRepository');
const packagingRepository = require('../repositories/packagingRepository');
const transportationRepository = require('../repositories/transportationRepository');
const { generateQRCodeDataURL } = require('../services/qrCodeService');
const { verifyBatchChain } = require('../services/blockchainVerifier');
const { calculateHealthScore } = require('../services/automationEngine');
const { validateCreateBatch, validateUpdateBatch } = require('../validators/honeyBatchesValidator');
const { authorizeRole } = require('../middleware/authMiddleware');

// POST /api/honey-batches - Create a new honey batch with automatic traceability event (Protected: beekeeper, admin)
router.post('/', authorizeRole(['beekeeper', 'admin']), (req, res) => {
  try {
    const validation = validateCreateBatch(req.body, { farmsRepository, hivesRepository });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const farmId = Number(req.body.farm_id);
    const hiveId = Number(req.body.hive_id);

    const farm = farmsRepository.getFarmById(farmId);
    if (!farm) {
      return res.status(404).json({
        success: false,
        error: `Farm with ID ${farmId} does not exist`
      });
    }

    // Optional health context from latest sensor reading
    let hiveHealthContext = null;
    const latestReading = sensorReadingsRepository.getLatestReadingByHiveId(hiveId);
    if (latestReading) {
      const previous24h = sensorReadingsRepository.getReadingFromHoursAgo(hiveId, 24);
      const computed = calculateHealthScore(latestReading, previous24h);
      hiveHealthContext = {
        health_score: computed.health_score,
        health_status: computed.health_status,
        health_explanation: computed.health_explanation
      };
    }

    const createdBatch = honeyBatchesRepository.createBatch(req.body, farm, hiveHealthContext);

    return res.status(201).json({
      success: true,
      data: createdBatch
    });
  } catch (err) {
    console.error('Batch creation error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'An unexpected error occurred while creating honey batch'
    });
  }
});

// GET /api/honey-batches - List batches with optional filters
router.get('/', (req, res) => {
  try {
    const { farm_id, hive_id, status, honey_type, search } = req.query;
    const batches = honeyBatchesRepository.getAllBatches({
      farm_id,
      hive_id,
      status,
      honey_type,
      search
    });

    return res.status(200).json({
      success: true,
      data: batches
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching honey batches'
    });
  }
});

// GET /api/honey-batches/stats - Aggregated statistics
// IMPORTANT: Registered before GET /:id so "stats" is not parsed as batch ID
router.get('/stats', (req, res) => {
  try {
    const stats = honeyBatchesRepository.getBatchStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching honey batch statistics'
    });
  }
});

// GET /api/honey-batches/:batchId/quality-tests - List all quality tests for a given batch
router.get('/:batchId/quality-tests', (req, res) => {
  try {
    const batchId = req.params.batchId;
    const batch = honeyBatchesRepository.getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Honey batch not found'
      });
    }

    const tests = qualityTestsRepository.getQualityTestsByBatchId(batchId);
    return res.status(200).json({
      success: true,
      data: tests.map(t => ({
        ...t,
        data_source: 'DEMO_QUALITY_RESULT'
      }))
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching quality tests for batch'
    });
  }
});

// GET /api/honey-batches/:batchId/processing-records - List all processing records for a given batch
router.get('/:batchId/processing-records', (req, res) => {
  try {
    const batchId = req.params.batchId;
    const batch = honeyBatchesRepository.getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Honey batch not found'
      });
    }

    const records = processingRepository.getProcessingRecordsByBatchId(batchId);
    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching processing records for batch'
    });
  }
});

// GET /api/honey-batches/:batchId/packaging-records - List all packaging records for a given batch
router.get('/:batchId/packaging-records', (req, res) => {
  try {
    const batchId = req.params.batchId;
    const batch = honeyBatchesRepository.getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Honey batch not found'
      });
    }

    const records = packagingRepository.getPackagingRecordsByBatchId(batchId);
    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching packaging records for batch'
    });
  }
});

// GET /api/honey-batches/:batchId/transportation-records - List all transportation records for a given batch
router.get('/:batchId/transportation-records', (req, res) => {
  try {
    const batchId = req.params.batchId;
    const batch = honeyBatchesRepository.getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Honey batch not found'
      });
    }

    const records = transportationRepository.getTransportRecordsByBatchId(batchId);
    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching transportation records for batch'
    });
  }
});

// GET /api/honey-batches/:batchId/qr-code - Return generated server-side QR Code Data URL for batch
router.get('/:batchId/qr-code', async (req, res) => {
  try {
    const batchId = req.params.batchId;
    const batch = honeyBatchesRepository.getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: `Honey batch '${batchId}' not found`
      });
    }

    const currentStatus = String(batch.status || '').toUpperCase().trim();
    const allowedStatuses = ['PACKAGED', 'IN_TRANSIT', 'DELIVERED'];
    const isPackaged = allowedStatuses.includes(currentStatus) || String(batch.packaging_status).toUpperCase() === 'COMPLETED';

    if (!isPackaged) {
      return res.status(404).json({
        success: false,
        error: `QR code is not available: Batch ${batchId} is in status '${batch.status}' and has not reached PACKAGED or DELIVERED status.`
      });
    }

    const verificationPath = batch.qr_code_url || `/verify/${batch.batch_id}`;
    const qrDataUrl = await generateQRCodeDataURL(verificationPath);

    return res.status(200).json({
      success: true,
      data: {
        batch_id: batch.batch_id,
        verification_path: verificationPath,
        qr_code_data_url: qrDataUrl,
        status: batch.status
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while generating QR code'
    });
  }
});

// GET /api/honey-batches/:batchId/blockchain - Return full SHA-256 demo blockchain chain and cryptographic verification status
router.get('/:batchId/blockchain', (req, res) => {
  try {
    const batchId = req.params.batchId;
    const batch = honeyBatchesRepository.getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: `Honey batch '${batchId}' not found`
      });
    }

    const chainVerification = verifyBatchChain(batchId);

    return res.status(200).json({
      success: true,
      data: {
        batch_id: batch.batch_id,
        blockchain_tx_id: batch.blockchain_tx_id,
        verification_status: chainVerification.status,
        verified: chainVerification.verified,
        message: chainVerification.message,
        block_count: chainVerification.block_count,
        blocks: chainVerification.blocks
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching blockchain records'
    });
  }
});

// GET /api/honey-batches/:id - Get full detail view of a single batch
router.get('/:id', (req, res) => {
  try {
    const batchId = req.params.id;
    const batch = honeyBatchesRepository.getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: 'Honey batch not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: batch
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching honey batch details'
    });
  }
});

// PUT /api/honey-batches/:id - Update an existing batch (Protected: beekeeper, admin)
router.put('/:id', authorizeRole(['beekeeper', 'admin']), (req, res) => {
  try {
    const batchId = req.params.id;
    const currentBatch = honeyBatchesRepository.getBatchById(batchId);

    if (!currentBatch) {
      return res.status(404).json({
        success: false,
        error: 'Honey batch not found'
      });
    }

    const validation = validateUpdateBatch(req.body, { farmsRepository, hivesRepository, currentBatch });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const updatedBatch = honeyBatchesRepository.updateBatch(batchId, req.body);

    return res.status(200).json({
      success: true,
      data: updatedBatch
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating honey batch'
    });
  }
});

// DELETE /api/honey-batches/:id - Delete a batch (Protected: admin)
router.delete('/:id', authorizeRole(['admin']), (req, res) => {
  try {
    const batchId = req.params.id;
    const currentBatch = honeyBatchesRepository.getBatchById(batchId);

    if (!currentBatch) {
      return res.status(404).json({
        success: false,
        error: 'Honey batch not found'
      });
    }

    const result = honeyBatchesRepository.deleteBatch(batchId);

    if (!result.deleted && result.reason === 'HAS_TRACEABILITY_EVENTS') {
      return res.status(409).json({
        success: false,
        error: `Cannot delete honey batch ${batchId}: ${result.eventCount} traceability event(s) exist for this batch.`
      });
    }

    return res.status(200).json({
      success: true,
      data: { id: batchId }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while deleting honey batch'
    });
  }
});

module.exports = router;
