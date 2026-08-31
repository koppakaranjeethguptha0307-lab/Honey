import React from 'react';
import { Link } from 'react-router-dom';
import { Hexagon, MapPin, Beaker, Truck, User, ArrowLeft, ArrowRight } from 'lucide-react';

export function RoleChooserPage() {
  const roles = [
    {
      id: 'beekeeper',
      title: 'Beekeeper',
      heading: 'BEEKEEPER SIGN IN',
      description: 'Manage apiaries, hive sensors, colony health, and honey harvests.',
      path: '/signin/beekeeper',
      icon: MapPin,
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-500 text-amber-400',
    },
    {
      id: 'inspector',
      title: 'Quality Inspector',
      heading: 'QUALITY INSPECTOR SIGN IN',
      description: 'Inspect honey batch purity, moisture levels, adulteration, and issue approvals.',
      path: '/signin/quality-inspector',
      icon: Beaker,
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-500 text-blue-400',
    },
    {
      id: 'transporter',
      title: 'Transporter',
      heading: 'TRANSPORTER SIGN IN',
      description: 'Track honey batch logistics, manage pickups, in-transit updates, and delivery confirmation.',
      path: '/signin/transporter',
      icon: Truck,
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-500 text-emerald-400',
    },
    {
      id: 'customer',
      title: 'Customer',
      heading: 'CUSTOMER SIGN IN',
      description: 'Explore honey supply chain transparency, batch provenance, and verification history.',
      path: '/signin/customer',
      icon: User,
      color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 hover:border-purple-500 text-purple-400',
    },
  ];

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col justify-center">
      {/* Back to Home */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-amber-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-stone-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Hexagon className="w-6 h-6 fill-stone-950 stroke-stone-950" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-xl text-stone-100 font-['Outfit'] tracking-tight flex items-center gap-1">
              HONEY<span className="text-amber-400">CHAIN</span>
            </span>
            <span className="block text-[9px] font-mono text-stone-400 tracking-wider -mt-1">
              TRACEABILITY PLATFORM
            </span>
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-stone-100 font-['Outfit'] mt-2">Choose Your Account Type</h1>
        <p className="text-xs text-stone-400 mt-1">Select your designated role portal to access real supply-chain functionality</p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Link
              key={role.id}
              to={role.path}
              className={`p-6 rounded-2xl bg-gradient-to-br bg-[#14100d] border transition-all duration-200 group flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 ${role.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300">
                    {role.title}
                  </span>
                </div>
                <h2 className="text-base font-bold text-stone-100 font-['Outfit'] group-hover:text-amber-400 transition-colors">
                  {role.heading}
                </h2>
                <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                  {role.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between text-xs font-semibold text-stone-300 group-hover:text-stone-100">
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Register Footer */}
      <div className="mt-8 text-center text-xs text-stone-400">
        Don't have an account yet?{' '}
        <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4">
          Create New Account
        </Link>
      </div>
    </div>
  );
}

export default RoleChooserPage;
