/**
 * Batch Status Transition Service
 * Manages atomic and valid transitions between honey_batches.status, quality_status, processing_status, packaging_status, and transport_status.
 */

const validateTestCreationTransition = (batch) => {
  if (!batch) {
    return { canTransition: false, reason: 'Batch not found', statusCode: 404 };
  }

  const validStartStatuses = ['HARVESTED', 'QUALITY_TESTING'];
  const currentStatus = String(batch.status || '').toUpperCase().trim();

  if (!validStartStatuses.includes(currentStatus)) {
    return {
      canTransition: false,
      reason: `Cannot start quality test: Batch ${batch.batch_id} is in status '${batch.status}' (must be HARVESTED or QUALITY_TESTING).`,
      statusCode: 409
    };
  }

  return { canTransition: true };
};

const validateApproveTransition = (qualityTest, batch) => {
  if (!qualityTest) {
    return { canTransition: false, reason: 'Quality test not found', statusCode: 404 };
  }

  const testStatus = String(qualityTest.status || '').toUpperCase().trim();
  if (testStatus !== 'PENDING') {
    return {
      canTransition: false,
      reason: `Cannot approve test ${qualityTest.id}: Test is already in status '${qualityTest.status}' (must be PENDING).`,
      statusCode: 409
    };
  }

  if (!batch) {
    return { canTransition: false, reason: 'Referenced batch not found', statusCode: 404 };
  }

  return { canTransition: true };
};

const validateRejectTransition = (qualityTest, batch) => {
  if (!qualityTest) {
    return { canTransition: false, reason: 'Quality test not found', statusCode: 404 };
  }

  const testStatus = String(qualityTest.status || '').toUpperCase().trim();
  if (testStatus !== 'PENDING') {
    return {
      canTransition: false,
      reason: `Cannot reject test ${qualityTest.id}: Test is already in status '${qualityTest.status}' (must be PENDING).`,
      statusCode: 409
    };
  }

  if (!batch) {
    return { canTransition: false, reason: 'Referenced batch not found', statusCode: 404 };
  }

  return { canTransition: true };
};

// --- PHASE 7: PROCESSING & PACKAGING TRANSITIONS ---

const validateProcessingCreationTransition = (batch, activeProcessingRecord) => {
  if (!batch) {
    return { canTransition: false, reason: 'Batch not found', statusCode: 404 };
  }

  const currentStatus = String(batch.status || '').toUpperCase().trim();
  const qualityStatus = String(batch.quality_status || '').toUpperCase().trim();

  if (!['QUALITY_TESTED', 'QUALITY_APPROVED'].includes(currentStatus) && qualityStatus !== 'APPROVED') {
    return {
      canTransition: false,
      reason: `Batch ${batch.batch_id} is in status '${batch.status}' (quality_status: '${batch.quality_status}'). A batch is eligible for processing ONLY if quality_status is APPROVED.`,
      statusCode: 409
    };
  }

  if (activeProcessingRecord && String(activeProcessingRecord.status).toUpperCase() !== 'COMPLETED') {
    return {
      canTransition: false,
      reason: `Batch ${batch.batch_id} already has an active processing record (ID ${activeProcessingRecord.id}, status '${activeProcessingRecord.status}').`,
      statusCode: 409
    };
  }

  return { canTransition: true };
};

const validateProcessingStatusTransition = (currentRecord, newStatus) => {
  if (!currentRecord) {
    return { canTransition: false, reason: 'Processing record not found', statusCode: 404 };
  }

  const curStatus = String(currentRecord.status || '').toUpperCase().trim();
  const targetStatus = String(newStatus || '').toUpperCase().trim();

  if (curStatus === 'COMPLETED') {
    return {
      canTransition: false,
      reason: `Cannot modify status of processing record ${currentRecord.id}: Record is already COMPLETED.`,
      statusCode: 409
    };
  }

  if (!['IN_PROGRESS', 'COMPLETED'].includes(targetStatus)) {
    return {
      canTransition: false,
      reason: `Invalid processing target status '${newStatus}'. Must be IN_PROGRESS or COMPLETED.`,
      statusCode: 400
    };
  }

  if (curStatus === 'IN_PROGRESS' && targetStatus === 'PENDING') {
    return {
      canTransition: false,
      reason: `Backward status transition from '${currentRecord.status}' to '${newStatus}' is not allowed.`,
      statusCode: 409
    };
  }

  return { canTransition: true };
};

const validatePackagingCreationTransition = (batch, activePackagingRecord) => {
  if (!batch) {
    return { canTransition: false, reason: 'Batch not found', statusCode: 404 };
  }

  const currentStatus = String(batch.status || '').toUpperCase().trim();
  const processingStatus = String(batch.processing_status || '').toUpperCase().trim();

  if (processingStatus !== 'COMPLETED' || (currentStatus !== 'PROCESSED' && currentStatus !== 'PACKAGING')) {
    return {
      canTransition: false,
      reason: `Batch ${batch.batch_id} is in status '${batch.status}' (processing_status: '${batch.processing_status}'). A batch is eligible for packaging ONLY if processing_status is COMPLETED.`,
      statusCode: 409
    };
  }

  if (activePackagingRecord && String(activePackagingRecord.status).toUpperCase() !== 'COMPLETED') {
    return {
      canTransition: false,
      reason: `Batch ${batch.batch_id} already has an active packaging record (ID ${activePackagingRecord.id}, status '${activePackagingRecord.status}').`,
      statusCode: 409
    };
  }

  return { canTransition: true };
};

const validatePackagingStatusTransition = (currentRecord, newStatus) => {
  if (!currentRecord) {
    return { canTransition: false, reason: 'Packaging record not found', statusCode: 404 };
  }

  const curStatus = String(currentRecord.status || '').toUpperCase().trim();
  const targetStatus = String(newStatus || '').toUpperCase().trim();

  if (curStatus === 'COMPLETED') {
    return {
      canTransition: false,
      reason: `Cannot modify status of packaging record ${currentRecord.id}: Record is already COMPLETED.`,
      statusCode: 409
    };
  }

  if (!['IN_PROGRESS', 'COMPLETED'].includes(targetStatus)) {
    return {
      canTransition: false,
      reason: `Invalid packaging target status '${newStatus}'. Must be IN_PROGRESS or COMPLETED.`,
      statusCode: 400
    };
  }

  if (curStatus === 'IN_PROGRESS' && targetStatus === 'PENDING') {
    return {
      canTransition: false,
      reason: `Backward status transition from '${currentRecord.status}' to '${newStatus}' is not allowed.`,
      statusCode: 409
    };
  }

  return { canTransition: true };
};

// --- PHASE 8: TRANSPORTATION TRANSITIONS ---

const validateTransportCreationTransition = (batch, activeTransportRecord) => {
  if (!batch) {
    return { canTransition: false, reason: 'Batch not found', statusCode: 404 };
  }

  const currentStatus = String(batch.status || '').toUpperCase().trim();
  const packagingStatus = String(batch.packaging_status || '').toUpperCase().trim();

  if (currentStatus !== 'PACKAGED' && packagingStatus !== 'COMPLETED') {
    return {
      canTransition: false,
      reason: `Batch ${batch.batch_id} is in status '${batch.status}' (packaging_status: '${batch.packaging_status}'). A batch is eligible for transportation ONLY if status is PACKAGED (packaging_status is COMPLETED).`,
      statusCode: 409
    };
  }

  if (activeTransportRecord && String(activeTransportRecord.status).toUpperCase() !== 'DELIVERED') {
    return {
      canTransition: false,
      reason: `Batch ${batch.batch_id} already has an active transportation record (ID ${activeTransportRecord.id}, status '${activeTransportRecord.status}').`,
      statusCode: 409
    };
  }

  return { canTransition: true };
};

const validateTransportStatusTransition = (currentRecord, newStatus, bodyData = {}) => {
  if (!currentRecord) {
    return { canTransition: false, reason: 'Transportation record not found', statusCode: 404 };
  }

  const curStatus = String(currentRecord.status || '').toUpperCase().trim();
  const targetStatus = String(newStatus || '').toUpperCase().trim();

  if (curStatus === 'DELIVERED') {
    return {
      canTransition: false,
      reason: `Cannot modify status of transportation record ${currentRecord.id}: Record is already DELIVERED.`,
      statusCode: 409
    };
  }

  const validTargets = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];
  if (!validTargets.includes(targetStatus)) {
    return {
      canTransition: false,
      reason: `Invalid transportation target status '${newStatus}'. Must be one of: ${validTargets.join(', ')}.`,
      statusCode: 400
    };
  }

  // Prevent backward transitions
  if ((curStatus === 'IN_TRANSIT' || curStatus === 'PICKED_UP') && targetStatus === 'PENDING') {
    return {
      canTransition: false,
      reason: `Backward status transition from '${currentRecord.status}' to '${newStatus}' is not allowed.`,
      statusCode: 409
    };
  }

  // Validate dates if delivery_date is provided
  const pickupDateStr = bodyData.pickup_date || currentRecord.pickup_date;
  const deliveryDateStr = bodyData.delivery_date;

  if (pickupDateStr && deliveryDateStr) {
    const pDate = new Date(pickupDateStr);
    const dDate = new Date(deliveryDateStr);
    if (!isNaN(pDate.getTime()) && !isNaN(dDate.getTime()) && dDate < pDate) {
      return {
        canTransition: false,
        reason: `delivery_date (${deliveryDateStr}) cannot be earlier than pickup_date (${pickupDateStr}).`,
        statusCode: 400
      };
    }
  }

  return { canTransition: true };
};

module.exports = {
  validateTestCreationTransition,
  validateApproveTransition,
  validateRejectTransition,
  validateProcessingCreationTransition,
  validateProcessingStatusTransition,
  validatePackagingCreationTransition,
  validatePackagingStatusTransition,
  validateTransportCreationTransition,
  validateTransportStatusTransition
};
