const ALLOWED_HONEY_TYPES = [
  'Raw Honey',
  'Organic Honey',
  'Wildflower Honey',
  'Forest Honey',
  'Multi-floral Honey',
  'Monofloral Honey'
];

const ALLOWED_UNITS = ['kg', 'g', 'litre', 'ml'];

const validateCreateBatch = (data, { farmsRepository, hivesRepository }) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  // farm_id validation
  if (data.farm_id === undefined || data.farm_id === null || data.farm_id === '') {
    errors.push('farm_id is required');
  } else {
    const farmIdNum = Number(data.farm_id);
    if (!Number.isInteger(farmIdNum) || farmIdNum <= 0) {
      errors.push('farm_id must be a positive integer');
    } else {
      const farm = farmsRepository.getFarmById(farmIdNum);
      if (!farm) {
        errors.push(`Farm with ID ${farmIdNum} does not exist`);
      }
    }
  }

  // hive_id validation
  let hiveObj = null;
  if (data.hive_id === undefined || data.hive_id === null || data.hive_id === '') {
    errors.push('hive_id is required');
  } else {
    const hiveIdNum = Number(data.hive_id);
    if (!Number.isInteger(hiveIdNum) || hiveIdNum <= 0) {
      errors.push('hive_id must be a positive integer');
    } else {
      hiveObj = hivesRepository.getHiveById(hiveIdNum);
      if (!hiveObj) {
        errors.push(`Hive with ID ${hiveIdNum} does not exist`);
      }
    }
  }

  // Relationship check: Hive must belong to specified farm
  if (data.farm_id && hiveObj) {
    if (Number(hiveObj.farm_id) !== Number(data.farm_id)) {
      errors.push('Hive does not belong to the specified farm');
    }
  }

  // harvest_date validation
  if (!data.harvest_date || typeof data.harvest_date !== 'string' || data.harvest_date.trim() === '') {
    errors.push('harvest_date is required');
  } else {
    const dateObj = new Date(data.harvest_date);
    if (isNaN(dateObj.getTime())) {
      errors.push('harvest_date must be a valid date string (e.g. YYYY-MM-DD)');
    }
  }

  // honey_type validation
  if (!data.honey_type || typeof data.honey_type !== 'string' || data.honey_type.trim() === '') {
    errors.push('honey_type is required');
  } else {
    const trimmedType = data.honey_type.trim();
    if (!ALLOWED_HONEY_TYPES.includes(trimmedType)) {
      errors.push(`honey_type must be one of: ${ALLOWED_HONEY_TYPES.join(', ')}`);
    }
  }

  // quantity validation
  if (data.quantity === undefined || data.quantity === null || data.quantity === '') {
    errors.push('quantity is required');
  } else {
    const qtyNum = Number(data.quantity);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      errors.push('quantity must be a positive number (> 0)');
    }
  }

  // unit validation
  if (data.unit !== undefined && data.unit !== null && data.unit !== '') {
    if (typeof data.unit !== 'string' || !ALLOWED_UNITS.includes(data.unit.toLowerCase().trim())) {
      errors.push(`unit must be one of: ${ALLOWED_UNITS.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUpdateBatch = (data, { farmsRepository, hivesRepository, currentBatch }) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  const targetFarmId = data.farm_id !== undefined ? Number(data.farm_id) : currentBatch.farm_id;
  const targetHiveId = data.hive_id !== undefined ? Number(data.hive_id) : currentBatch.hive_id;

  let hiveObj = hivesRepository.getHiveById(targetHiveId);
  if (data.hive_id !== undefined) {
    if (!Number.isInteger(targetHiveId) || targetHiveId <= 0) {
      errors.push('hive_id must be a positive integer');
    } else if (!hiveObj) {
      errors.push(`Hive with ID ${targetHiveId} does not exist`);
    }
  }

  if (data.farm_id !== undefined) {
    if (!Number.isInteger(targetFarmId) || targetFarmId <= 0) {
      errors.push('farm_id must be a positive integer');
    } else {
      const farm = farmsRepository.getFarmById(targetFarmId);
      if (!farm) {
        errors.push(`Farm with ID ${targetFarmId} does not exist`);
      }
    }
  }

  if (hiveObj && (data.farm_id !== undefined || data.hive_id !== undefined)) {
    if (Number(hiveObj.farm_id) !== Number(targetFarmId)) {
      errors.push('Hive does not belong to the specified farm');
    }
  }

  if (data.harvest_date !== undefined) {
    if (typeof data.harvest_date !== 'string' || data.harvest_date.trim() === '') {
      errors.push('harvest_date must be a non-empty date string');
    } else {
      const dateObj = new Date(data.harvest_date);
      if (isNaN(dateObj.getTime())) {
        errors.push('harvest_date must be a valid date string');
      }
    }
  }

  if (data.honey_type !== undefined) {
    if (typeof data.honey_type !== 'string' || !ALLOWED_HONEY_TYPES.includes(data.honey_type.trim())) {
      errors.push(`honey_type must be one of: ${ALLOWED_HONEY_TYPES.join(', ')}`);
    }
  }

  if (data.quantity !== undefined) {
    const qtyNum = Number(data.quantity);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      errors.push('quantity must be a positive number (> 0)');
    }
  }

  if (data.unit !== undefined && data.unit !== null && data.unit !== '') {
    if (typeof data.unit !== 'string' || !ALLOWED_UNITS.includes(data.unit.toLowerCase().trim())) {
      errors.push(`unit must be one of: ${ALLOWED_UNITS.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateCreateBatch,
  validateUpdateBatch,
  ALLOWED_HONEY_TYPES,
  ALLOWED_UNITS
};
