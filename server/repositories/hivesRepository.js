const { getDb } = require('../db');

const createHive = (hiveData) => {
  const db = getDb();
  const {
    farm_id,
    type,
    installation_date = null,
    bee_colony_info = null,
    status = 'active',
    temp = null,
    humidity = null,
    weight = null,
    activity = null,
    last_inspection = null,
    health_score = null
  } = hiveData;

  const stmt = db.prepare(`
    INSERT INTO hives (
      farm_id, type, installation_date, bee_colony_info, status,
      temp, humidity, weight, activity, last_inspection, health_score
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    Number(farm_id),
    type,
    installation_date,
    bee_colony_info,
    status,
    temp !== null && temp !== undefined && temp !== '' ? Number(temp) : null,
    humidity !== null && humidity !== undefined && humidity !== '' ? Number(humidity) : null,
    weight !== null && weight !== undefined && weight !== '' ? Number(weight) : null,
    activity,
    last_inspection,
    health_score !== null && health_score !== undefined && health_score !== '' ? Number(health_score) : null
  );

  return getHiveById(info.lastInsertRowid);
};

const getAllHives = ({ farm_id } = {}) => {
  const db = getDb();
  let query = 'SELECT * FROM hives WHERE 1=1';
  const params = [];

  if (farm_id !== undefined && farm_id !== null && farm_id !== '') {
    query += ' AND farm_id = ?';
    params.push(Number(farm_id));
  }

  query += ' ORDER BY id DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

const getHiveById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM hives WHERE id = ?');
  const hive = stmt.get(id);
  return hive || null;
};

const updateHive = (id, hiveData) => {
  const db = getDb();
  const allowedFields = [
    'farm_id',
    'type',
    'installation_date',
    'bee_colony_info',
    'status',
    'temp',
    'humidity',
    'weight',
    'activity',
    'last_inspection',
    'health_score'
  ];

  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(hiveData, field)) {
      setClauses.push(`${field} = ?`);
      let val = hiveData[field];
      if (['farm_id', 'temp', 'humidity', 'weight', 'health_score'].includes(field) && val !== null && val !== undefined && val !== '') {
        val = Number(val);
      }
      params.push(val);
    }
  }

  if (setClauses.length === 0) {
    return getHiveById(id);
  }

  params.push(id);
  const stmt = db.prepare(`UPDATE hives SET ${setClauses.join(', ')} WHERE id = ?`);
  const result = stmt.run(...params);

  if (result.changes === 0) {
    return null;
  }

  return getHiveById(id);
};

const deleteHive = (id) => {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM hives WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

const countHivesByFarmId = (farm_id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT COUNT(*) as count FROM hives WHERE farm_id = ?');
  const row = stmt.get(farm_id);
  return row ? row.count : 0;
};

const getHiveStats = () => {
  const db = getDb();
  const totalHivesRow = db.prepare('SELECT COUNT(*) as count FROM hives').get();
  const byStatusRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM hives
    GROUP BY status
  `).all();
  const byTypeRows = db.prepare(`
    SELECT type, COUNT(*) as count
    FROM hives
    GROUP BY type
  `).all();

  const avgHealthRow = db.prepare(`
    SELECT AVG(health_score) as avg_health
    FROM hives
    WHERE health_score IS NOT NULL
  `).get();

  return {
    total_hives: totalHivesRow ? totalHivesRow.count : 0,
    by_status: byStatusRows,
    by_type: byTypeRows,
    average_health_score: avgHealthRow && avgHealthRow.avg_health ? Number(avgHealthRow.avg_health.toFixed(1)) : 100
  };
};

module.exports = {
  createHive,
  getAllHives,
  getHiveById,
  updateHive,
  deleteHive,
  countHivesByFarmId,
  getHiveStats
};
