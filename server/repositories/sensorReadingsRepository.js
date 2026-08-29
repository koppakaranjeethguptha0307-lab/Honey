const { getDb } = require('../db');

const createReading = (readingData) => {
  const db = getDb();
  const {
    hive_id,
    temp,
    humidity,
    weight,
    activity,
    health_score = null,
    is_simulated = 0,
    timestamp = new Date().toISOString()
  } = readingData;

  const stmt = db.prepare(`
    INSERT INTO hive_sensor_readings (hive_id, temp, humidity, weight, activity, health_score, is_simulated, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    Number(hive_id),
    temp !== null && temp !== undefined && temp !== '' ? Number(temp) : null,
    humidity !== null && humidity !== undefined && humidity !== '' ? Number(humidity) : null,
    weight !== null && weight !== undefined && weight !== '' ? Number(weight) : null,
    activity,
    health_score !== null && health_score !== undefined && health_score !== '' ? Number(health_score) : null,
    is_simulated ? 1 : 0,
    timestamp
  );

  return getReadingById(info.lastInsertRowid);
};

const getReadingById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM hive_sensor_readings WHERE id = ?');
  const reading = stmt.get(id);
  return reading || null;
};

const getReadingsByHiveId = (hive_id, { limit } = {}) => {
  const db = getDb();
  let query = 'SELECT * FROM hive_sensor_readings WHERE hive_id = ? ORDER BY timestamp DESC, id DESC';
  const params = [Number(hive_id)];

  if (limit && !isNaN(Number(limit))) {
    query += ' LIMIT ?';
    params.push(Number(limit));
  }

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

const getLatestReadingByHiveId = (hive_id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM hive_sensor_readings WHERE hive_id = ? ORDER BY timestamp DESC, id DESC LIMIT 1');
  const reading = stmt.get(Number(hive_id));
  return reading || null;
};

const getReadingFromHoursAgo = (hive_id, hoursAgo = 24) => {
  const db = getDb();
  const targetTime = new Date(Date.now() - hoursAgo * 3600 * 1000).toISOString();
  const stmt = db.prepare(`
    SELECT * FROM hive_sensor_readings
    WHERE hive_id = ? AND timestamp <= ?
    ORDER BY timestamp DESC
    LIMIT 1
  `);
  const reading = stmt.get(Number(hive_id), targetTime);
  return reading || null;
};

module.exports = {
  createReading,
  getReadingById,
  getReadingsByHiveId,
  getLatestReadingByHiveId,
  getReadingFromHoursAgo
};
