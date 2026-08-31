import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useRole } from '../context/RoleContext';

export function AccessDeniedPage() {
  const navigate = useNavigate();
  const { currentRole, user } = useRole();

  return (
    <div className="min-h-[75vh] py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto flex flex-col justify-center text-center">
      <div className="rounded-3xl glass-panel border border-rose-500/30 p-8 bg-[#14100d] shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-stone-100 font-['Outfit']">Access Denied</h1>
        <p className="text-xs text-stone-400 mt-2 leading-relaxed">
          You don't have permission to access this section.
        </p>

        {user && (
          <div className="mt-4 p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-400">
            Authenticated as <strong className="text-stone-200">{user.name || user.email}</strong> (<span className="text-amber-400 capitalize">{user.role || currentRole.id}</span>)
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-800 text-stone-200 hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 border border-stone-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <Link
            to="/dashboard"
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AccessDeniedPage;
