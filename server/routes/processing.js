const express = require('express');
const router = express.Router();
const processingRepository = require('../repositories/processingRepository');
const honeyBatchesRepository = require('../repositories/honeyBatchesRepository');
const {
  validateProcessingCreationTransition,
  validateProcessingStatusTransition
} = require('../services/batchStatusService');
const {
  validateCreateProcessingRecord,
  validateUpdateProcessingRecord
} = require('../validators/processingValidator');
const { authorizeRole } = require('../middleware/authMiddleware');

// POST /api/processing-records - Create a new processing record (Protected: admin)
router.post('/', authorizeRole(['admin']), (req, res) => {
  try {
    const validation = validateCreateProcessingRecord(req.body, { honeyBatchesRepository });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const batchId = req.body.batch_id.trim();
    const batch = honeyBatchesRepository.getBatchById(batchId);
    const activeProc = processingRepository.getActiveProcessingRecordByBatchId(batchId);

    const transitionCheck = validateProcessingCreationTransition(batch, activeProc);
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Processing Facility';
    const createdRecord = processingRepository.createProcessingRecordTx(req.body, farmLocation);

    return res.status(201).json({
      success: true,
      data: createdRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while creating processing record'
    });
  }
});

// GET /api/processing-records - List processing records (support ?batch_id=&status=)
router.get('/', (req, res) => {
  try {
    const { batch_id, status } = req.query;
    const records = processingRepository.getAllProcessingRecords({ batch_id, status });
    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching processing records'
    });
  }
});

// GET /api/processing-records/stats - Processing statistics
// Registered BEFORE /:id to prevent route collision
router.get('/stats', (req, res) => {
  try {
    const stats = processingRepository.getProcessingStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching processing statistics'
    });
  }
});

// GET /api/processing-records/:id - Get single processing record
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid processing record ID' });
    }

    const record = processingRepository.getProcessingRecordById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Processing record not found' });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching processing record'
    });
  }
});

// PUT /api/processing-records/:id - Partial update (Protected: admin)
router.put('/:id', authorizeRole(['admin']), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid processing record ID' });
    }

    const currentRecord = processingRepository.getProcessingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Processing record not found' });
    }

    const validation = validateUpdateProcessingRecord(req.body, { currentRecord });
    if (!validation.isValid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const updatedRecord = processingRepository.updateProcessingRecord(id, req.body);
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating processing record'
    });
  }
});

// DELETE /api/processing-records/:id - Delete record (Protected: admin)
router.delete('/:id', authorizeRole(['admin']), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid processing record ID' });
    }

    const currentRecord = processingRepository.getProcessingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Processing record not found' });
    }

    const result = processingRepository.deleteProcessingRecord(id);
    if (!result.deleted && result.reason === 'RECORD_COMPLETED') {
      return res.status(409).json({
        success: false,
        error: `Cannot delete processing record ${id}: Record is COMPLETED and has driven batch state transitions.`
      });
    }

    return res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while deleting processing record'
    });
  }
});

// PATCH /api/processing-records/:id/start - Move status to IN_PROGRESS (Protected: admin)
router.patch('/:id/start', authorizeRole(['admin']), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid processing record ID' });
    }

    const currentRecord = processingRepository.getProcessingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Processing record not found' });
    }

    const transitionCheck = validateProcessingStatusTransition(currentRecord, 'IN_PROGRESS');
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const batch = honeyBatchesRepository.getBatchById(currentRecord.batch_id);
    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Processing Facility';

    const updatedRecord = processingRepository.updateProcessingStatusTx(id, 'IN_PROGRESS', farmLocation);
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while starting processing'
    });
  }
});

// PATCH /api/processing-records/:id/complete - Move status to COMPLETED (Protected: admin)
router.patch('/:id/complete', authorizeRole(['admin']), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid processing record ID' });
    }

    const currentRecord = processingRepository.getProcessingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Processing record not found' });
    }

    const transitionCheck = validateProcessingStatusTransition(currentRecord, 'COMPLETED');
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const batch = honeyBatchesRepository.getBatchById(currentRecord.batch_id);
    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Processing Facility';

    const updatedRecord = processingRepository.updateProcessingStatusTx(id, 'COMPLETED', farmLocation);
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while completing processing'
    });
  }
});

// PATCH /api/processing-records/:id/status - Generic status update (Protected: admin)
router.patch('/:id/status', authorizeRole(['admin']), (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid processing record ID' });
    }

    const targetStatus = req.body && req.body.status ? req.body.status : undefined;
    if (!targetStatus) {
      return res.status(400).json({ success: false, error: 'status is required in request body' });
    }

    const currentRecord = processingRepository.getProcessingRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Processing record not found' });
    }

    const transitionCheck = validateProcessingStatusTransition(currentRecord, targetStatus);
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const batch = honeyBatchesRepository.getBatchById(currentRecord.batch_id);
    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Processing Facility';

    const updatedRecord = processingRepository.updateProcessingStatusTx(id, targetStatus, farmLocation);
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating processing status'
    });
  }
});

module.exports = router;
