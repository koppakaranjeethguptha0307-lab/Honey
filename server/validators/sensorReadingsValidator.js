const automationConfig = require('../config/automationConfig');

const validateSensorReading = (data) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  // temperature validation
  if (data.temp === undefined || data.temp === null || data.temp === '') {
    errors.push('temp (temperature) is required');
  } else {
    const tempNum = Number(data.temp);
    if (!Number.isFinite(tempNum)) {
      errors.push('temp must be a valid finite number');
    }
  }

  // humidity validation
  if (data.humidity === undefined || data.humidity === null || data.humidity === '') {
    errors.push('humidity is required');
  } else {
    const humNum = Number(data.humidity);
    if (!Number.isFinite(humNum) || humNum < 0) {
      errors.push('humidity must be a valid finite number >= 0');
    }
  }

  // weight validation
  if (data.weight === undefined || data.weight === null || data.weight === '') {
    errors.push('weight is required');
  } else {
    const weightNum = Number(data.weight);
    if (!Number.isFinite(weightNum) || weightNum < 0) {
      errors.push('weight must be a valid finite number >= 0');
    }
  }

  // activity validation
  if (!data.activity || typeof data.activity !== 'string') {
    errors.push('activity is required and must be a string');
  } else {
    const actUpper = data.activity.toUpperCase().trim();
    if (!automationConfig.activityLevels.includes(actUpper)) {
      errors.push(`activity must be one of: ${automationConfig.activityLevels.join(', ')}`);
    }
  }

  // timestamp validation (optional)
  if (data.timestamp !== undefined && data.timestamp !== null && data.timestamp !== '') {
    const dateObj = new Date(data.timestamp);
    if (isNaN(dateObj.getTime())) {
      errors.push('timestamp must be a valid ISO date string');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateSensorReading
};
