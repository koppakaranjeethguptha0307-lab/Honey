const { getDb } = require('../db');
const { recordBlockTx } = require('../services/blockchainEngine');

const generateConfirmationCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CONF-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const getTransportRecordById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM transportation_records WHERE id = ?');
  const record = stmt.get(id);
  return record || null;
};

const getTransportRecordsByBatchId = (batchId) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM transportation_records WHERE batch_id = ? ORDER BY created_at DESC, id DESC');
  return stmt.all(batchId);
};

const getActiveTransportRecordByBatchId = (batchId) => {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM transportation_records WHERE batch_id = ? AND UPPER(status) != 'DELIVERED' ORDER BY id DESC LIMIT 1");
  const record = stmt.get(batchId);
  return record || null;
};

const createTransportRecordTx = (recordData) => {
  const db = getDb();
  const nowIso = new Date().toISOString();
  let status = recordData.status ? String(recordData.status).toUpperCase().trim() : 'PENDING';
  if (status === 'PICKED_UP') status = 'IN_TRANSIT';
  const actor = recordData.transporter_name ? recordData.transporter_name.trim() : 'system';
  const confirmationCode = recordData.confirmation_code || (status === 'DELIVERED' ? generateConfirmationCode() : null);

  const tx = db.transaction(() => {
    // 1. Insert transportation record
    const insertStmt = db.prepare(`
      INSERT INTO transportation_records (
        batch_id, transporter_name, pickup_date, pickup_loc, destination_loc, delivery_date, status, confirmation_code, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertStmt.run(
      recordData.batch_id.trim(),
      recordData.transporter_name.trim(),
      recordData.pickup_date,
      recordData.pickup_loc.trim(),
      recordData.destination_loc.trim(),
      recordData.delivery_date || null,
      status,
      confirmationCode,
      nowIso,
      nowIso
    );

    const recordId = info.lastInsertRowid;

    // 2. Update honey_batches
    if (status === 'IN_TRANSIT') {
      const updateBatchStmt = db.prepare(`
        UPDATE honey_batches
        SET status = 'IN_TRANSIT',
            transport_status = 'IN_TRANSIT',
            current_location = ?,
            updated_at = ?
        WHERE batch_id = ?
      `);
      updateBatchStmt.run(recordData.pickup_loc.trim(), nowIso, recordData.batch_id.trim());

      // Insert TRANSPORT_PICKED_UP traceability event
      const detailsObj = {
        transporter_name: recordData.transporter_name.trim(),
        pickup_loc: recordData.pickup_loc.trim(),
        destination_loc: recordData.destination_loc.trim(),
        pickup_date: recordData.pickup_date
      };

      const insertEventStmt = db.prepare(`
        INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const eventInfo = insertEventStmt.run(
        recordData.batch_id.trim(),
        'TRANSPORT_PICKED_UP',
        nowIso,
        recordData.pickup_loc.trim(),
        actor,
        JSON.stringify(detailsObj)
      );

      // Record SHA-256 demo blockchain block
      recordBlockTx(db, {
        id: eventInfo.lastInsertRowid,
        batch_id: recordData.batch_id.trim(),
        event_type: 'TRANSPORT_PICKED_UP',
        timestamp: nowIso,
        actor,
        details: detailsObj
      });

    } else if (status === 'DELIVERED') {
      const updateBatchStmt = db.prepare(`
        UPDATE honey_batches
        SET status = 'DELIVERED',
            transport_status = 'DELIVERED',
            current_location = ?,
            updated_at = ?
        WHERE batch_id = ?
      `);
      updateBatchStmt.run(recordData.destination_loc.trim(), nowIso, recordData.batch_id.trim());

      // Insert TRANSPORT_DELIVERED traceability event
      const detailsObj = {
        transporter_name: recordData.transporter_name.trim(),
        pickup_loc: recordData.pickup_loc.trim(),
        destination_loc: recordData.destination_loc.trim(),
        delivery_date: recordData.delivery_date || nowIso.split('T')[0],
        confirmation_code: confirmationCode
      };

      const insertEventStmt = db.prepare(`
        INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const eventInfo = insertEventStmt.run(
        recordData.batch_id.trim(),
        'TRANSPORT_DELIVERED',
        nowIso,
        recordData.destination_loc.trim(),
        actor,
        JSON.stringify(detailsObj)
      );

      // Record SHA-256 demo blockchain block
      recordBlockTx(db, {
        id: eventInfo.lastInsertRowid,
        batch_id: recordData.batch_id.trim(),
        event_type: 'TRANSPORT_DELIVERED',
        timestamp: nowIso,
        actor,
        details: detailsObj
      });

    } else {
      // PENDING
      const updateBatchStmt = db.prepare(`
        UPDATE honey_batches
        SET transport_status = 'PENDING',
            current_location = ?,
            updated_at = ?
        WHERE batch_id = ?
      `);
      updateBatchStmt.run(recordData.pickup_loc.trim(), nowIso, recordData.batch_id.trim());
    }

    return recordId;
  });

  const newId = tx();
  return getTransportRecordById(newId);
};

const updateTransportStatusTx = (id, newStatus, extraData = {}) => {
  const db = getDb();
  const nowIso = new Date().toISOString();
  let targetStatus = String(newStatus).toUpperCase().trim();
  if (targetStatus === 'PICKED_UP') targetStatus = 'IN_TRANSIT';

  const currentRecord = getTransportRecordById(id);
  const actor = extraData.transporter_name || currentRecord.transporter_name || 'system';

  const tx = db.transaction(() => {
    if (targetStatus === 'IN_TRANSIT') {
      const updateRecStmt = db.prepare(`
        UPDATE transportation_records
        SET status = 'IN_TRANSIT',
            updated_at = ?
        WHERE id = ?
      `);
      updateRecStmt.run(nowIso, id);

      const updateBatchStmt = db.prepare(`
        UPDATE honey_batches
        SET status = 'IN_TRANSIT',
            transport_status = 'IN_TRANSIT',
            current_location = ?,
            updated_at = ?
        WHERE batch_id = ?
      `);
      updateBatchStmt.run(currentRecord.pickup_loc, nowIso, currentRecord.batch_id);

      // Insert TRANSPORT_PICKED_UP traceability event
      const detailsObj = {
        transporter_name: currentRecord.transporter_name,
        pickup_loc: currentRecord.pickup_loc,
        destination_loc: currentRecord.destination_loc,
        pickup_date: currentRecord.pickup_date
      };

      const insertEventStmt = db.prepare(`
        INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const eventInfo = insertEventStmt.run(
        currentRecord.batch_id,
        'TRANSPORT_PICKED_UP',
        nowIso,
        currentRecord.pickup_loc,
        actor,
        JSON.stringify(detailsObj)
      );

      // Record SHA-256 demo blockchain block
      recordBlockTx(db, {
        id: eventInfo.lastInsertRowid,
        batch_id: currentRecord.batch_id,
        event_type: 'TRANSPORT_PICKED_UP',
        timestamp: nowIso,
        actor,
        details: detailsObj
      });

    } else if (targetStatus === 'DELIVERED') {
      const confirmationCode = extraData.confirmation_code || currentRecord.confirmation_code || generateConfirmationCode();
      const deliveryDate = extraData.delivery_date || currentRecord.delivery_date || nowIso.split('T')[0];

      const updateRecStmt = db.prepare(`
        UPDATE transportation_records
        SET status = 'DELIVERED',
            delivery_date = ?,
            confirmation_code = ?,
            updated_at = ?
        WHERE id = ?
      `);
      updateRecStmt.run(deliveryDate, confirmationCode, nowIso, id);

      const updateBatchStmt = db.prepare(`
        UPDATE honey_batches
        SET status = 'DELIVERED',
            transport_status = 'DELIVERED',
            current_location = ?,
            updated_at = ?
        WHERE batch_id = ?
      `);
      updateBatchStmt.run(currentRecord.destination_loc, nowIso, currentRecord.batch_id);

      // Insert TRANSPORT_DELIVERED traceability event
      const detailsObj = {
        transporter_name: currentRecord.transporter_name,
        pickup_loc: currentRecord.pickup_loc,
        destination_loc: currentRecord.destination_loc,
        delivery_date: deliveryDate,
        confirmation_code: confirmationCode
      };

      const insertEventStmt = db.prepare(`
        INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const eventInfo = insertEventStmt.run(
        currentRecord.batch_id,
        'TRANSPORT_DELIVERED',
        nowIso,
        currentRecord.destination_loc,
        actor,
        JSON.stringify(detailsObj)
      );

      // Record SHA-256 demo blockchain block
      recordBlockTx(db, {
        id: eventInfo.lastInsertRowid,
        batch_id: currentRecord.batch_id,
        event_type: 'TRANSPORT_DELIVERED',
        timestamp: nowIso,
        actor,
        details: detailsObj
      });
    }
  });

  tx();
  return getTransportRecordById(id);
};

const getAllTransportRecords = ({ batch_id, status } = {}) => {
  const db = getDb();
  let query = 'SELECT * FROM transportation_records WHERE 1=1';
  const params = [];

  if (batch_id) {
    query += ' AND LOWER(batch_id) = LOWER(?)';
    params.push(batch_id.trim());
  }

  if (status) {
    query += ' AND UPPER(status) = UPPER(?)';
    params.push(status.trim());
  }

  query += ' ORDER BY created_at DESC, id DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

const updateTransportRecord = (id, updateData) => {
  const db = getDb();
  const allowedFields = [
    'transporter_name',
    'pickup_date',
    'pickup_loc',
    'destination_loc',
    'delivery_date',
    'status',
    'confirmation_code'
  ];

  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      setClauses.push(`${field} = ?`);
      params.push(updateData[field]);
    }
  }

  const nowIso = new Date().toISOString();
  setClauses.push('updated_at = ?');
  params.push(nowIso);

  params.push(id);

  const stmt = db.prepare(`UPDATE transportation_records SET ${setClauses.join(', ')} WHERE id = ?`);
  const result = stmt.run(...params);

  if (result.changes === 0) return null;
  return getTransportRecordById(id);
};

const deleteTransportRecord = (id) => {
  const db = getDb();
  const record = getTransportRecordById(id);
  if (!record) return { deleted: false, reason: 'NOT_FOUND' };

  if (String(record.status).toUpperCase() === 'DELIVERED') {
    return {
      deleted: false,
      reason: 'RECORD_DELIVERED',
      status: record.status
    };
  }

  const stmt = db.prepare('DELETE FROM transportation_records WHERE id = ?');
  const result = stmt.run(id);
  return { deleted: result.changes > 0 };
};

const getTransportStats = () => {
  const db = getDb();

  const totalRow = db.prepare('SELECT COUNT(*) as count FROM transportation_records').get();
  const deliveredRow = db.prepare("SELECT COUNT(*) as count FROM transportation_records WHERE UPPER(status) = 'DELIVERED'").get();

  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM transportation_records
    GROUP BY status
  `).all();

  return {
    total_records: totalRow ? totalRow.count : 0,
    total_delivered: deliveredRow ? deliveredRow.count : 0,
    by_status: statusRows
  };
};

module.exports = {
  getTransportRecordById,
  getTransportRecordsByBatchId,
  getActiveTransportRecordByBatchId,
  createTransportRecordTx,
  updateTransportStatusTx,
  getAllTransportRecords,
  updateTransportRecord,
  deleteTransportRecord,
  getTransportStats,
  generateConfirmationCode
};
