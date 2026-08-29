# Honey Chain Backend API Reference

Comprehensive reference guide for all REST endpoints in the Honey Chain smart beekeeping and blockchain honey traceability backend system.

---

## Response Envelope Standard

All API endpoints return JSON using a standard response envelope and HTTP status codes:

### Success Response (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response (`400 Bad Request` / `404 Not Found` / `409 Conflict` / `500 Internal Server Error`)
```json
{
  "success": false,
  "error": "Detailed error message describing failure reason."
}
```

---

## 1. System & Health Endpoints

### `GET /api/health`
- **Description**: Returns general backend system status.
- **Auth Required**: No
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "service": "honey-chain-backend",
    "timestamp": "2026-08-24T23:12:00.000Z"
  }
  ```

### `GET /api/health/db`
- **Description**: Diagnostic health check detailing SQLite database connection status and table row counts across all 13 core tables.
- **Auth Required**: No
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "tables": {
      "users": 0,
      "farms": 9,
      "hives": 10,
      "hive_sensor_readings": 13,
      "honey_batches": 14,
      "quality_tests": 11,
      "processing_records": 6,
      "packaging_records": 5,
      "transportation_records": 4,
      "traceability_events": 63,
      "blockchain_records": 9,
      "alerts": 12,
      "notifications": 0
    }
  }
  ```

---

## 2. Farm Management (`/api/farms`)

- **`POST /api/farms`**: Create a new beekeeper farm location. (`201 Created`)
- **`GET /api/farms`**: List all registered farms (supports `?search=` filter). (`200 OK`)
- **`GET /api/farms/stats`**: Get aggregated farm metrics and total hives. (`200 OK`)
- **`GET /api/farms/:id`**: Get single farm detail. (`200 OK` / `404 Not Found`)
- **`PUT /api/farms/:id`**: Update farm details. (`200 OK` / `400 Bad Request` / `404 Not Found`)
- **`DELETE /api/farms/:id`**: Delete a farm. Blocked with `409 Conflict` if active hives are attached. (`200 OK` / `409 Conflict`)
- **`GET /api/farms/:id/hives`**: List all hives belonging to a specific farm. (`200 OK`)

---

## 3. Hive Management & Monitoring (`/api/hives` & `/api/alerts`)

- **`POST /api/hives`**: Register a new hive under a parent farm (automatically increments `farms.hives_count`). (`201 Created`)
- **`GET /api/hives`**: List hives with optional `?farm_id=`, `?status=`, `?search=` filters. (`200 OK`)
- **`GET /api/hives/stats`**: Aggregated hive statistics and health distribution. (`200 OK`)
- **`GET /api/hives/:id`**: Get single hive details including latest health score. (`200 OK`)
- **`PUT /api/hives/:id`**: Update hive metadata or colony info. (`200 OK`)
- **`DELETE /api/hives/:id`**: Delete hive (decrements parent `farms.hives_count`). (`200 OK`)
- **`POST /api/hives/:id/simulate-reading`**: Ingest IoT sensor reading (temperature, humidity, weight, sound frequency, battery) with automatic 0-100 health scoring and multi-rule alert generation. (`201 Created`)
- **`GET /api/hives/:id/sensor-readings`**: List sensor history for hive. (`200 OK`)
- **`GET /api/alerts`**: List smart hive automation alerts with optional `?hive_id=`, `?severity=`, `?resolved=` filters. (`200 OK`)
- **`PATCH /api/alerts/:id/resolve`**: Mark alert resolved. (`200 OK`)

---

## 4. Honey Batches & Harvest (`/api/honey-batches`)

- **`POST /api/honey-batches`**: Create a new honey harvest batch. Auto-generates annual batch ID (`HC-2026-000001`), logs origin `HONEY_HARVESTED` traceability event, and records Genesis Block #1 in SHA-256 demo blockchain. (`201 Created`)
- **`GET /api/honey-batches`**: List batches (supports `?farm_id=`, `?hive_id=`, `?status=`, `?search=`). (`200 OK`)
- **`GET /api/honey-batches/stats`**: Batch volume and status statistics. (`200 OK`)
- **`GET /api/honey-batches/:id`**: Single batch detail view. (`200 OK`)
- **`PUT /api/honey-batches/:id`**: Update batch metadata. (`200 OK`)
- **`DELETE /api/honey-batches/:id`**: Delete batch. Blocked with `409 Conflict` if traceability events exist. (`200 OK` / `409 Conflict`)
- **`GET /api/honey-batches/:batchId/quality-tests`**: List quality tests for batch. (`200 OK`)
- **`GET /api/honey-batches/:batchId/processing-records`**: List processing records for batch. (`200 OK`)
- **`GET /api/honey-batches/:batchId/packaging-records`**: List packaging records for batch. (`200 OK`)
- **`GET /api/honey-batches/:batchId/transportation-records`**: List transportation records for batch. (`200 OK`)
- **`GET /api/honey-batches/:batchId/qr-code`**: Returns server-side generated QR Code Data URL encoding verification URL. (`200 OK` / `404` if not packaged)
- **`GET /api/honey-batches/:batchId/blockchain`**: Returns full SHA-256 demo blockchain chain and cryptographic verification status. (`200 OK`)

---

## 5. Quality Testing (`/api/quality-tests`)

- **`POST /api/quality-tests`**: Submit laboratory quality test result. Auto-calculates Grade (A, B, C, D) and updates batch status to `QUALITY_TESTING`. (`201 Created`)
- **`GET /api/quality-tests`**: List quality tests with `?batch_id=` and `?status=` filters. (`200 OK`)
- **`GET /api/quality-tests/stats`**: Aggregate quality testing statistics and average purity/moisture. (`200 OK`)
- **`GET /api/quality-tests/:id`**: Single quality test detail. (`200 OK`)
- **`PATCH /api/quality-tests/:id/approve`**: Approve quality test (transitions batch to `QUALITY_APPROVED` and records `QUALITY_APPROVED` block). (`200 OK`)
- **`PATCH /api/quality-tests/:id/reject`**: Reject quality test (transitions batch to `REJECTED` and records `QUALITY_REJECTED` block). (`200 OK`)

---

## 6. Processing Records (`/api/processing-records`)

- **`POST /api/processing-records`**: Create processing record. Requires batch to be `QUALITY_APPROVED`. (`201 Created`)
- **`GET /api/processing-records`**: List processing records. (`200 OK`)
- **`GET /api/processing-records/stats`**: Processing metrics. (`200 OK`)
- **`PATCH /api/processing-records/:id/complete`**: Mark processing completed (transitions batch to `PROCESSED` and records `PROCESSING_COMPLETED` block). (`200 OK`)

---

## 7. Packaging Records (`/api/packaging-records`)

- **`POST /api/packaging-records`**: Create packaging record. Requires batch processing `COMPLETED`. (`201 Created`)
- **`GET /api/packaging-records`**: List packaging records. (`200 OK`)
- **`GET /api/packaging-records/stats`**: Packaging volume and bottle metrics. (`200 OK`)
- **`PATCH /api/packaging-records/:id/complete`**: Mark packaging completed (sets batch `qr_code_url` to `/verify/{batch_id}`, transitions batch status to `PACKAGED`, and records `PACKAGED_COMPLETED` block). (`200 OK`)

---

## 8. Transportation Logistics (`/api/transportation-records`)

- **`POST /api/transportation-records`**: Create transport shipment. Requires batch status `PACKAGED`. (`201 Created`)
- **`GET /api/transportation-records`**: List transportation records. (`200 OK`)
- **`GET /api/transportation-records/stats`**: Transport delivery metrics. (`200 OK`)
- **`PATCH /api/transportation-records/:id/pickup`**: Mark picked up (transitions batch status to `IN_TRANSIT` and records `TRANSPORT_PICKED_UP` block). (`200 OK`)
- **`PATCH /api/transportation-records/:id/deliver`**: Mark delivered (generates `CONF-XXXXXX` confirmation code, sets location to destination, transitions batch status to `DELIVERED`, and records `TRANSPORT_DELIVERED` block). (`200 OK`)

---

## 9. Public Unauthenticated Verification (`/verify`)

- **`GET /verify/:batchId`**: **Public, zero authentication required**. Rates-limited at 100 requests/min per IP. Returns consumer-facing provenance, farm location, lab quality assessment (`data_source: "DEMO_QUALITY_RESULT"`), processing/packaging/transportation summaries, SHA-256 demo blockchain cryptographic audit (`DEMO BLOCKCHAIN VERIFIED`), and complete chronological traceability event timeline. Returns `verified: false` with clear status notice if batch has not yet reached `PACKAGED` or `DELIVERED` status. (`200 OK` / `404 Not Found` for unknown batch)

---

## Security & Authentication Notice

- **Authentication**: Authentication & User Authorization were explicitly deferred for backend hackathon scope. Endpoints currently execute without JWT token enforcement. Production readiness would require applying auth middleware (e.g. verifying `Authorization: Bearer <token>` in `auth.js`) to write endpoints (`POST`, `PUT`, `DELETE`, `PATCH`).
- **Rate Limiting**: Applied to public `/verify/:batchId` route (`createRateLimiter`).
- **Parameterized SQL**: 100% of database queries across all 9 repositories utilize parameterized queries (`?`) for SQL injection protection.
