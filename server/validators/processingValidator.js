const ALLOWED_PROCESSING_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const validateCreateProcessingRecord = (data, { honeyBatchesRepository }) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  // batch_id validation
  if (!data.batch_id || typeof data.batch_id !== 'string' || data.batch_id.trim() === '') {
    errors.push('batch_id is required');
  } else {
    const batch = honeyBatchesRepository.getBatchById(data.batch_id.trim());
    if (!batch) {
      errors.push(`Honey batch '${data.batch_id.trim()}' does not exist`);
    }
  }

  // facility validation
  if (!data.facility || typeof data.facility !== 'string' || data.facility.trim() === '') {
    errors.push('facility is required and must be a non-empty string');
  }

  // processing_date validation
  if (!data.processing_date || typeof data.processing_date !== 'string' || data.processing_date.trim() === '') {
    errors.push('processing_date is required');
  } else {
    const dateObj = new Date(data.processing_date);
    if (isNaN(dateObj.getTime())) {
      errors.push('processing_date must be a valid date string (e.g. YYYY-MM-DD)');
    }
  }

  // method validation
  if (!data.method || typeof data.method !== 'string' || data.method.trim() === '') {
    errors.push('method is required and must be a non-empty string');
  }

  // status validation (optional)
  if (data.status !== undefined && data.status !== null && data.status !== '') {
    const statusUpper = String(data.status).toUpperCase().trim();
    if (!ALLOWED_PROCESSING_STATUSES.includes(statusUpper)) {
      errors.push(`status must be one of: ${ALLOWED_PROCESSING_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUpdateProcessingRecord = (data, { currentRecord }) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  if (currentRecord && String(currentRecord.status).toUpperCase() === 'COMPLETED') {
    return {
      isValid: false,
      errors: ['Cannot modify a COMPLETED processing record'],
      statusCode: 409
    };
  }

  if (data.batch_id !== undefined && data.batch_id !== currentRecord.batch_id) {
    errors.push('Changing batch_id of an existing processing record is not allowed');
  }

  if (data.processing_date !== undefined) {
    if (typeof data.processing_date !== 'string' || data.processing_date.trim() === '') {
      errors.push('processing_date must be a non-empty string');
    } else {
      const dateObj = new Date(data.processing_date);
      if (isNaN(dateObj.getTime())) {
        errors.push('processing_date must be a valid date string');
      }
    }
  }

  if (data.status !== undefined && data.status !== null && data.status !== '') {
    const statusUpper = String(data.status).toUpperCase().trim();
    if (!ALLOWED_PROCESSING_STATUSES.includes(statusUpper)) {
      errors.push(`status must be one of: ${ALLOWED_PROCESSING_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateCreateProcessingRecord,
  validateUpdateProcessingRecord,
  ALLOWED_PROCESSING_STATUSES
};
