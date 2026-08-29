const express = require('express');
const router = express.Router();
const qualityTestsRepository = require('../repositories/qualityTestsRepository');
const honeyBatchesRepository = require('../repositories/honeyBatchesRepository');
const { assessQuality } = require('../services/qualityAssessmentService');
const {
  validateTestCreationTransition,
  validateApproveTransition,
  validateRejectTransition
} = require('../services/batchStatusService');
const {
  validateCreateQualityTest,
  validateUpdateQualityTest,
  validateRejectAction
} = require('../validators/qualityTestsValidator');

// POST /api/quality-tests - Create a new quality test
router.post('/', (req, res) => {
  try {
    const validation = validateCreateQualityTest(req.body, { honeyBatchesRepository });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const batchId = req.body.batch_id.trim();
    const batch = honeyBatchesRepository.getBatchById(batchId);

    const transitionCheck = validateTestCreationTransition(batch);
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const purity_pct = Number(req.body.purity_pct !== undefined ? req.body.purity_pct : req.body.purity_percentage);
    const moisture_pct = Number(req.body.moisture_pct !== undefined ? req.body.moisture_pct : req.body.moisture_percentage);
    const adulteration_check = req.body.adulteration_check;

    const assessment = assessQuality({ purity_pct, moisture_pct, adulteration_check });

    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Processing Facility';
    const createdTest = qualityTestsRepository.createQualityTestTx(req.body, assessment, farmLocation);

    return res.status(201).json({
      success: true,
      data: {
        ...createdTest,
        recommendation: assessment.recommendation,
        explanation: assessment.explanation,
        data_source: 'DEMO_QUALITY_RESULT'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while creating quality test'
    });
  }
});

// GET /api/quality-tests - List quality tests with optional filters
router.get('/', (req, res) => {
  try {
    const { status, batch_id } = req.query;
    const tests = qualityTestsRepository.getAllQualityTests({ status, batch_id });
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
      error: 'An unexpected error occurred while fetching quality tests'
    });
  }
});

// GET /api/quality-tests/stats - Quality testing statistics
// IMPORTANT: Registered before GET /:id so "stats" is not parsed as test ID
router.get('/stats', (req, res) => {
  try {
    const stats = qualityTestsRepository.getQualityStats();
    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching quality statistics'
    });
  }
});

// GET /api/quality-tests/:id - Detail view of a single quality test
router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quality test ID'
      });
    }

    const test = qualityTestsRepository.getQualityTestById(id);
    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Quality test not found'
      });
    }

    const batch = honeyBatchesRepository.getBatchById(test.batch_id);
    const assessment = assessQuality({
      purity_pct: test.purity_pct,
      moisture_pct: test.moisture_pct,
      adulteration_check: test.adulteration_check
    });

    return res.status(200).json({
      success: true,
      data: {
        ...test,
        recommendation: assessment.recommendation,
        explanation: assessment.explanation,
        data_source: 'DEMO_QUALITY_RESULT',
        batch: batch || null
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while fetching quality test'
    });
  }
});

// PUT /api/quality-tests/:id - Partial update of a quality test
router.put('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quality test ID'
      });
    }

    const currentTest = qualityTestsRepository.getQualityTestById(id);
    if (!currentTest) {
      return res.status(404).json({
        success: false,
        error: 'Quality test not found'
      });
    }

    const validation = validateUpdateQualityTest(req.body, { currentTest });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join('; ')
      });
    }

    const updatedTest = qualityTestsRepository.updateQualityTest(id, req.body);
    return res.status(200).json({
      success: true,
      data: {
        ...updatedTest,
        data_source: 'DEMO_QUALITY_RESULT'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while updating quality test'
    });
  }
});

// DELETE /api/quality-tests/:id - Delete a quality test (blocked if already APPROVED/REJECTED)
router.delete('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quality test ID'
      });
    }

    const currentTest = qualityTestsRepository.getQualityTestById(id);
    if (!currentTest) {
      return res.status(404).json({
        success: false,
        error: 'Quality test not found'
      });
    }

    const result = qualityTestsRepository.deleteQualityTest(id);
    if (!result.deleted && result.reason === 'ALREADY_PROCESSED') {
      return res.status(409).json({
        success: false,
        error: `Cannot delete quality test ${id}: Test status is '${result.status}'. Processed test records cannot be deleted as they have generated batch status transitions and traceability events.`
      });
    }

    return res.status(200).json({
      success: true,
      data: { id }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while deleting quality test'
    });
  }
});

// PATCH /api/quality-tests/:id/approve - Approve a pending quality test
router.patch('/:id/approve', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quality test ID'
      });
    }

    const qualityTest = qualityTestsRepository.getQualityTestById(id);
    if (!qualityTest) {
      return res.status(404).json({
        success: false,
        error: 'Quality test not found'
      });
    }

    const batch = honeyBatchesRepository.getBatchById(qualityTest.batch_id);
    const transitionCheck = validateApproveTransition(qualityTest, batch);
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const remarks = req.body && req.body.remarks ? req.body.remarks : undefined;
    const inspectorName = req.body && req.body.inspector_name ? req.body.inspector_name : undefined;
    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Processing Facility';

    const approvedTest = qualityTestsRepository.approveQualityTestTx(id, batch, remarks, inspectorName, farmLocation);

    return res.status(200).json({
      success: true,
      data: {
        ...approvedTest,
        data_source: 'DEMO_QUALITY_RESULT'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while approving quality test'
    });
  }
});

// PATCH /api/quality-tests/:id/reject - Reject a pending quality test (requires reason/remarks)
router.patch('/:id/reject', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quality test ID'
      });
    }

    const rejectionValidation = validateRejectAction(req.body);
    if (!rejectionValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: rejectionValidation.errors.join('; ')
      });
    }

    const qualityTest = qualityTestsRepository.getQualityTestById(id);
    if (!qualityTest) {
      return res.status(404).json({
        success: false,
        error: 'Quality test not found'
      });
    }

    const batch = honeyBatchesRepository.getBatchById(qualityTest.batch_id);
    const transitionCheck = validateRejectTransition(qualityTest, batch);
    if (!transitionCheck.canTransition) {
      return res.status(transitionCheck.statusCode || 409).json({
        success: false,
        error: transitionCheck.reason
      });
    }

    const reason = req.body.remarks || req.body.reason || req.body.rejection_reason;
    const inspectorName = req.body && req.body.inspector_name ? req.body.inspector_name : undefined;
    const farmLocation = batch && batch.farm ? (batch.farm.location || `${batch.farm.name}, ${batch.farm.district || ''}`) : 'Processing Facility';

    const rejectedTest = qualityTestsRepository.rejectQualityTestTx(id, batch, reason, inspectorName, farmLocation);

    return res.status(200).json({
      success: true,
      data: {
        ...rejectedTest,
        data_source: 'DEMO_QUALITY_RESULT'
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while rejecting quality test'
    });
  }
});

module.exports = router;
