const ALLOWED_PACKAGING_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

const validateCreatePackagingRecord = (data, { honeyBatchesRepository }) => {
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

  // packaging_date validation
  if (!data.packaging_date || typeof data.packaging_date !== 'string' || data.packaging_date.trim() === '') {
    errors.push('packaging_date is required');
  } else {
    const dateObj = new Date(data.packaging_date);
    if (isNaN(dateObj.getTime())) {
      errors.push('packaging_date must be a valid date string (e.g. YYYY-MM-DD)');
    }
  }

  // facility validation
  if (!data.facility || typeof data.facility !== 'string' || data.facility.trim() === '') {
    errors.push('facility is required and must be a non-empty string');
  }

  // package_type validation
  if (!data.package_type || typeof data.package_type !== 'string' || data.package_type.trim() === '') {
    errors.push('package_type is required and must be a non-empty string');
  }

  // package_size validation
  if (!data.package_size || typeof data.package_size !== 'string' || data.package_size.trim() === '') {
    errors.push('package_size is required and must be a non-empty string');
  }

  // bottle_count validation
  if (data.bottle_count === undefined || data.bottle_count === null || data.bottle_count === '') {
    errors.push('bottle_count is required');
  } else {
    const countNum = Number(data.bottle_count);
    if (!Number.isInteger(countNum) || countNum <= 0) {
      errors.push('bottle_count must be a positive integer (> 0)');
    }
  }

  // status validation (optional)
  if (data.status !== undefined && data.status !== null && data.status !== '') {
    const statusUpper = String(data.status).toUpperCase().trim();
    if (!ALLOWED_PACKAGING_STATUSES.includes(statusUpper)) {
      errors.push(`status must be one of: ${ALLOWED_PACKAGING_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUpdatePackagingRecord = (data, { currentRecord }) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  if (currentRecord && String(currentRecord.status).toUpperCase() === 'COMPLETED') {
    return {
      isValid: false,
      errors: ['Cannot modify a COMPLETED packaging record'],
      statusCode: 409
    };
  }

  if (data.batch_id !== undefined && data.batch_id !== currentRecord.batch_id) {
    errors.push('Changing batch_id of an existing packaging record is not allowed');
  }

  if (data.bottle_count !== undefined) {
    const countNum = Number(data.bottle_count);
    if (!Number.isInteger(countNum) || countNum <= 0) {
      errors.push('bottle_count must be a positive integer (> 0)');
    }
  }

  if (data.packaging_date !== undefined) {
    if (typeof data.packaging_date !== 'string' || data.packaging_date.trim() === '') {
      errors.push('packaging_date must be a non-empty string');
    } else {
      const dateObj = new Date(data.packaging_date);
      if (isNaN(dateObj.getTime())) {
        errors.push('packaging_date must be a valid date string');
      }
    }
  }

  if (data.status !== undefined && data.status !== null && data.status !== '') {
    const statusUpper = String(data.status).toUpperCase().trim();
    if (!ALLOWED_PACKAGING_STATUSES.includes(statusUpper)) {
      errors.push(`status must be one of: ${ALLOWED_PACKAGING_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateCreatePackagingRecord,
  validateUpdatePackagingRecord,
  ALLOWED_PACKAGING_STATUSES
};
