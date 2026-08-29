import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RoleProvider } from './context/RoleContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { FarmsPage } from './pages/FarmsPage';
import { HivesPage } from './pages/HivesPage';
import { SensorsPage } from './pages/SensorsPage';
import { AlertsPage } from './pages/AlertsPage';
import { BatchesPage } from './pages/BatchesPage';
import { QualityPage } from './pages/QualityPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { PackagingPage } from './pages/PackagingPage';
import { TransportationPage } from './pages/TransportationPage';
import { PublicVerifyPage } from './pages/PublicVerifyPage';
import { BlockchainPage } from './pages/BlockchainPage';

export function App() {
  return (
    <RoleProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="flex flex-col min-h-screen bg-[#0f0d0b] text-stone-100 font-['Plus_Jakarta_Sans']">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/farms" element={<FarmsPage />} />
              <Route path="/hives" element={<HivesPage />} />
              <Route path="/sensors" element={<SensorsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/batches" element={<BatchesPage />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/processing" element={<ProcessingPage />} />
              <Route path="/packaging" element={<PackagingPage />} />
              <Route path="/transportation" element={<TransportationPage />} />
              <Route path="/verify/:batchId" element={<PublicVerifyPage />} />
              <Route path="/blockchain" element={<BlockchainPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </RoleProvider>
  );
}

export default App;
