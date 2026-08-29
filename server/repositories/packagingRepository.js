const { getDb } = require('../db');
const { recordBlockTx } = require('../services/blockchainEngine');

const getPackagingRecordById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM packaging_records WHERE id = ?');
  const record = stmt.get(id);
  return record || null;
};

const getPackagingRecordsByBatchId = (batchId) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM packaging_records WHERE batch_id = ? ORDER BY created_at DESC, id DESC');
  return stmt.all(batchId);
};

const getActivePackagingRecordByBatchId = (batchId) => {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM packaging_records WHERE batch_id = ? AND UPPER(status) != 'COMPLETED' ORDER BY id DESC LIMIT 1");
  const record = stmt.get(batchId);
  return record || null;
};

const createPackagingRecordTx = (recordData, farmLocation) => {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const status = recordData.status ? String(recordData.status).toUpperCase().trim() : 'PENDING';
  const actor = recordData.facility || 'system';

  const tx = db.transaction(() => {
    // 1. Insert packaging record
    const insertStmt = db.prepare(`
      INSERT INTO packaging_records (
        batch_id, packaging_date, facility, package_type, package_size, bottle_count, label_info, qr_code, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertStmt.run(
      recordData.batch_id.trim(),
      recordData.packaging_date,
      recordData.facility.trim(),
      recordData.package_type.trim(),
      recordData.package_size.trim(),
      Number(recordData.bottle_count),
      recordData.label_info || null,
      null, // qr_code generated when COMPLETED
      status,
      nowIso,
      nowIso
    );

    const recordId = info.lastInsertRowid;

    // 2. Update honey_batches: status -> PACKAGING, packaging_status -> PENDING (or IN_PROGRESS if specified)
    const packStatusInBatch = status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'PENDING';
    const updateBatchStmt = db.prepare(`
      UPDATE honey_batches
      SET status = 'PACKAGING',
          packaging_status = ?,
          updated_at = ?
      WHERE batch_id = ?
    `);

    updateBatchStmt.run(
      packStatusInBatch,
      nowIso,
      recordData.batch_id.trim()
    );

    // 3. Insert PACKAGING_STARTED traceability event
    const detailsObj = {
      facility: recordData.facility.trim(),
      package_type: recordData.package_type.trim(),
      package_size: recordData.package_size.trim(),
      bottle_count: Number(recordData.bottle_count),
      label_info: recordData.label_info || null
    };

    const insertEventStmt = db.prepare(`
      INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const eventInfo = insertEventStmt.run(
      recordData.batch_id.trim(),
      'PACKAGING_STARTED',
      nowIso,
      farmLocation || recordData.facility.trim(),
      actor,
      JSON.stringify(detailsObj)
    );

    // Record SHA-256 demo blockchain block
    recordBlockTx(db, {
      id: eventInfo.lastInsertRowid,
      batch_id: recordData.batch_id.trim(),
      event_type: 'PACKAGING_STARTED',
      timestamp: nowIso,
      actor,
      details: detailsObj
    });

    return recordId;
  });

  const newId = tx();
  return getPackagingRecordById(newId);
};

const updatePackagingStatusTx = (id, newStatus, farmLocation) => {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const targetStatus = String(newStatus).toUpperCase().trim();
  const currentRecord = getPackagingRecordById(id);
  const actor = currentRecord.facility || 'system';

  const tx = db.transaction(() => {
    if (targetStatus === 'IN_PROGRESS') {
      const updateRecStmt = db.prepare(`
        UPDATE packaging_records
        SET status = 'IN_PROGRESS',
            updated_at = ?
        WHERE id = ?
      `);
      updateRecStmt.run(nowIso, id);

      const updateBatchStmt = db.prepare(`
        UPDATE honey_batches
        SET packaging_status = 'IN_PROGRESS',
            updated_at = ?
        WHERE batch_id = ?
      `);
      updateBatchStmt.run(nowIso, currentRecord.batch_id);

    } else if (targetStatus === 'COMPLETED') {
      // Set qr_code string path "/verify/{batch_id}" (placeholder reserved for public verification)
      const qrCodePath = `/verify/${currentRecord.batch_id}`;

      const updateRecStmt = db.prepare(`
        UPDATE packaging_records
        SET status = 'COMPLETED',
            qr_code = ?,
            updated_at = ?
        WHERE id = ?
      `);
      updateRecStmt.run(qrCodePath, nowIso, id);

      const updateBatchStmt = db.prepare(`
        UPDATE honey_batches
        SET status = 'PACKAGED',
            packaging_status = 'COMPLETED',
            qr_code_url = ?,
            updated_at = ?
        WHERE batch_id = ?
      `);
      updateBatchStmt.run(qrCodePath, nowIso, currentRecord.batch_id);

      // Insert PACKAGING_COMPLETED traceability event
      const detailsObj = {
        facility: currentRecord.facility,
        package_type: currentRecord.package_type,
        package_size: currentRecord.package_size,
        bottle_count: currentRecord.bottle_count,
        qr_code: qrCodePath
      };

      const insertEventStmt = db.prepare(`
        INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const eventInfo = insertEventStmt.run(
        currentRecord.batch_id,
        'PACKAGING_COMPLETED',
        nowIso,
        farmLocation || currentRecord.facility,
        actor,
        JSON.stringify(detailsObj)
      );

      // Record SHA-256 demo blockchain block
      recordBlockTx(db, {
        id: eventInfo.lastInsertRowid,
        batch_id: currentRecord.batch_id,
        event_type: 'PACKAGING_COMPLETED',
        timestamp: nowIso,
        actor,
        details: detailsObj
      });
    }
  });

  tx();
  return getPackagingRecordById(id);
};

const getAllPackagingRecords = ({ batch_id, status } = {}) => {
  const db = getDb();
  let query = 'SELECT * FROM packaging_records WHERE 1=1';
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

const updatePackagingRecord = (id, updateData) => {
  const db = getDb();
  const allowedFields = [
    'packaging_date',
    'facility',
    'package_type',
    'package_size',
    'bottle_count',
    'label_info',
    'status'
  ];

  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      setClauses.push(`${field} = ?`);
      let val = updateData[field];
      if (field === 'bottle_count' && val !== null && val !== undefined && val !== '') {
        val = Number(val);
      }
      params.push(val);
    }
  }

  const nowIso = new Date().toISOString();
  setClauses.push('updated_at = ?');
  params.push(nowIso);

  params.push(id);

  const stmt = db.prepare(`UPDATE packaging_records SET ${setClauses.join(', ')} WHERE id = ?`);
  const result = stmt.run(...params);

  if (result.changes === 0) return null;
  return getPackagingRecordById(id);
};

const deletePackagingRecord = (id) => {
  const db = getDb();
  const record = getPackagingRecordById(id);
  if (!record) return { deleted: false, reason: 'NOT_FOUND' };

  if (String(record.status).toUpperCase() === 'COMPLETED') {
    return {
      deleted: false,
      reason: 'RECORD_COMPLETED',
      status: record.status
    };
  }

  const stmt = db.prepare('DELETE FROM packaging_records WHERE id = ?');
  const result = stmt.run(id);
  return { deleted: result.changes > 0 };
};

const getPackagingStats = () => {
  const db = getDb();

  const totalRow = db.prepare('SELECT COUNT(*) as count FROM packaging_records').get();
  const bottlesRow = db.prepare('SELECT SUM(bottle_count) as total_bottles FROM packaging_records').get();

  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM packaging_records
    GROUP BY status
  `).all();

  return {
    total_records: totalRow ? totalRow.count : 0,
    total_bottles: bottlesRow && bottlesRow.total_bottles ? bottlesRow.total_bottles : 0,
    by_status: statusRows
  };
};

module.exports = {
  getPackagingRecordById,
  getPackagingRecordsByBatchId,
  getActivePackagingRecordByBatchId,
  createPackagingRecordTx,
  updatePackagingStatusTx,
  getAllPackagingRecords,
  updatePackagingRecord,
  deletePackagingRecord,
  getPackagingStats
};
