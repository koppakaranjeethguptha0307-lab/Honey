const { getDb } = require('../db');
const { recordBlockTx } = require('../services/blockchainEngine');

const getQualityTestById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM quality_tests WHERE id = ?');
  const test = stmt.get(id);
  return test || null;
};

const getQualityTestsByBatchId = (batchId) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM quality_tests WHERE batch_id = ? ORDER BY created_at DESC, id DESC');
  return stmt.all(batchId);
};

const createQualityTestTx = (testData, assessment, farmLocation) => {
  const db = getDb();
  const nowIso = new Date().toISOString();

  const purity = Number(testData.purity_pct !== undefined ? testData.purity_pct : testData.purity_percentage);
  const moisture = Number(testData.moisture_pct !== undefined ? testData.moisture_pct : testData.moisture_percentage);
  const adulteration = String(testData.adulteration_check).toUpperCase().trim();
  const inspectorName = testData.inspector_name || 'system';

  const tx = db.transaction(() => {
    // 1. Insert quality_test record
    const insertTestStmt = db.prepare(`
      INSERT INTO quality_tests (
        batch_id, test_date, purity_pct, moisture_pct, color, aroma, taste,
        adulteration_check, quality_grade, inspector_name, status, remarks,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insertTestStmt.run(
      testData.batch_id.trim(),
      testData.test_date,
      purity,
      moisture,
      testData.color || null,
      testData.aroma || null,
      testData.taste || null,
      adulteration,
      assessment.quality_grade,
      inspectorName,
      'PENDING',
      testData.remarks || null,
      nowIso,
      nowIso
    );

    const testId = info.lastInsertRowid;

    // 2. Update honey_batches status to QUALITY_TESTING & quality_status to PENDING
    const updateBatchStmt = db.prepare(`
      UPDATE honey_batches
      SET status = 'QUALITY_TESTING',
          quality_status = 'PENDING',
          quality_grade = ?,
          purity_pct = ?,
          moisture_pct = ?,
          updated_at = ?
      WHERE batch_id = ?
    `);

    updateBatchStmt.run(
      assessment.quality_grade,
      purity,
      moisture,
      nowIso,
      testData.batch_id.trim()
    );

    // 3. Insert QUALITY_TEST_STARTED traceability event
    const detailsObj = {
      purity_pct: purity,
      moisture_pct: moisture,
      adulteration_check: adulteration,
      quality_grade: assessment.quality_grade,
      recommendation: assessment.recommendation
    };

    const insertEventStmt = db.prepare(`
      INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const eventInfo = insertEventStmt.run(
      testData.batch_id.trim(),
      'QUALITY_TEST_STARTED',
      nowIso,
      farmLocation || 'Processing Facility',
      inspectorName,
      JSON.stringify(detailsObj)
    );

    // Record SHA-256 demo blockchain block
    recordBlockTx(db, {
      id: eventInfo.lastInsertRowid,
      batch_id: testData.batch_id.trim(),
      event_type: 'QUALITY_TEST_STARTED',
      timestamp: nowIso,
      actor: inspectorName,
      details: detailsObj
    });

    return testId;
  });

  const newTestId = tx();
  return getQualityTestById(newTestId);
};

const approveQualityTestTx = (testId, batch, remarks, inspectorName, farmLocation) => {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const test = getQualityTestById(testId);
  const actor = inspectorName || test.inspector_name || 'system';
  const finalRemarks = remarks || test.remarks || 'Approved by inspector';

  const tx = db.transaction(() => {
    // 1. Update quality_tests status
    const updateTestStmt = db.prepare(`
      UPDATE quality_tests
      SET status = 'APPROVED',
          remarks = ?,
          updated_at = ?
      WHERE id = ?
    `);
    updateTestStmt.run(finalRemarks, nowIso, testId);

    // 2. Update honey_batches status to QUALITY_TESTED & quality_status to APPROVED
    const updateBatchStmt = db.prepare(`
      UPDATE honey_batches
      SET status = 'QUALITY_TESTED',
          quality_status = 'APPROVED',
          updated_at = ?
      WHERE batch_id = ?
    `);
    updateBatchStmt.run(nowIso, test.batch_id);

    // 3. Insert QUALITY_APPROVED traceability event
    const detailsObj = {
      quality_grade: test.quality_grade,
      recommendation: 'APPROVED',
      remarks: finalRemarks
    };

    const insertEventStmt = db.prepare(`
      INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const eventInfo = insertEventStmt.run(
      test.batch_id,
      'QUALITY_APPROVED',
      nowIso,
      farmLocation || 'Processing Facility',
      actor,
      JSON.stringify(detailsObj)
    );

    // Record SHA-256 demo blockchain block
    recordBlockTx(db, {
      id: eventInfo.lastInsertRowid,
      batch_id: test.batch_id,
      event_type: 'QUALITY_APPROVED',
      timestamp: nowIso,
      actor,
      details: detailsObj
    });
  });

  tx();
  return getQualityTestById(testId);
};

const rejectQualityTestTx = (testId, batch, reason, inspectorName, farmLocation) => {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const test = getQualityTestById(testId);
  const actor = inspectorName || test.inspector_name || 'system';

  const tx = db.transaction(() => {
    // 1. Update quality_tests status
    const updateTestStmt = db.prepare(`
      UPDATE quality_tests
      SET status = 'REJECTED',
          remarks = ?,
          updated_at = ?
      WHERE id = ?
    `);
    updateTestStmt.run(reason, nowIso, testId);

    // 2. Update honey_batches status
    const updateBatchStmt = db.prepare(`
      UPDATE honey_batches
      SET status = 'REJECTED',
          quality_status = 'REJECTED',
          updated_at = ?
      WHERE batch_id = ?
    `);
    updateBatchStmt.run(nowIso, test.batch_id);

    // 3. Insert QUALITY_REJECTED traceability event
    const detailsObj = {
      rejection_reason: reason,
      quality_grade: test.quality_grade
    };

    const insertEventStmt = db.prepare(`
      INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const eventInfo = insertEventStmt.run(
      test.batch_id,
      'QUALITY_REJECTED',
      nowIso,
      farmLocation || 'Processing Facility',
      actor,
      JSON.stringify(detailsObj)
    );

    // Record SHA-256 demo blockchain block
    recordBlockTx(db, {
      id: eventInfo.lastInsertRowid,
      batch_id: test.batch_id,
      event_type: 'QUALITY_REJECTED',
      timestamp: nowIso,
      actor,
      details: detailsObj
    });
  });

  tx();
  return getQualityTestById(testId);
};

const getAllQualityTests = ({ status, batch_id } = {}) => {
  const db = getDb();
  let query = 'SELECT * FROM quality_tests WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND UPPER(status) = UPPER(?)';
    params.push(status.trim());
  }

  if (batch_id) {
    query += ' AND LOWER(batch_id) = LOWER(?)';
    params.push(batch_id.trim());
  }

  query += ' ORDER BY created_at DESC, id DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

const updateQualityTest = (id, updateData) => {
  const db = getDb();
  const allowedFields = [
    'test_date',
    'purity_pct',
    'moisture_pct',
    'color',
    'aroma',
    'taste',
    'adulteration_check',
    'quality_grade',
    'inspector_name',
    'status',
    'remarks'
  ];

  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      setClauses.push(`${field} = ?`);
      let val = updateData[field];
      if (['purity_pct', 'moisture_pct'].includes(field) && val !== null && val !== undefined && val !== '') {
        val = Number(val);
      }
      params.push(val);
    }
  }

  const nowIso = new Date().toISOString();
  setClauses.push('updated_at = ?');
  params.push(nowIso);

  params.push(id);
  const stmt = db.prepare(`UPDATE quality_tests SET ${setClauses.join(', ')} WHERE id = ?`);
  const result = stmt.run(...params);

  if (result.changes === 0) return null;
  return getQualityTestById(id);
};

const deleteQualityTest = (id) => {
  const db = getDb();
  const test = getQualityTestById(id);
  if (!test) return { deleted: false, reason: 'NOT_FOUND' };

  if (['APPROVED', 'REJECTED'].includes(String(test.status).toUpperCase())) {
    return {
      deleted: false,
      reason: 'ALREADY_PROCESSED',
      status: test.status
    };
  }

  const stmt = db.prepare('DELETE FROM quality_tests WHERE id = ?');
  const result = stmt.run(id);
  return { deleted: result.changes > 0 };
};

const getQualityStats = () => {
  const db = getDb();

  const totalRow = db.prepare('SELECT COUNT(*) as count FROM quality_tests').get();
  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM quality_tests
    GROUP BY status
  `).all();

  const avgRow = db.prepare(`
    SELECT AVG(purity_pct) as avg_purity, AVG(moisture_pct) as avg_moisture
    FROM quality_tests
  `).get();

  const gradeRows = db.prepare(`
    SELECT quality_grade, COUNT(*) as count
    FROM quality_tests
    GROUP BY quality_grade
  `).all();

  const adultRows = db.prepare(`
    SELECT adulteration_check, COUNT(*) as count
    FROM quality_tests
    GROUP BY adulteration_check
  `).all();

  return {
    total_tests: totalRow ? totalRow.count : 0,
    by_status: statusRows,
    average_purity: avgRow && avgRow.avg_purity ? Number(avgRow.avg_purity.toFixed(2)) : 0,
    average_moisture: avgRow && avgRow.avg_moisture ? Number(avgRow.avg_moisture.toFixed(2)) : 0,
    by_grade: gradeRows,
    adulteration_summary: adultRows
  };
};

module.exports = {
  getQualityTestById,
  getQualityTestsByBatchId,
  createQualityTestTx,
  approveQualityTestTx,
  rejectQualityTestTx,
  getAllQualityTests,
  updateQualityTest,
  deleteQualityTest,
  getQualityStats
};
