const { getDb } = require('../db');
const { generateBatchId } = require('../services/batchIdGenerator');
const { recordBlockTx } = require('../services/blockchainEngine');

const createBatch = (batchData, farm, hiveHealthContext = null) => {
  const db = getDb();

  const nowIso = new Date().toISOString();
  const unit = batchData.unit ? String(batchData.unit).toLowerCase().trim() : 'kg';

  // Transaction ensuring atomic batch creation + traceability event insertion + blockchain block recording
  const createTx = db.transaction(() => {
    const batchId = generateBatchId(db);

    const insertBatchStmt = db.prepare(`
      INSERT INTO honey_batches (
        batch_id, farm_id, hive_id, harvest_date, honey_type, quantity, unit,
        status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBatchStmt.run(
      batchId,
      Number(batchData.farm_id),
      Number(batchData.hive_id),
      batchData.harvest_date,
      batchData.honey_type.trim(),
      Number(batchData.quantity),
      unit,
      'HARVESTED',
      nowIso,
      nowIso
    );

    // Insert origin HONEY_HARVESTED traceability event
    const farmLocation = farm ? (farm.location || `${farm.name}, ${farm.district || ''}`) : 'Farm Location';
    const detailsObj = {
      farm_id: Number(batchData.farm_id),
      hive_id: Number(batchData.hive_id),
      harvest_date: batchData.harvest_date,
      honey_type: batchData.honey_type.trim(),
      quantity: Number(batchData.quantity),
      unit
    };

    const insertEventStmt = db.prepare(`
      INSERT INTO traceability_events (batch_id, event_type, timestamp, location, actor, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const info = insertEventStmt.run(
      batchId,
      'HONEY_HARVESTED',
      nowIso,
      farmLocation,
      'system',
      JSON.stringify(detailsObj)
    );

    const eventId = info.lastInsertRowid;

    // Record SHA-256 demo blockchain block
    recordBlockTx(db, {
      id: eventId,
      batch_id: batchId,
      event_type: 'HONEY_HARVESTED',
      timestamp: nowIso,
      actor: 'system',
      details: detailsObj
    });

    return batchId;
  });

  const newBatchId = createTx();
  const createdBatch = getBatchById(newBatchId);
  if (createdBatch && hiveHealthContext) {
    createdBatch.hive_health_at_harvest = hiveHealthContext;
  }
  return createdBatch;
};

const getBatchById = (batchId) => {
  const db = getDb();
  const batchStmt = db.prepare('SELECT * FROM honey_batches WHERE batch_id = ?');
  const batch = batchStmt.get(batchId);

  if (!batch) return null;

  const farmStmt = db.prepare('SELECT * FROM farms WHERE id = ?');
  const farm = farmStmt.get(batch.farm_id) || null;

  const hiveStmt = db.prepare('SELECT * FROM hives WHERE id = ?');
  const hive = hiveStmt.get(batch.hive_id) || null;

  const eventsStmt = db.prepare('SELECT * FROM traceability_events WHERE batch_id = ? ORDER BY timestamp ASC, id ASC');
  const traceability_events = eventsStmt.all(batchId);

  return {
    batch_id: batch.batch_id,
    status: batch.status || 'HARVESTED',
    farm: farm ? {
      id: farm.id,
      name: farm.name,
      farmer_name: farm.farmer_name,
      location: farm.location,
      village: farm.village,
      district: farm.district,
      state: farm.state,
      country: farm.country,
      lat: farm.lat,
      lng: farm.lng
    } : null,
    hive: hive ? {
      id: hive.id,
      type: hive.type,
      status: hive.status
    } : null,
    harvest: {
      date: batch.harvest_date,
      honey_type: batch.honey_type,
      quantity: batch.quantity,
      unit: batch.unit
    },
    quality_grade: batch.quality_grade || null,
    purity_pct: batch.purity_pct || null,
    moisture_pct: batch.moisture_pct || null,
    quality_status: batch.quality_status || null,
    processing_status: batch.processing_status || null,
    packaging_status: batch.packaging_status || null,
    transport_status: batch.transport_status || null,
    current_location: batch.current_location || null,
    qr_code_url: batch.qr_code_url || null,
    blockchain_tx_id: batch.blockchain_tx_id || null,
    created_at: batch.created_at,
    updated_at: batch.updated_at,
    traceability_events
  };
};

const getAllBatches = ({ farm_id, hive_id, status, honey_type, search } = {}) => {
  const db = getDb();
  let query = 'SELECT * FROM honey_batches WHERE 1=1';
  const params = [];

  if (farm_id !== undefined && farm_id !== null && farm_id !== '') {
    query += ' AND farm_id = ?';
    params.push(Number(farm_id));
  }

  if (hive_id !== undefined && hive_id !== null && hive_id !== '') {
    query += ' AND hive_id = ?';
    params.push(Number(hive_id));
  }

  if (status) {
    query += ' AND UPPER(status) = UPPER(?)';
    params.push(status.trim());
  }

  if (honey_type) {
    query += ' AND LOWER(honey_type) = LOWER(?)';
    params.push(honey_type.trim());
  }

  if (search) {
    query += ' AND LOWER(batch_id) LIKE LOWER(?)';
    params.push(`%${search.trim()}%`);
  }

  query += ' ORDER BY created_at DESC, batch_id DESC';

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);

  return rows.map(r => getBatchById(r.batch_id));
};

const updateBatch = (batchId, updateData) => {
  const db = getDb();

  const allowedFields = [
    'farm_id',
    'hive_id',
    'harvest_date',
    'honey_type',
    'quantity',
    'unit',
    'quality_grade',
    'purity_pct',
    'moisture_pct',
    'quality_status',
    'processing_status',
    'packaging_status',
    'transport_status',
    'current_location',
    'status',
    'qr_code_url',
    'blockchain_tx_id'
  ];

  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(updateData, field)) {
      setClauses.push(`${field} = ?`);
      let val = updateData[field];
      if (['farm_id', 'hive_id', 'quantity', 'purity_pct', 'moisture_pct'].includes(field) && val !== null && val !== undefined && val !== '') {
        val = Number(val);
      }
      params.push(val);
    }
  }

  const nowIso = new Date().toISOString();
  setClauses.push('updated_at = ?');
  params.push(nowIso);

  params.push(batchId);

  const stmt = db.prepare(`UPDATE honey_batches SET ${setClauses.join(', ')} WHERE batch_id = ?`);
  const result = stmt.run(...params);

  if (result.changes === 0) {
    return null;
  }

  return getBatchById(batchId);
};

const getTraceabilityEventsCount = (batchId) => {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM traceability_events WHERE batch_id = ?');
  const row = stmt.get(batchId);
  return row ? row.count : 0;
};

const deleteBatch = (batchId) => {
  const db = getDb();
  const eventCount = getTraceabilityEventsCount(batchId);

  if (eventCount > 0) {
    return {
      deleted: false,
      reason: 'HAS_TRACEABILITY_EVENTS',
      eventCount
    };
  }

  const stmt = db.prepare('DELETE FROM honey_batches WHERE batch_id = ?');
  const result = stmt.run(batchId);
  return {
    deleted: result.changes > 0
  };
};

const getBatchStats = () => {
  const db = getDb();

  const totalBatchesRow = db.prepare('SELECT COUNT(*) as count FROM honey_batches').get();
  const totalQuantityRow = db.prepare('SELECT SUM(quantity) as total FROM honey_batches').get();

  const byHoneyTypeRows = db.prepare(`
    SELECT honey_type, COUNT(*) as count, SUM(quantity) as total_quantity
    FROM honey_batches
    GROUP BY honey_type
    ORDER BY count DESC
  `).all();

  const byStatusRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM honey_batches
    GROUP BY status
    ORDER BY count DESC
  `).all();

  const totalFarmsRow = db.prepare('SELECT COUNT(DISTINCT farm_id) as count FROM honey_batches').get();
  const totalHivesRow = db.prepare('SELECT COUNT(DISTINCT hive_id) as count FROM honey_batches').get();

  return {
    total_batches: totalBatchesRow ? totalBatchesRow.count : 0,
    total_quantity_harvested: totalQuantityRow && totalQuantityRow.total ? Number(totalQuantityRow.total.toFixed(2)) : 0,
    by_honey_type: byHoneyTypeRows,
    by_status: byStatusRows,
    distinct_producer_farms: totalFarmsRow ? totalFarmsRow.count : 0,
    distinct_producer_hives: totalHivesRow ? totalHivesRow.count : 0
  };
};

module.exports = {
  createBatch,
  getBatchById,
  getAllBatches,
  updateBatch,
  deleteBatch,
  getTraceabilityEventsCount,
  getBatchStats
};
