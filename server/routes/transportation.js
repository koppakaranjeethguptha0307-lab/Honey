const express = require('express');
const router = express.Router();
const transportationRepository = require('../repositories/transportationRepository');
const honeyBatchesRepository = require('../repositories/honeyBatchesRepository');
const {
  validateTransportCreationTransition,
  validateTransportStatusTransition
} = require('../services/batchStatusService');
const {
  validateCreateTransportRecord,
  validateUpdateTransportRecord
} = require('../validators/transportationValidator');

// POST /api/transportation-records - Create a new transportation record
router.post('/', (req, res) => {
  try {
    const validation = validateCreateTransportRecord(req.body, { honeyBatchesRepository });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const batchId = req.body.batch_id.trim();
    const batch = honeyBatchesRepository.getBatchById(batchId);
    const activeTrans = transportationRepository.getActiveTransportRecordByBatchId(batchId);

    const transitionCheck = validateTransportCreationTransition(batch, activeTrans);
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const createdRecord = transportationRepository.createTransportRecordTx(req.body);

    return res.status(201).json({
      success: true,
      data: createdRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while creating transportation record'
    });
  }
});

// GET /api/transportation-records - List transportation records (support ?batch_id=&status=)
router.get('/', (req, res) => {
  try {
    const { batch_id, status } = req.query;
    const records = transportationRepository.getAllTransportRecords({ batch_id, status });
    return res.status(200).json({
      success: true,
      data: records
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching transportation records'
    });
  }
});

// GET /api/transportation-records/stats - Transportation statistics
// Registered BEFORE /:id to prevent route collision
router.get('/stats', (req, res) => {
  try {
    const stats = transportationRepository.getTransportStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching transportation statistics'
    });
  }
});

// GET /api/transportation-records/:id - Get single transportation record
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid transportation record ID' });
    }

    const record = transportationRepository.getTransportRecordById(id);
    if (!record) {
      return res.status(404).json({ success: false, error: 'Transportation record not found' });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching transportation record'
    });
  }
});

// PUT /api/transportation-records/:id - Partial update (blocked if DELIVERED)
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid transportation record ID' });
    }

    const currentRecord = transportationRepository.getTransportRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Transportation record not found' });
    }

    const validation = validateUpdateTransportRecord(req.body, { currentRecord });
    if (!validation.isValid) {
      return res.status(validation.statusCode || 400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const updatedRecord = transportationRepository.updateTransportRecord(id, req.body);
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating transportation record'
    });
  }
});

// DELETE /api/transportation-records/:id - Delete record (blocked with 409 if DELIVERED)
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid transportation record ID' });
    }

    const currentRecord = transportationRepository.getTransportRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Transportation record not found' });
    }

    const result = transportationRepository.deleteTransportRecord(id);
    if (!result.deleted && result.reason === 'RECORD_DELIVERED') {
      return res.status(409).json({
        success: false,
        error: `Cannot delete transportation record ${id}: Record is DELIVERED and has driven batch state transitions.`
      });
    }

    return res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while deleting transportation record'
    });
  }
});

// PATCH /api/transportation-records/:id/pickup - Mark picked up / in transit
router.patch('/:id/pickup', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid transportation record ID' });
    }

    const currentRecord = transportationRepository.getTransportRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Transportation record not found' });
    }

    const transitionCheck = validateTransportStatusTransition(currentRecord, 'IN_TRANSIT', req.body || {});
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const updatedRecord = transportationRepository.updateTransportStatusTx(id, 'IN_TRANSIT', req.body || {});
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while starting transportation'
    });
  }
});

// PATCH /api/transportation-records/:id/deliver - Mark delivered
router.patch('/:id/deliver', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid transportation record ID' });
    }

    const currentRecord = transportationRepository.getTransportRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Transportation record not found' });
    }

    const transitionCheck = validateTransportStatusTransition(currentRecord, 'DELIVERED', req.body || {});
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const updatedRecord = transportationRepository.updateTransportStatusTx(id, 'DELIVERED', req.body || {});
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while delivering transportation'
    });
  }
});

// PATCH /api/transportation-records/:id/status - Generic status update
router.patch('/:id/status', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid transportation record ID' });
    }

    const targetStatus = req.body && req.body.status ? req.body.status : undefined;
    if (!targetStatus) {
      return res.status(400).json({ success: false, error: 'status is required in request body' });
    }

    const currentRecord = transportationRepository.getTransportRecordById(id);
    if (!currentRecord) {
      return res.status(404).json({ success: false, error: 'Transportation record not found' });
    }

    const transitionCheck = validateTransportStatusTransition(currentRecord, targetStatus, req.body || {});
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const updatedRecord = transportationRepository.updateTransportStatusTx(id, targetStatus, req.body || {});
    return res.status(200).json({
      success: true,
      data: updatedRecord
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating transportation status'
    });
  }
});

module.exports = router;
