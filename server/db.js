const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

let db = null;

const getDb = () => {
  if (!db) {
    const dbPath = process.env.DB_PATH
      ? path.resolve(process.env.DB_PATH)
      : path.join(__dirname, 'data', 'honeychain.sqlite');

    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
  }
  return db;
};

const closeDb = () => {
  if (db && db.open) {
    db.close();
    db = null;
  }
};

const initSchema = () => {
  const database = getDb();

  const schemaSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      password_hash TEXT,
      role TEXT
    );

    CREATE TABLE IF NOT EXISTS farms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      farmer_name TEXT,
      location TEXT,
      village TEXT,
      district TEXT,
      state TEXT,
      country TEXT,
      lat REAL,
      lng REAL,
      hives_count INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER,
      type TEXT,
      installation_date TEXT,
      bee_colony_info TEXT,
      status TEXT,
      temp REAL,
      humidity REAL,
      weight REAL,
      activity TEXT,
      last_inspection TEXT,
      health_score REAL,
      FOREIGN KEY (farm_id) REFERENCES farms(id)
    );

    CREATE TABLE IF NOT EXISTS hive_sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hive_id INTEGER,
      temp REAL,
      humidity REAL,
      weight REAL,
      activity TEXT,
      health_score REAL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hive_id) REFERENCES hives(id)
    );

    CREATE TABLE IF NOT EXISTS honey_batches (
      batch_id TEXT PRIMARY KEY,
      farm_id INTEGER,
      hive_id INTEGER,
      harvest_date TEXT,
      honey_type TEXT,
      quantity REAL,
      unit TEXT,
      quality_grade TEXT,
      purity_pct REAL,
      moisture_pct REAL,
      quality_status TEXT,
      processing_status TEXT,
      packaging_status TEXT,
      transport_status TEXT,
      current_location TEXT,
      status TEXT,
      qr_code_url TEXT,
      blockchain_tx_id TEXT,
      FOREIGN KEY (farm_id) REFERENCES farms(id),
      FOREIGN KEY (hive_id) REFERENCES hives(id)
    );

    CREATE TABLE IF NOT EXISTS quality_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT,
      test_date TEXT,
      purity_pct REAL,
      moisture_pct REAL,
      color TEXT,
      aroma TEXT,
      taste TEXT,
      adulteration_check TEXT,
      quality_grade TEXT,
      inspector_name TEXT,
      status TEXT,
      remarks TEXT,
      FOREIGN KEY (batch_id) REFERENCES honey_batches(batch_id)
    );

    CREATE TABLE IF NOT EXISTS processing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT,
      facility TEXT,
      processing_date TEXT,
      method TEXT,
      status TEXT,
      processor TEXT,
      notes TEXT,
      FOREIGN KEY (batch_id) REFERENCES honey_batches(batch_id)
    );

    CREATE TABLE IF NOT EXISTS packaging_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT,
      packaging_date TEXT,
      facility TEXT,
      package_type TEXT,
      package_size TEXT,
      bottle_count INTEGER,
      label_info TEXT,
      qr_code TEXT,
      status TEXT,
      FOREIGN KEY (batch_id) REFERENCES honey_batches(batch_id)
    );

    CREATE TABLE IF NOT EXISTS transportation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT,
      transporter_name TEXT,
      pickup_date TEXT,
      pickup_loc TEXT,
      destination_loc TEXT,
      delivery_date TEXT,
      status TEXT,
      confirmation_code TEXT,
      FOREIGN KEY (batch_id) REFERENCES honey_batches(batch_id)
    );

    CREATE TABLE IF NOT EXISTS traceability_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id TEXT,
      event_type TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      location TEXT,
      actor TEXT,
      details TEXT,
      FOREIGN KEY (batch_id) REFERENCES honey_batches(batch_id)
    );

    CREATE TABLE IF NOT EXISTS blockchain_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      batch_id TEXT,
      block_number INTEGER,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      actor TEXT,
      event_type TEXT,
      data_hash TEXT,
      previous_hash TEXT,
      current_hash TEXT,
      status TEXT,
      FOREIGN KEY (batch_id) REFERENCES honey_batches(batch_id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hive_id INTEGER,
      farm_id INTEGER,
      severity TEXT,
      title TEXT,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hive_id) REFERENCES hives(id),
      FOREIGN KEY (farm_id) REFERENCES farms(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_role TEXT,
      title TEXT,
      message TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

  database.exec(schemaSql);

  // Phase 4 migration — additive only
  const sensorCols = database.prepare("PRAGMA table_info(hive_sensor_readings)").all();
  if (!sensorCols.some(col => col.name === 'is_simulated')) {
    database.exec('ALTER TABLE hive_sensor_readings ADD COLUMN is_simulated INTEGER DEFAULT 0');
  }

  const alertCols = database.prepare("PRAGMA table_info(alerts)").all();
  if (!alertCols.some(col => col.name === 'alert_type')) {
    database.exec('ALTER TABLE alerts ADD COLUMN alert_type TEXT');
  }

  // Phase 5 migration — additive only
  const batchCols = database.prepare("PRAGMA table_info(honey_batches)").all();
  if (!batchCols.some(col => col.name === 'created_at')) {
    database.exec('ALTER TABLE honey_batches ADD COLUMN created_at TEXT');
  }
  if (!batchCols.some(col => col.name === 'updated_at')) {
    database.exec('ALTER TABLE honey_batches ADD COLUMN updated_at TEXT');
  }

  // Phase 6 migration — additive only
  const testCols = database.prepare("PRAGMA table_info(quality_tests)").all();
  if (!testCols.some(col => col.name === 'created_at')) {
    database.exec('ALTER TABLE quality_tests ADD COLUMN created_at TEXT');
  }
  if (!testCols.some(col => col.name === 'updated_at')) {
    database.exec('ALTER TABLE quality_tests ADD COLUMN updated_at TEXT');
  }

  // Phase 7 migration — additive only
  const procCols = database.prepare("PRAGMA table_info(processing_records)").all();
  if (!procCols.some(col => col.name === 'created_at')) {
    database.exec('ALTER TABLE processing_records ADD COLUMN created_at TEXT');
  }
  if (!procCols.some(col => col.name === 'updated_at')) {
    database.exec('ALTER TABLE processing_records ADD COLUMN updated_at TEXT');
  }

  const packCols = database.prepare("PRAGMA table_info(packaging_records)").all();
  if (!packCols.some(col => col.name === 'created_at')) {
    database.exec('ALTER TABLE packaging_records ADD COLUMN created_at TEXT');
  }
  if (!packCols.some(col => col.name === 'updated_at')) {
    database.exec('ALTER TABLE packaging_records ADD COLUMN updated_at TEXT');
  }

  // Phase 8 migration — additive only
  const transCols = database.prepare("PRAGMA table_info(transportation_records)").all();
  if (!transCols.some(col => col.name === 'created_at')) {
    database.exec('ALTER TABLE transportation_records ADD COLUMN created_at TEXT');
  }
  if (!transCols.some(col => col.name === 'updated_at')) {
    database.exec('ALTER TABLE transportation_records ADD COLUMN updated_at TEXT');
  }
};

module.exports = { getDb, initSchema, closeDb };

