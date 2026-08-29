const express = require('express');
const router = express.Router();
const packagingRepository = require('../repositories/packagingRepository');
const honeyBatchesRepository = require('../repositories/honeyBatchesRepository');
const {
  validatePackagingCreationTransition,
  validatePackagingStatusTransition
} = require('../services/batchStatusService');
const {
  validateCreatePackagingRecord,
  validateUpdatePackagingRecord
} = require('../validators/packagingValidator');

// POST /api/packaging-records - Create a new packaging record
router.post('/', (req, res) => {
  try {
    const validation = validateCreatePackagingRecord(req.body, { honeyBatchesRepository });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const batchId = req.body.batch_id.trim();
    const batch = honeyBatchesRepository.getBatchById(batchId);
    const activePack = packagingRepository.getActivePackagingRecordByBatchId(batchId);

    const transitionCheck = validatePackagingCreationTransition(batch, activePack);
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Packaging Facility';
    const createdRecord = packagingRepository.createPackagingRecordTx(req.body, farmLocation);

    return res.status(201).json({
      success: true,
      data: createdRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while creating packaging record'
    });
  }
});

// GET /api/packaging-records - List packaging records (support ?batch_id=&status=)
router.get('/', (req, res) => {
  try {
    const { batch_id, status } = req.query;
    const records = packagingRepository.getAllPackagingRecords({ batch_id, status });
    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching packaging records'
    });
  }
});

// GET /api/packaging-records/stats - Packaging statistics
// Registered BEFORE /:id to prevent route collision
router.get('/stats', (req, res) => {
  try {
    const stats = packagingRepository.getPackagingStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching packaging statistics'
    });
  }
});

// GET /api/packaging-records/:id - Get single packaging record
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid packaging record ID' });
    }

    const record = packagingRepository.getPackagingRecordById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Packaging record not found' });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching packaging record'
    });
  }
});

// PUT /api/packaging-records/:id - Partial update (blocked if COMPLETED)
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid packaging record ID' });
    }

    const currentRecord = packagingRepository.getPackagingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Packaging record not found' });
    }

    const validation = validateUpdatePackagingRecord(req.body, { currentRecord });
    if (!validation.isValid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const updatedRecord = packagingRepository.updatePackagingRecord(id, req.body);
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating packaging record'
    });
  }
});

// DELETE /api/packaging-records/:id - Delete record (blocked with 409 if COMPLETED)
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid packaging record ID' });
    }

    const currentRecord = packagingRepository.getPackagingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Packaging record not found' });
    }

    const result = packagingRepository.deletePackagingRecord(id);
    if (!result.deleted && result.reason === 'RECORD_COMPLETED') {
      return res.status(409).json({
        success: false,
        error: `Cannot delete packaging record ${id}: Record is COMPLETED and has generated batch state transitions and QR code.`
      });
    }

    return res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while deleting packaging record'
    });
  }
});

// PATCH /api/packaging-records/:id/start - Move status to IN_PROGRESS
router.patch('/:id/start', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid packaging record ID' });
    }

    const currentRecord = packagingRepository.getPackagingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Packaging record not found' });
    }

    const transitionCheck = validatePackagingStatusTransition(currentRecord, 'IN_PROGRESS');
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const batch = honeyBatchesRepository.getBatchById(currentRecord.batch_id);
    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Packaging Facility';

    const updatedRecord = packagingRepository.updatePackagingStatusTx(id, 'IN_PROGRESS', farmLocation);
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while starting packaging'
    });
  }
});

// PATCH /api/packaging-records/:id/complete - Move status to COMPLETED
router.patch('/:id/complete', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid packaging record ID' });
    }

    const currentRecord = packagingRepository.getPackagingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Packaging record not found' });
    }

    const transitionCheck = validatePackagingStatusTransition(currentRecord, 'COMPLETED');
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const batch = honeyBatchesRepository.getBatchById(currentRecord.batch_id);
    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Packaging Facility';

    const updatedRecord = packagingRepository.updatePackagingStatusTx(id, 'COMPLETED', farmLocation);
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while completing packaging'
    });
  }
});

// PATCH /api/packaging-records/:id/status - Generic status update
router.patch('/:id/status', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid packaging record ID' });
    }

    const targetStatus = req.body && req.body.status ? req.body.status : undefined;
    if (!targetStatus) {
      return res.status(400).json({ success: false, error: 'status is required in request body' });
    }

    const currentRecord = packagingRepository.getPackagingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Packaging record not found' });
    }

    const transitionCheck = validatePackagingStatusTransition(currentRecord, targetStatus);
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const batch = honeyBatchesRepository.getBatchById(currentRecord.batch_id);
    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Packaging Facility';

    const updatedRecord = packagingRepository.updatePackagingStatusTx(id, targetStatus, farmLocation);
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating packaging status'
    });
  }
});

module.exports = router;
