const crypto = require('crypto');
const { getDb } = require('../db');

/**
 * SHA-256 Demo Blockchain Engine
 * Implements cryptographic hash chaining for batch traceability events.
 * NOTE: This is a local SHA-256 demo blockchain stored in SQLite for cryptographic auditability.
 * It does NOT connect to a public or external distributed blockchain network.
 */

/**
 * Calculates SHA-256 data_hash for a traceability event
 */
const computeDataHash = (batch_id, event_type, actor, timestamp, details) => {
  const detailsStr = typeof details === 'string' ? details : JSON.stringify(details || {});
  const payload = `${batch_id}:${event_type}:${actor || 'system'}:${timestamp}:${detailsStr}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Calculates SHA-256 current_hash for a block
 */
const computeCurrentHash = (data_hash, previous_hash, block_number) => {
  const payload = `${data_hash}:${previous_hash}:${block_number}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
};

/**
 * Records a new block in blockchain_records for a given traceability event in the active transaction
 * @param {Database} db - better-sqlite3 database instance (inside active transaction)
 * @param {Object} eventRecord - { id, batch_id, event_type, timestamp, actor, details }
 */
const recordBlockTx = (db, eventRecord) => {
  const { id: event_id, batch_id, event_type, timestamp, actor, details } = eventRecord;
  const nowIso = timestamp || new Date().toISOString();

  // 1. Get previous block for this batch's chain
  const prevBlockStmt = db.prepare(`
    SELECT block_number, current_hash
    FROM blockchain_records
    WHERE batch_id = ?
    ORDER BY block_number DESC, id DESC
    LIMIT 1
  `);
  const prevBlock = prevBlockStmt.get(batch_id);

  const block_number = prevBlock ? prevBlock.block_number + 1 : 1;
  const previous_hash = prevBlock ? prevBlock.current_hash : '0';

  // 2. Compute SHA-256 hashes
  const data_hash = computeDataHash(batch_id, event_type, actor, nowIso, details);
  const current_hash = computeCurrentHash(data_hash, previous_hash, block_number);

  // 3. Insert block into blockchain_records
  const insertStmt = db.prepare(`
    INSERT INTO blockchain_records (
      event_id, batch_id, block_number, timestamp, actor, event_type, data_hash, previous_hash, current_hash, status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertStmt.run(
    event_id || null,
    batch_id,
    block_number,
    nowIso,
    actor || 'system',
    event_type,
    data_hash,
    previous_hash,
    current_hash,
    'VALID'
  );

  // 4. Update honey_batches.blockchain_tx_id to latest current_hash
  const updateBatchStmt = db.prepare(`
    UPDATE honey_batches
    SET blockchain_tx_id = ?,
        updated_at = ?
    WHERE batch_id = ?
  `);
  updateBatchStmt.run(current_hash, nowIso, batch_id);

  return {
    block_number,
    data_hash,
    previous_hash,
    current_hash
  };
};

/**
 * Helper to record block if db instance is not passed directly (creates standalone transaction)
 */
const recordBlock = (eventRecord) => {
  const db = getDb();
  const tx = db.transaction(() => recordBlockTx(db, eventRecord));
  return tx();
};

module.exports = {
  computeDataHash,
  computeCurrentHash,
  recordBlockTx,
  recordBlock
};
