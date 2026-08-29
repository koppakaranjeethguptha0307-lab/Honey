const { getDb } = require('../db');

const createAlert = (alertData) => {
  const db = getDb();
  const {
    hive_id = null,
    farm_id = null,
    alert_type = 'GENERAL_ALERT',
    severity = 'INFO',
    title,
    message,
    is_read = 0,
    created_at = new Date().toISOString()
  } = alertData;

  const stmt = db.prepare(`
    INSERT INTO alerts (hive_id, farm_id, alert_type, severity, title, message, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    hive_id !== null && hive_id !== undefined ? Number(hive_id) : null,
    farm_id !== null && farm_id !== undefined ? Number(farm_id) : null,
    alert_type,
    severity,
    title,
    message,
    is_read ? 1 : 0,
    created_at
  );

  return getAlertById(info.lastInsertRowid);
};

const getAlertById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM alerts WHERE id = ?');
  const alert = stmt.get(id);
  return alert || null;
};

const getAllAlerts = ({ severity, hive_id, is_read } = {}) => {
  const db = getDb();
  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];

  if (severity) {
    query += ' AND UPPER(severity) = UPPER(?)';
    params.push(severity.trim());
  }

  if (hive_id !== undefined && hive_id !== null && hive_id !== '') {
    query += ' AND hive_id = ?';
    params.push(Number(hive_id));
  }

  if (is_read !== undefined && is_read !== null && is_read !== '') {
    query += ' AND is_read = ?';
    params.push(Number(is_read) ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC, id DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

const getAlertsByHiveId = (hive_id, { is_read } = {}) => {
  return getAllAlerts({ hive_id, is_read });
};

const markAlertRead = (id) => {
  const db = getDb();
  const stmt = db.prepare('UPDATE alerts SET is_read = 1 WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) return null;
  return getAlertById(id);
};

const markAlertUnread = (id) => {
  const db = getDb();
  const stmt = db.prepare('UPDATE alerts SET is_read = 0 WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) return null;
  return getAlertById(id);
};

const findUnresolvedAlertByTypeAndHive = (hive_id, alert_type) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM alerts
    WHERE hive_id = ? AND alert_type = ? AND is_read = 0
    ORDER BY id DESC LIMIT 1
  `);
  const alert = stmt.get(Number(hive_id), alert_type);
  return alert || null;
};

module.exports = {
  createAlert,
  getAlertById,
  getAllAlerts,
  getAlertsByHiveId,
  markAlertRead,
  markAlertUnread,
  findUnresolvedAlertByTypeAndHive
};
