const { getDb } = require('../db');

const createFarm = (farmData) => {
  const db = getDb();
  const {
    name,
    farmer_name = null,
    location = null,
    village = null,
    district = null,
    state = null,
    country = null,
    lat = null,
    lng = null,
    hives_count = 0,
    created_at = new Date().toISOString()
  } = farmData;

  const stmt = db.prepare(`
    INSERT INTO farms (name, farmer_name, location, village, district, state, country, lat, lng, hives_count, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    name,
    farmer_name,
    location,
    village,
    district,
    state,
    country,
    lat !== null && lat !== undefined && lat !== '' ? Number(lat) : null,
    lng !== null && lng !== undefined && lng !== '' ? Number(lng) : null,
    Number(hives_count) || 0,
    created_at
  );

  return getFarmById(info.lastInsertRowid);
};

const getAllFarms = ({ state, district, search } = {}) => {
  const db = getDb();
  let query = 'SELECT * FROM farms WHERE 1=1';
  const params = [];

  if (state) {
    query += ' AND LOWER(state) = LOWER(?)';
    params.push(state.trim());
  }

  if (district) {
    query += ' AND LOWER(district) = LOWER(?)';
    params.push(district.trim());
  }

  if (search) {
    query += ' AND (LOWER(name) LIKE LOWER(?) OR LOWER(farmer_name) LIKE LOWER(?) OR LOWER(location) LIKE LOWER(?))';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY id DESC';

  const stmt = db.prepare(query);
  return stmt.all(...params);
};

const getFarmById = (id) => {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM farms WHERE id = ?');
  const farm = stmt.get(id);
  return farm || null;
};

const updateFarm = (id, farmData) => {
  const db = getDb();
  const allowedFields = [
    'name',
    'farmer_name',
    'location',
    'village',
    'district',
    'state',
    'country',
    'lat',
    'lng',
    'hives_count'
  ];

  const setClauses = [];
  const params = [];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(farmData, field)) {
      setClauses.push(`${field} = ?`);
      let val = farmData[field];
      if ((field === 'lat' || field === 'lng') && val !== null && val !== undefined && val !== '') {
        val = Number(val);
      } else if (field === 'hives_count' && val !== null && val !== undefined && val !== '') {
        val = Number(val);
      }
      params.push(val);
    }
  }

  if (setClauses.length === 0) {
    return getFarmById(id);
  }

  params.push(id);
  const stmt = db.prepare(`UPDATE farms SET ${setClauses.join(', ')} WHERE id = ?`);
  const result = stmt.run(...params);

  if (result.changes === 0) {
    return null;
  }

  return getFarmById(id);
};

const deleteFarm = (id) => {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM farms WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

const incrementHivesCount = (id) => {
  const db = getDb();
  const stmt = db.prepare('UPDATE farms SET hives_count = hives_count + 1 WHERE id = ?');
  stmt.run(id);
};

const decrementHivesCount = (id) => {
  const db = getDb();
  const stmt = db.prepare('UPDATE farms SET hives_count = MAX(0, hives_count - 1) WHERE id = ?');
  stmt.run(id);
};

const getFarmStats = () => {
  const db = getDb();
  const totalFarmsRow = db.prepare('SELECT COUNT(*) as count FROM farms').get();
  const totalHivesRow = db.prepare('SELECT SUM(hives_count) as total FROM farms').get();
  const byStateRows = db.prepare(`
    SELECT state, COUNT(*) as count
    FROM farms
    WHERE state IS NOT NULL AND state != ''
    GROUP BY state
    ORDER BY count DESC
  `).all();

  return {
    total_farms: totalFarmsRow ? totalFarmsRow.count : 0,
    total_hives: totalHivesRow && totalHivesRow.total ? totalHivesRow.total : 0,
    by_state: byStateRows
  };
};

module.exports = {
  createFarm,
  getAllFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
  incrementHivesCount,
  decrementHivesCount,
  getFarmStats
};
