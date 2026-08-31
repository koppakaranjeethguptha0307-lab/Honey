import React, { useState } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { Hexagon, Lock, Mail, Eye, EyeOff, ArrowLeft, Loader2, MapPin, Beaker, Truck, User, ShieldAlert } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { loginUser } from '../utils/api';
import { ErrorAlert } from '../components/common/ErrorAlert';

const ROLE_CONFIGS = {
  beekeeper: {
    id: 'beekeeper',
    heading: 'BEEKEEPER SIGN IN',
    subtitle: 'Access apiary analytics, hives, sensors, and honey harvest records.',
    icon: MapPin,
    redirectPath: '/farms',
    accentColor: 'text-amber-400',
  },
  'quality-inspector': {
    id: 'inspector',
    heading: 'QUALITY INSPECTOR SIGN IN',
    subtitle: 'Conduct purity testing, moisture analysis, and issue batch lab approvals.',
    icon: Beaker,
    redirectPath: '/quality',
    accentColor: 'text-blue-400',
  },
  inspector: {
    id: 'inspector',
    heading: 'QUALITY INSPECTOR SIGN IN',
    subtitle: 'Conduct purity testing, moisture analysis, and issue batch lab approvals.',
    icon: Beaker,
    redirectPath: '/quality',
    accentColor: 'text-blue-400',
  },
  transporter: {
    id: 'transporter',
    heading: 'TRANSPORTER SIGN IN',
    subtitle: 'Manage batch pickups, transit updates, and delivery confirmations.',
    icon: Truck,
    redirectPath: '/transportation',
    accentColor: 'text-emerald-400',
  },
  customer: {
    id: 'customer',
    heading: 'CUSTOMER SIGN IN',
    subtitle: 'Explore honey batch transparency and verified supply chain records.',
    icon: User,
    redirectPath: '/dashboard',
    accentColor: 'text-purple-400',
  },
};

export function RoleLoginPage({ roleKey: defaultRoleKey }) {
  const navigate = useNavigate();
  const params = useParams();
  const { loginAuth } = useRole();

  const roleParam = params.roleId || defaultRoleKey || 'beekeeper';
  const roleConfig = ROLE_CONFIGS[roleParam] || ROLE_CONFIGS.beekeeper;
  const RoleIcon = roleConfig.icon;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const validateForm = () => {
    const errors = {};

    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      errors.password = 'Please enter your password.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Pass expected_role to enforce backend role matching
      const res = await loginUser({
        email: email.trim(),
        password,
        expected_role: roleConfig.id,
      });

      setIsSubmitting(false);

      if (!res.success) {
        setApiError(res.error || 'Sign in failed. Please check credentials.');
        return;
      }

      loginAuth(res.user, res.token);

      // Redirect into existing role-specific page
      navigate(roleConfig.redirectPath);
    } catch (err) {
      setIsSubmitting(false);
      setApiError('A network error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto flex flex-col justify-center">
      {/* Back Link */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/signin"
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-amber-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Change Role Portal</span>
        </Link>
        <Link
          to="/"
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          Home
        </Link>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl glass-panel border border-amber-500/20 p-6 sm:p-8 bg-[#14100d] shadow-2xl relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Branding & Role Header */}
        <div className="text-center mb-6">
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

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-mono font-semibold text-stone-300 mt-2 mb-2">
            <RoleIcon className={`w-3.5 h-3.5 ${roleConfig.accentColor}`} />
            <span>{roleConfig.heading}</span>
          </div>

          <p className="text-xs text-stone-400 leading-relaxed max-w-xs mx-auto">{roleConfig.subtitle}</p>
        </div>

        {/* Error Alert Display */}
        {apiError && (
          <ErrorAlert
            message={apiError}
            onRetry={() => setApiError(null)}
          />
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-stone-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validationErrors.email) setValidationErrors((prev) => ({ ...prev, email: null }));
                }}
                placeholder="name@example.com"
                className={`w-full pl-9 pr-3 py-2.5 text-xs bg-stone-900/90 border rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none transition-all ${
                  validationErrors.email
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
            </div>
            {validationErrors.email && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">{validationErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-stone-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) setValidationErrors((prev) => ({ ...prev, password: null }));
                }}
                placeholder="••••••••"
                className={`w-full pl-9 pr-10 py-2.5 text-xs bg-stone-900/90 border rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none transition-all ${
                  validationErrors.password
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-0.5 text-stone-400 hover:text-stone-200 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {validationErrors.password && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">{validationErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                <span>Verifying Access...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Links Footer */}
        <div className="mt-6 text-center text-xs text-stone-400 pt-4 border-t border-stone-800/80 space-y-2">
          <div>
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4">
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleLoginPage;
