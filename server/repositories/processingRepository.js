const { getDb } = require('../db');
const { recordBlockTx } = require('../services/blockchainEngine');

const getProcessingRecordById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM processing_records WHERE id = ?');
  const record = stmt.get(id);
  return record || null;
};

const getProcessingRecordsByBatchId = (batchId) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM processing_records WHERE batch_id = ? ORDER BY created_at DESC, id DESC');
  return stmt.all(batchId);
};

const getActiveProcessingRecordByBatchId = (batchId) => {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM processing_records WHERE batch_id = ? AND UPPER(status) != 'COMPLETED' ORDER BY id DESC LIMIT 1");
  const record = stmt.get(batchId);
  return record || null;
};

const createProcessingRecordTx = (recordData, farmLocation) => {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const status = recordData.status ? String(recordData.status).toUpperCase().trim() : 'PENDING';
  const actor = recordData.processor || recordData.facility || 'system';

  const tx = db.transaction(() => {
    // 1. Insert processing record
    const insertStmt = db.prepare(`
      INSERT INTO processing_records (
        batch_id, facility, processing_date, method, status, processor, notes, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertStmt.run(
      recordData.batch_id.trim(),
      recordData.facility.trim(),
      recordData.processing_date,
      recordData.method.trim(),
      status,
      recordData.processor || null,
      recordData.notes || null,
      nowIso,
      nowIso
    );

    const recordId = info.lastInsertRowid;

    // 2. Update honey_batches: status -> PROCESSING, processing_status -> PENDING (or IN_PROGRESS if status was specified)
    const procStatusInBatch = status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING';
    const updateBatchStmt = db.prepare(`
      UPDATE honey_batches
      SET status = 'PROCESSING',
          processing_status = ?,
          updated_at = ?
      WHERE batch_id = ?
    `);

    updateBatchStmt.run(
      procStatusInBatch,
      nowIso,
      recordData.batch_id.trim()
    );

    // 3. Insert PROCESSING_STARTED traceability event
    const detailsObj = {
      facility: recordData.facility.trim(),
      method: recordData.method.trim(),
      processor: recordData.processor || null,
      notes: recordData.notes || null
    };

    const insertEventStmt = db.prepare(`
      INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const eventInfo = insertEventStmt.run(
      recordData.batch_id.trim(),
      'PROCESSING_STARTED',
      nowIso,
      farmLocation || recordData.facility.trim(),
      actor,
      JSON.stringify(detailsObj)
    );

    // Record SHA-256 demo blockchain block
    recordBlockTx(db, {
      id: eventInfo.lastInsertRowid,
      batch_id: recordData.batch_id.trim(),
      event_type: 'PROCESSING_STARTED',
      timestamp: nowIso,
      actor,
      details: detailsObj
    });

    return recordId;
  });

  const newId = tx();
  return getProcessingRecordById(newId);
};

const updateProcessingStatusTx = (id, newStatus, farmLocation) => {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const targetStatus = String(newStatus).toUpperCase().trim();
  const currentRecord = getProcessingRecordById(id);

  const actor = currentRecord.processor || currentRecord.facility || 'system';

  const tx = db.transaction(() => {
    // 1. Update processing_records status
    const updateRecStmt = db.prepare(`
      UPDATE processing_records
      SET status = ?,
          updated_at = ?
      WHERE id = ?
    `);
    updateRecStmt.run(targetStatus, nowIso, id);

    // 2. Update honey_batches status according to target status
    if (targetStatus === 'IN_PROGRESS') {
      const updateBatchStmt = db.prepare(`
        UPDATE honey_batches
        SET processing_status = 'IN_PROGRESS',
            updated_at = ?
        WHERE batch_id = ?
      `);
      updateBatchStmt.run(nowIso, currentRecord.batch_id);
    } else if (targetStatus === 'COMPLETED') {
      const updateBatchStmt = db.prepare(`
        UPDATE honey_batches
        SET status = 'PROCESSED',
            processing_status = 'COMPLETED',
            updated_at = ?
        WHERE batch_id = ?
      `);
      updateBatchStmt.run(nowIso, currentRecord.batch_id);

      // Insert PROCESSING_COMPLETED traceability event
      const detailsObj = {
        facility: currentRecord.facility,
        method: currentRecord.method,
        status: 'COMPLETED'
      };

      const insertEventStmt = db.prepare(`
        INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const eventInfo = insertEventStmt.run(
        currentRecord.batch_id,
        'PROCESSING_COMPLETED',
        nowIso,
        farmLocation || currentRecord.facility,
        actor,
        JSON.stringify(detailsObj)
      );

      // Record SHA-256 demo blockchain block
      recordBlockTx(db, {
        id: eventInfo.lastInsertRowid,
        batch_id: currentRecord.batch_id,
        event_type: 'PROCESSING_COMPLETED',
        timestamp: nowIso,
        actor,
        details: detailsObj
      });
    }
  });

  tx();
  return getProcessingRecordById(id);
};

const getAllProcessingRecords = ({ batch_id, status } = {}) => {
  const db = getDb();
  let query = 'SELECT * FROM processing_records WHERE 1=1';
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

const updateProcessingRecord = (id, updateData) => {
  const db = getDb();
  const allowedFields = [
    'facility',
    'processing_date',
    'method',
    'status',
    'processor',
    'notes'
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

  const stmt = db.prepare(`UPDATE processing_records SET ${setClauses.join(', ')} WHERE id = ?`);
  const result = stmt.run(...params);

  if (result.changes === 0) return null;
  return getProcessingRecordById(id);
};

const deleteProcessingRecord = (id) => {
  const db = getDb();
  const record = getProcessingRecordById(id);
  if (!record) return { deleted: false, reason: 'NOT_FOUND' };

  if (String(record.status).toUpperCase() === 'COMPLETED') {
    return {
      deleted: false,
      reason: 'RECORD_COMPLETED',
      status: record.status
    };
  }

  const stmt = db.prepare('DELETE FROM processing_records WHERE id = ?');
  const result = stmt.run(id);
  return { deleted: result.changes > 0 };
};

const getProcessingStats = () => {
  const db = getDb();

  const totalRow = db.prepare('SELECT COUNT(*) as count FROM processing_records').get();
  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM processing_records
    GROUP BY status
  `).all();

  return {
    total_records: totalRow ? totalRow.count : 0,
    by_status: statusRows
  };
};

module.exports = {
  getProcessingRecordById,
  getProcessingRecordsByBatchId,
  getActiveProcessingRecordByBatchId,
  createProcessingRecordTx,
  updateProcessingStatusTx,
  getAllProcessingRecords,
  updateProcessingRecord,
  deleteProcessingRecord,
  getProcessingStats
};
