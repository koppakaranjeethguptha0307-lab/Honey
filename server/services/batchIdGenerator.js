/**
 * Unique Batch ID Generator Service
 * Generates collision-proof batch IDs in the format: HC-{YEAR}-{6-DIGIT_SEQUENCE}
 * Example: HC-2026-000001
 */
const generateBatchId = (db) => {
  const currentYear = new Date().getFullYear();
  const prefix = `HC-${currentYear}-`;

  const stmt = db.prepare(`
    SELECT batch_id FROM honey_batches
    WHERE batch_id LIKE ?
    ORDER BY batch_id DESC
    LIMIT 1
  `);

  const row = stmt.get(`${prefix}%`);
  let nextSeq = 1;

  if (row && row.batch_id) {
    const parts = row.batch_id.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }
  }

  const seqStr = String(nextSeq).padStart(6, '0');
  return `${prefix}${seqStr}`;
};

module.exports = {
  generateBatchId
};
