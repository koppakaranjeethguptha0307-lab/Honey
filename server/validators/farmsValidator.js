const validateCreateFarm = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  // Name validation (required)
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Farm name is required and must be a non-empty string');
  }

  // Lat validation (optional, -90 to 90)
  if (data.lat !== undefined && data.lat !== null && data.lat !== '') {
    const latNum = Number(data.lat);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.push('Latitude must be a valid number between -90 and 90');
    }
  }

  // Lng validation (optional, -180 to 180)
  if (data.lng !== undefined && data.lng !== null && data.lng !== '') {
    const lngNum = Number(data.lng);
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.push('Longitude must be a valid number between -180 and 180');
    }
  }

  // hives_count validation (optional, non-negative integer)
  if (data.hives_count !== undefined && data.hives_count !== null && data.hives_count !== '') {
    const count = Number(data.hives_count);
    if (!Number.isInteger(count) || count < 0) {
      errors.push('Hives count must be a non-negative integer');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUpdateFarm = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  // Name validation (if provided)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim() === '') {
      errors.push('Farm name must be a non-empty string');
    }
  }

  // Lat validation
  if (data.lat !== undefined && data.lat !== null && data.lat !== '') {
    const latNum = Number(data.lat);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.push('Latitude must be a valid number between -90 and 90');
    }
  }

  // Lng validation
  if (data.lng !== undefined && data.lng !== null && data.lng !== '') {
    const lngNum = Number(data.lng);
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      errors.push('Longitude must be a valid number between -180 and 180');
    }
  }

  // hives_count validation
  if (data.hives_count !== undefined && data.hives_count !== null && data.hives_count !== '') {
    const count = Number(data.hives_count);
    if (!Number.isInteger(count) || count < 0) {
      errors.push('Hives count must be a non-negative integer');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateCreateFarm,
  validateUpdateFarm
};
