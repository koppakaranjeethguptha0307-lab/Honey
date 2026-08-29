const ALLOWED_TRANSPORT_STATUSES = ['PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

const validateCreateTransportRecord = (data, { honeyBatchesRepository }) => {
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

  // transporter_name validation
  if (!data.transporter_name || typeof data.transporter_name !== 'string' || data.transporter_name.trim() === '') {
    errors.push('transporter_name is required and must be a non-empty string');
  }

  // pickup_date validation
  let pickupDateObj = null;
  if (!data.pickup_date || typeof data.pickup_date !== 'string' || data.pickup_date.trim() === '') {
    errors.push('pickup_date is required');
  } else {
    pickupDateObj = new Date(data.pickup_date);
    if (isNaN(pickupDateObj.getTime())) {
      errors.push('pickup_date must be a valid date string (e.g. YYYY-MM-DD)');
    }
  }

  // pickup_loc validation
  if (!data.pickup_loc || typeof data.pickup_loc !== 'string' || data.pickup_loc.trim() === '') {
    errors.push('pickup_loc is required and must be a non-empty string');
  }

  // destination_loc validation
  if (!data.destination_loc || typeof data.destination_loc !== 'string' || data.destination_loc.trim() === '') {
    errors.push('destination_loc is required and must be a non-empty string');
  }

  // delivery_date validation (optional on creation)
  if (data.delivery_date !== undefined && data.delivery_date !== null && data.delivery_date !== '') {
    if (typeof data.delivery_date !== 'string') {
      errors.push('delivery_date must be a string');
    } else {
      const deliveryDateObj = new Date(data.delivery_date);
      if (isNaN(deliveryDateObj.getTime())) {
        errors.push('delivery_date must be a valid date string');
      } else if (pickupDateObj && !isNaN(pickupDateObj.getTime()) && deliveryDateObj < pickupDateObj) {
        errors.push(`delivery_date (${data.delivery_date}) cannot be earlier than pickup_date (${data.pickup_date})`);
      }
    }
  }

  // status validation (optional)
  if (data.status !== undefined && data.status !== null && data.status !== '') {
    const statusUpper = String(data.status).toUpperCase().trim();
    if (!ALLOWED_TRANSPORT_STATUSES.includes(statusUpper)) {
      errors.push(`status must be one of: ${ALLOWED_TRANSPORT_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateUpdateTransportRecord = (data, { currentRecord }) => {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Request body must be a JSON object'] };
  }

  if (currentRecord && String(currentRecord.status).toUpperCase() === 'DELIVERED') {
    return {
      isValid: false,
      errors: ['Cannot modify a DELIVERED transportation record'],
      statusCode: 409
    };
  }

  if (data.batch_id !== undefined && data.batch_id !== currentRecord.batch_id) {
    errors.push('Changing batch_id of an existing transportation record is not allowed');
  }

  const pickupStr = data.pickup_date !== undefined ? data.pickup_date : currentRecord.pickup_date;
  const deliveryStr = data.delivery_date !== undefined ? data.delivery_date : currentRecord.delivery_date;

  if (pickupStr && deliveryStr) {
    const pDate = new Date(pickupStr);
    const dDate = new Date(deliveryStr);
    if (!isNaN(pDate.getTime()) && !isNaN(dDate.getTime()) && dDate < pDate) {
      errors.push(`delivery_date (${deliveryStr}) cannot be earlier than pickup_date (${pickupStr})`);
    }
  }

  if (data.status !== undefined && data.status !== null && data.status !== '') {
    const statusUpper = String(data.status).toUpperCase().trim();
    if (!ALLOWED_TRANSPORT_STATUSES.includes(statusUpper)) {
      errors.push(`status must be one of: ${ALLOWED_TRANSPORT_STATUSES.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateCreateTransportRecord,
  validateUpdateTransportRecord,
  ALLOWED_TRANSPORT_STATUSES
};
