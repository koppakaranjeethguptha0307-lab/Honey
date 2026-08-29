import React from 'react';
import { Hexagon, Shield, Github, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-800/80 bg-[#0c0a08] text-stone-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500 text-stone-950">
                <Hexagon className="w-4 h-4 fill-stone-950" />
              </div>
              <span className="font-bold text-stone-100 text-base font-['Outfit']">
                HONEY<span className="text-amber-400">CHAIN</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              Blockchain-backed end-to-end honey traceability & smart beekeeping management system. Ensuring 100% purity from apiary to consumer.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider font-['Outfit'] mb-3">System Modules</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/farms" className="hover:text-amber-400 transition-colors">Apiary Farm Management</Link></li>
              <li><Link to="/hives" className="hover:text-amber-400 transition-colors">IoT Hive Sensors</Link></li>
              <li><Link to="/quality" className="hover:text-amber-400 transition-colors">Quality Testing & Lab</Link></li>
              <li><Link to="/processing" className="hover:text-amber-400 transition-colors">Facility Processing</Link></li>
              <li><Link to="/transportation" className="hover:text-amber-400 transition-colors">Cold Chain Logistics</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider font-['Outfit'] mb-3">Verification & Trust</h4>
            <ul className="space-y-1.5 text-xs">
              <li><Link to="/blockchain" className="hover:text-amber-400 transition-colors">SHA-256 Blockchain Audit</Link></li>
              <li><Link to="/verify/HC-2026-000001" className="hover:text-amber-400 transition-colors">Sample Customer Verification</Link></li>
              <li><Link to="/alerts" className="hover:text-amber-400 transition-colors">Smart Alert Monitor</Link></li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-stone-900 flex flex-wrap items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Honey Chain Project. Powered by SQLite & SHA-256 Demo Blockchain.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              API Status: Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
