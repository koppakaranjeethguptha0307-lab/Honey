import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hexagon, Lock, Mail, Eye, EyeOff, ArrowLeft, Loader2, Info } from 'lucide-react';
import { useRole } from '../context/RoleContext';
import { ErrorAlert } from '../components/common/ErrorAlert';

export function LoginPage() {
  const navigate = useNavigate();
  const { setRoleById } = useRole();

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    // Step 2B handling: Backend authentication endpoint is not present on server.
    // We update demo session role state via RoleContext and redirect to dashboard.
    setTimeout(() => {
      setIsSubmitting(false);
      setRoleById('admin');
      navigate('/dashboard');
    }, 600);
  };

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto flex flex-col justify-center">
      {/* Back to Home Link */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-stone-400 hover:text-amber-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Login Card */}
      <div className="rounded-3xl glass-panel border border-amber-500/20 p-6 sm:p-8 bg-[#14100d] shadow-2xl relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* Branding Header */}
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
          <h1 className="text-xl font-bold text-stone-100 font-['Outfit'] mt-1">Sign In to Your Account</h1>
          <p className="text-xs text-stone-400 mt-1">Access supply chain tracking and honey batch analytics</p>
        </div>

        {/* Step 2B Demo Access Mode Notice */}
        <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-amber-200">Demo Access Mode</span>
            <span className="text-[11px] text-amber-300/80 leading-relaxed">
              No real backend authentication endpoint exists on server. Submitting initializes demo session via RoleContext.
            </span>
          </div>
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
                  if (validationErrors.email) {
                    setValidationErrors((prev) => ({ ...prev, email: null }));
                  }
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
                  if (validationErrors.password) {
                    setValidationErrors((prev) => ({ ...prev, password: null }));
                  }
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
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
