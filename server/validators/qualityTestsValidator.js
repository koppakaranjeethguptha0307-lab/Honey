const ALLOWED_ADULTERATION_STATUSES = ['PENDING', 'PASSED', 'FAILED'];

const validateCreateQualityTest = (data, { honeyBatchesRepository }) => {
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

  // purity_pct (accept purity_pct or purity_percentage)
  const purityVal = data.purity_pct !== undefined ? data.purity_pct : data.purity_percentage;
  if (purityVal === undefined || purityVal === null || purityVal === '') {
    errors.push('purity_pct is required');
  } else {
    const purityNum = Number(purityVal);
    if (!Number.isFinite(purityNum) || purityNum < 0 || purityNum > 100) {
      errors.push('purity_pct must be a valid number between 0 and 100');
    }
  }

  // moisture_pct (accept moisture_pct or moisture_percentage)
  const moistureVal = data.moisture_pct !== undefined ? data.moisture_pct : data.moisture_percentage;
  if (moistureVal === undefined || moistureVal === null || moistureVal === '') {
    errors.push('moisture_pct is required');
  } else {
    const moistureNum = Number(moistureVal);
    if (!Number.isFinite(moistureNum) || moistureNum < 0 || moistureNum > 100) {
      errors.push('moisture_pct must be a valid number between 0 and 100');
    }
  }

  // test_date validation
  if (!data.test_date || typeof data.test_date !== 'string' || data.test_date.trim() === '') {
    errors.push('test_date is required');
  } else {
    const dateObj = new Date(data.test_date);
    if (isNaN(dateObj.getTime())) {
      errors.push('test_date must be a valid date string');
    }
  }

  // adulteration_check validation
  if (!data.adulteration_check || typeof data.adulteration_check !== 'string' || data.adulteration_check.trim() === '') {
    errors.push('adulteration_check is required');
  } else {
    const adultUpper = data.adulteration_check.toUpperCase().trim();
    if (!ALLOWED_ADULTERATION_STATUSES.includes(adultUpper)) {
      errors.push(`adulteration_check must be one of: ${ALLOWED_ADULTERATION_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUpdateQualityTest = (data, { currentTest }) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  if (data.batch_id !== undefined && data.batch_id !== currentTest.batch_id) {
    errors.push('Changing batch_id of an existing quality test is not allowed');
  }

  const purityVal = data.purity_pct !== undefined ? data.purity_pct : data.purity_percentage;
  if (purityVal !== undefined && purityVal !== null && purityVal !== '') {
    const purityNum = Number(purityVal);
    if (!Number.isFinite(purityNum) || purityNum < 0 || purityNum > 100) {
      errors.push('purity_pct must be a valid number between 0 and 100');
    }
  }

  const moistureVal = data.moisture_pct !== undefined ? data.moisture_pct : data.moisture_percentage;
  if (moistureVal !== undefined && moistureVal !== null && moistureVal !== '') {
    const moistureNum = Number(moistureVal);
    if (!Number.isFinite(moistureNum) || moistureNum < 0 || moistureNum > 100) {
      errors.push('moisture_pct must be a valid number between 0 and 100');
    }
  }

  if (data.test_date !== undefined) {
    if (typeof data.test_date !== 'string' || data.test_date.trim() === '') {
      errors.push('test_date must be a non-empty string');
    } else {
      const dateObj = new Date(data.test_date);
      if (isNaN(dateObj.getTime())) {
        errors.push('test_date must be a valid date string');
      }
    }
  }

  if (data.adulteration_check !== undefined && data.adulteration_check !== null && data.adulteration_check !== '') {
    const adultUpper = data.adulteration_check.toUpperCase().trim();
    if (!ALLOWED_ADULTERATION_STATUSES.includes(adultUpper)) {
      errors.push(`adulteration_check must be one of: ${ALLOWED_ADULTERATION_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateRejectAction = (data) => {
  const errors = [];
  const remarksText = data && (data.remarks || data.reason || data.rejection_reason);

  if (!remarksText || typeof remarksText !== 'string' || remarksText.trim() === '') {
    errors.push('Rejection reason/remarks is required when rejecting a quality test');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateCreateQualityTest,
  validateUpdateQualityTest,
  validateRejectAction,
  ALLOWED_ADULTERATION_STATUSES
};
