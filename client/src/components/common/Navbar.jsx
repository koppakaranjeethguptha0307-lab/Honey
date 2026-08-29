import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useRole } from '../../context/RoleContext';
import { 
  Hexagon, Search, Shield, LayoutDashboard, MapPin, Cpu, Package, 
  Beaker, Factory, Truck, Database, Bell, Menu, X, UserCheck
} from 'lucide-react';

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole, setRoleById, ROLES } = useRole();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Farms', path: '/farms', icon: MapPin },
    { label: 'Hives', path: '/hives', icon: Cpu },
    { label: 'Batches', path: '/batches', icon: Package },
    { label: 'Quality', path: '/quality', icon: Beaker },
    { label: 'Processing', path: '/processing', icon: Factory },
    { label: 'Packaging', path: '/packaging', icon: Package },
    { label: 'Logistics', path: '/transportation', icon: Truck },
    { label: 'Blockchain', path: '/blockchain', icon: Database },
    { label: 'Alerts', path: '/alerts', icon: Bell },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/verify/${searchQuery.trim()}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-amber-500/15 bg-[#120f0d]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Hexagon className="w-5 h-5 fill-stone-950 stroke-stone-950" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-1">
                HONEY<span className="text-amber-400">CHAIN</span>
              </span>
              <span className="block text-[9px] font-mono text-stone-400 tracking-wider -mt-1">
                TRACEABILITY PLATFORM
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-stone-300 hover:text-stone-100 hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search & Demo Role Selector */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Verify Batch ID..."
                className="w-40 md:w-48 pl-8 pr-3 py-1.5 text-xs bg-stone-900/90 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition-all"
              />
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5 pointer-events-none" />
            </form>

            {/* Demo Role Context Switcher */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900 border border-stone-800">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={currentRole.id}
                onChange={(e) => setRoleById(e.target.value)}
                className="bg-transparent text-xs font-medium text-amber-300 focus:outline-none cursor-pointer"
                title="Demo Role Switcher (UI State Only)"
              >
                {Object.values(ROLES).map((role) => (
                  <option key={role.id} value={role.id} className="bg-stone-900 text-stone-200">
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-stone-300 hover:text-stone-100 hover:bg-stone-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-800 bg-[#171310] px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Verify Batch ID..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-900 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-500"
            />
            <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
          </form>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
                    isActive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-stone-300 bg-stone-900/60 hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
            <span className="text-xs text-stone-400">Demo Role:</span>
            <select
              value={currentRole.id}
              onChange={(e) => setRoleById(e.target.value)}
              className="bg-stone-900 border border-stone-800 text-xs font-medium text-amber-300 p-1.5 rounded-lg"
            >
              {Object.values(ROLES).map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
