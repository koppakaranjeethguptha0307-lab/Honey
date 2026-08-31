import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Hexagon, Lock, Mail, User, ShieldCheck, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { registerUser } from '../utils/api';
import { ErrorAlert } from '../components/common/ErrorAlert';

export function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('beekeeper');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const allowedRoles = [
    { id: 'beekeeper', label: 'Beekeeper' },
    { id: 'inspector', label: 'Quality Inspector' },
    { id: 'transporter', label: 'Transporter' },
    { id: 'customer', label: 'Public Customer' },
  ];

  const validateForm = () => {
    const errors = {};

    if (!name.trim()) {
      errors.name = 'Please enter your name.';
    } else if (name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }

    if (!email.trim()) {
      errors.email = 'Please enter your email address.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (!role) {
      errors.role = 'Please select a role.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const res = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      setIsSubmitting(false);

      if (!res.success) {
        setApiError(res.error || 'Registration failed. Please try again.');
        return;
      }

      setSuccessMessage('Account created successfully.');
      const roleSignInPath = role === 'inspector' ? '/signin/quality-inspector' : `/signin/${role}`;
      setTimeout(() => {
        navigate(roleSignInPath);
      }, 1500);
    } catch (err) {
      setIsSubmitting(false);
      setApiError('A network error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 max-w-md mx-auto flex flex-col justify-center">
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

      {/* Registration Card */}
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
          <h1 className="text-xl font-bold text-stone-100 font-['Outfit'] mt-1">Create Your Account</h1>
          <p className="text-xs text-stone-400 mt-1">Join Honey Chain and manage your honey supply chain securely.</p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successMessage} Redirecting to login...</span>
          </div>
        )}

        {/* Error Alert Display */}
        {apiError && (
          <ErrorAlert
            message={apiError}
            onRetry={() => setApiError(null)}
          />
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name Field */}
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-stone-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (validationErrors.name) setValidationErrors((prev) => ({ ...prev, name: null }));
                }}
                placeholder="John Doe"
                className={`w-full pl-9 pr-3 py-2.5 text-xs bg-stone-900/90 border rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none transition-all ${
                  validationErrors.name
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              <User className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
            </div>
            {validationErrors.name && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">{validationErrors.name}</p>
            )}
          </div>

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

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-xs font-semibold text-stone-300 mb-1.5">
              Account Role
            </label>
            <div className="relative">
              <select
                id="role"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  if (validationErrors.role) setValidationErrors((prev) => ({ ...prev, role: null }));
                }}
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-stone-900/90 border border-stone-800 rounded-xl text-stone-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
              >
                {allowedRoles.map((r) => (
                  <option key={r.id} value={r.id} className="bg-stone-900 text-stone-200">
                    {r.label}
                  </option>
                ))}
              </select>
              <ShieldCheck className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
            </div>
            {validationErrors.role && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">{validationErrors.role}</p>
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

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-stone-300 mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationErrors.confirmPassword) setValidationErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                placeholder="••••••••"
                className={`w-full pl-9 pr-10 py-2.5 text-xs bg-stone-900/90 border rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none transition-all ${
                  validationErrors.confirmPassword
                    ? 'border-rose-500 focus:ring-1 focus:ring-rose-500'
                    : 'border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500'
                }`}
              />
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 p-0.5 text-stone-400 hover:text-stone-200 focus:outline-none"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <p className="text-[11px] text-rose-400 mt-1 font-medium">{validationErrors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !!successMessage}
            className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 hover:from-amber-400 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-stone-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Login redirect link */}
        <div className="mt-6 text-center text-xs text-stone-400 pt-4 border-t border-stone-800/80">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
