# Honey Chain 🍯⛓️

> **Blockchain-Backed End-to-End Honey Traceability & Smart Beekeeping Management Platform**

Honey Chain is an agro-tech platform combining IoT smart hive monitoring, certified laboratory quality testing, cold-chain logistics tracking, and immutable SHA-256 cryptographic blockchain audit for 100% pure honey provenance from apiary to consumer.

---

## 🌟 Key Features

- **Apiary & Farm Management:** Multi-location farm tracking, farmer metadata, and interactive Leaflet geolocation maps.
- **Smart IoT Hive Monitoring:** Real-time temperature, humidity, scale weight, bee activity tracking, and automated health score computation.
- **Automated Anomaly Alerts:** Real-time threshold breach notifications and alert management.
- **Honey Harvest Batch Tracking:** Multi-floral/monofloral batch creation with lifecycle stage tracking.
- **Certified Laboratory Quality Testing:** Purity, moisture, adulteration screening, and inspector approval workflow.
- **Cold Extraction & Micro-Filtration Processing:** Processing facility logging and stage transitions.
- **Bottling & Packaging with QR Codes:** Automated backend QR code generation linking directly to public verification identities.
- **Cold-Chain Logistics & Dispatch:** Transporter assignment, pickup logging, and delivery confirmation codes.
- **Public QR Customer Verification (`/verify/:batchId`):** Unauthenticated public customer provenance lookup with complete timeline, lab results, and origin map.
- **Demo SHA-256 Blockchain Ledger (`/blockchain`):** Cryptographic block explorer verifying hash continuity and tamper detection.

---

## 🏗️ Architecture

- **Backend:** Node.js, Express.js, SQLite (`better-sqlite3`), Helmet, CORS, Morgan, QR Code generator, SHA-256 Blockchain Engine.
- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Recharts, `react-leaflet`, `qrcode.react`, `react-router-dom`.
- **Database:** SQLite with foreign keys enabled, indexed lookups, transactional rollback safety, and configurable persistent disk support (`DB_PATH`).

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/koppakaranjeethguptha0307-lab/Honey.git
   cd Honey
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup:**
   - Backend: Copy `.env.example` to `.env` (defaults to port 5000)
   - Frontend: Copy `client/.env.example` to `client/.env` (`VITE_API_URL=http://localhost:5000`)

---

## 💻 Running Locally

1. **Start the Backend Server (Port 5000):**
   ```bash
   npm start
   # Or for development: npm run dev
   ```

2. **Start the Frontend Application (Port 3000):**
   ```bash
   cd client
   npm run dev
   ```

3. Open your browser and navigate to:
   - Frontend Web App: [http://localhost:3000](http://localhost:3000)
   - Backend API Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Testing & Verification

- **Production Build Check:**
  ```bash
  cd client && npm run build
  ```
- **Backend Audit & Regression Suite:**
  ```bash
  node scratch/audit_verification_suite.js
  ```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).