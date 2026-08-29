const ALLOWED_STATUSES = ['active', 'inactive', 'under_maintenance', 'collapsed', 'migrated'];

const validateCreateHive = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  // farm_id validation (required)
  if (data.farm_id === undefined || data.farm_id === null || data.farm_id === '') {
    errors.push('farm_id is required');
  } else {
    const farmIdNum = Number(data.farm_id);
    if (!Number.isInteger(farmIdNum) || farmIdNum <= 0) {
      errors.push('farm_id must be a positive integer');
    }
  }

  // type validation (required)
  if (!data.type || typeof data.type !== 'string' || data.type.trim() === '') {
    errors.push('Hive type is required and must be a non-empty string');
  }

  // status validation (optional)
  if (data.status !== undefined && data.status !== null && data.status !== '') {
    if (typeof data.status !== 'string' || !ALLOWED_STATUSES.includes(data.status.toLowerCase().trim())) {
      errors.push(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUpdateHive = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  // farm_id validation (if provided)
  if (data.farm_id !== undefined && data.farm_id !== null && data.farm_id !== '') {
    const farmIdNum = Number(data.farm_id);
    if (!Number.isInteger(farmIdNum) || farmIdNum <= 0) {
      errors.push('farm_id must be a positive integer');
    }
  }

  // type validation (if provided)
  if (data.type !== undefined) {
    if (typeof data.type !== 'string' || data.type.trim() === '') {
      errors.push('Hive type must be a non-empty string');
    }
  }

  // status validation (if provided)
  if (data.status !== undefined && data.status !== null && data.status !== '') {
    if (typeof data.status !== 'string' || !ALLOWED_STATUSES.includes(data.status.toLowerCase().trim())) {
      errors.push(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateCreateHive,
  validateUpdateHive,
  ALLOWED_STATUSES
};
