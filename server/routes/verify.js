const express = require('express');
const router = express.Router();
const honeyBatchesRepository = require('../repositories/honeyBatchesRepository');
const qualityTestsRepository = require('../repositories/qualityTestsRepository');
const processingRepository = require('../repositories/processingRepository');
const packagingRepository = require('../repositories/packagingRepository');
const transportationRepository = require('../repositories/transportationRepository');
const { verifyBatchChain } = require('../services/blockchainVerifier');
const { createRateLimiter } = require('../middleware/rateLimiter');

const verifyRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: 'Too many public verification requests from this client, please try again after 1 minute.'
});

/**
 * Public Verification API
 * Public, unauthenticated endpoint returning batch provenance, quality analysis, processing, packaging, logistics, SHA-256 demo blockchain audit, and full traceability events timeline.
 */
router.get('/:batchId', verifyRateLimiter, (req, res) => {
  try {
    const batchId = req.params.batchId ? req.params.batchId.trim() : '';

    if (!batchId) {
      return res.status(404).json({
        success: false,
        error: 'Batch ID parameter is required'
      });
    }

    const batch = honeyBatchesRepository.getBatchById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        error: `Honey batch '${batchId}' not found`
      });
    }

    const currentStatus = String(batch.status || '').toUpperCase().trim();
    const verifiedStatuses = ['PACKAGED', 'IN_TRANSIT', 'DELIVERED'];
    const isPubliclyVerifiable = verifiedStatuses.includes(currentStatus) || String(batch.packaging_status).toUpperCase() === 'COMPLETED';

    if (!isPubliclyVerifiable) {
      return res.status(200).json({
        success: true,
        verified: false,
        verification_status: 'NOT AVAILABLE FOR PUBLIC VERIFICATION',
        message: `This honey batch is currently in '${batch.status}' status and is not yet available for public verification. Public verification requires batch status to reach PACKAGED or DELIVERED.`,
        batch_id: batch.batch_id,
        current_stage: batch.status
      });
    }

    // Scoped public farm summary (no internal DB primary keys or credentials)
    const farmSummary = batch.farm ? {
      name: batch.farm.name,
      farmer_name: batch.farm.farmer_name,
      location: batch.farm.location,
      village: batch.farm.village,
      district: batch.farm.district,
      state: batch.farm.state,
      country: batch.farm.country,
      lat: batch.farm.lat,
      lng: batch.farm.lng
    } : null;

    // Quality tests summary (tagged DEMO_QUALITY_RESULT)
    const tests = qualityTestsRepository.getQualityTestsByBatchId(batchId);
    const latestTest = tests && tests.length > 0 ? tests[0] : null;
    const qualitySummary = latestTest ? {
      quality_grade: latestTest.quality_grade || batch.quality_grade,
      purity_pct: latestTest.purity_pct !== undefined ? latestTest.purity_pct : batch.purity_pct,
      moisture_pct: latestTest.moisture_pct !== undefined ? latestTest.moisture_pct : batch.moisture_pct,
      adulteration_check: latestTest.adulteration_check,
      test_date: latestTest.test_date,
      status: latestTest.status,
      data_source: 'DEMO_QUALITY_RESULT'
    } : {
      quality_grade: batch.quality_grade,
      purity_pct: batch.purity_pct,
      moisture_pct: batch.moisture_pct,
      status: batch.quality_status,
      data_source: 'DEMO_QUALITY_RESULT'
    };

    // Processing summary
    const procRecords = processingRepository.getProcessingRecordsByBatchId(batchId);
    const completedProc = procRecords.find(r => String(r.status).toUpperCase() === 'COMPLETED') || procRecords[0];
    const processingSummary = completedProc ? {
      facility: completedProc.facility,
      processing_date: completedProc.processing_date,
      method: completedProc.method,
      status: completedProc.status,
      processor: completedProc.processor
    } : null;

    // Packaging summary
    const packRecords = packagingRepository.getPackagingRecordsByBatchId(batchId);
    const completedPack = packRecords.find(r => String(r.status).toUpperCase() === 'COMPLETED') || packRecords[0];
    const packagingSummary = completedPack ? {
      facility: completedPack.facility,
      packaging_date: completedPack.packaging_date,
      package_type: completedPack.package_type,
      package_size: completedPack.package_size,
      bottle_count: completedPack.bottle_count,
      status: completedPack.status
    } : null;

    // Transportation summary
    const transRecords = transportationRepository.getTransportRecordsByBatchId(batchId);
    const latestTrans = transRecords && transRecords.length > 0 ? transRecords[0] : null;
    const transportationSummary = latestTrans ? {
      transporter_name: latestTrans.transporter_name,
      pickup_date: latestTrans.pickup_date,
      pickup_loc: latestTrans.pickup_loc,
      destination_loc: latestTrans.destination_loc,
      delivery_date: latestTrans.delivery_date,
      status: latestTrans.status,
      confirmation_code: latestTrans.confirmation_code
    } : null;

    // SHA-256 Demo Blockchain Verification (Requirement 6: clearly labeled DEMO BLOCKCHAIN VERIFIED or FAILED)
    const chainVerification = verifyBatchChain(batchId);
    const blockchainSummary = {
      verification_status: chainVerification.status,
      verified: chainVerification.verified,
      message: chainVerification.message,
      latest_tx_hash: batch.blockchain_tx_id || (chainVerification.blocks.length > 0 ? chainVerification.blocks[chainVerification.blocks.length - 1].current_hash : null),
      block_count: chainVerification.block_count,
      blocks: chainVerification.blocks
    };

    // Format public traceability events timeline
    const traceabilityTimeline = (batch.traceability_events || []).map(evt => {
      let parsedDetails = evt.details;
      if (typeof evt.details === 'string') {
        try {
          parsedDetails = JSON.parse(evt.details);
        } catch (e) {
          parsedDetails = evt.details;
        }
      }
      return {
        event_type: evt.event_type,
        timestamp: evt.timestamp,
        location: evt.location,
        actor: evt.actor,
        details: parsedDetails
      };
    });

    return res.status(200).json({
      success: true,
      verified: true,
      verification_status: 'VERIFIED HONEY BATCH',
      data: {
        batch_id: batch.batch_id,
        honey_type: batch.honey_type,
        quantity: batch.quantity,
        unit: batch.unit,
        harvest_date: batch.harvest_date,
        status: batch.status,
        current_location: batch.current_location,
        qr_code_url: batch.qr_code_url,
        blockchain_tx_id: batch.blockchain_tx_id,
        farm: farmSummary,
        quality_summary: qualitySummary,
        processing_summary: processingSummary,
        packaging_summary: packagingSummary,
        transportation_summary: transportationSummary,
        blockchain_summary: blockchainSummary,
        traceability_timeline: traceabilityTimeline
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred during public verification'
    });
  }
});

module.exports = router;
