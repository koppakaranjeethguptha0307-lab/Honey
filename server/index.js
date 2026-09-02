// Ignore EPIPE errors on stdout/stderr when running as background task
process.stdout?.on('error', (err) => { if (err.code === 'EPIPE') return; });
process.stderr?.on('error', (err) => { if (err.code === 'EPIPE') return; });

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { getDb, initSchema, closeDb } = require('./db');

const authRouter = require('./routes/auth');
const farmsRouter = require('./routes/farms');
const hivesRouter = require('./routes/hives');
const alertsRouter = require('./routes/alerts');
const batchesRouter = require('./routes/batches');
const qualityRouter = require('./routes/quality');
const processingRouter = require('./routes/processing');
const packagingRouter = require('./routes/packaging');
const transportationRouter = require('./routes/transportation');
const supplychainRouter = require('./routes/supplychain');
const analyticsRouter = require('./routes/analytics');
const verifyRouter = require('./routes/verify');

const app = express();
const PORT = process.env.PORT || 5000;

// Security, CORS, Logging, and Parsing Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
}));
app.use(morgan('dev'));
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'honey-chain-backend',
    timestamp: new Date().toISOString(),
  });
});

// Diagnostic Database Health Check Endpoint (Phase 2)
app.get('/api/health/db', (req, res) => {
  try {
    const db = getDb();
    const tables = [
      'users',
      'farms',
      'hives',
      'hive_sensor_readings',
      'honey_batches',
      'quality_tests',
      'processing_records',
      'packaging_records',
      'transportation_records',
      'traceability_events',
      'blockchain_records',
      'alerts',
      'notifications'
    ];
    const tableCounts = {};
    for (const table of tables) {
      const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get();
      tableCounts[table] = row.count;
    }
    res.status(200).json({
      status: 'ok',
      tables: tableCounts
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Route Mounts
app.use('/api/auth', authRouter);
app.use('/api/farms', farmsRouter);
app.use('/api/hives', hivesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/honey-batches', batchesRouter);
app.use('/api/quality-tests', qualityRouter);
app.use('/api/processing-records', processingRouter);
app.use('/api/packaging-records', packagingRouter);
app.use('/api/transportation-records', transportationRouter);
app.use('/api/supplychain', supplychainRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/verify', verifyRouter);

// 404 Handler for Unmatched Routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Generic Error-Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({ error: message });
});

// Initialize Database Schema before listening
initSchema();

// Start Server
const server = app.listen(PORT, () => {
  console.log(`[Honey Chain Backend] Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});

// Graceful Shutdown Handling
const gracefulShutdown = (signal) => {
  console.log(`[Honey Chain Backend] Received ${signal}. Closing HTTP server and database connection...`);
  server.close(() => {
    try {
      closeDb();
      console.log('[Honey Chain Backend] Database connection closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[Honey Chain Backend] Error closing database connection:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
