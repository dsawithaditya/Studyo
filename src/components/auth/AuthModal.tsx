import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStudyStore } from '../../store/useStudyStore';
import { validatePasswordStrength } from '../../services/authCrypto';
import {
  X,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Mail,
  User,
  ArrowRight,
  RotateCcw,
  Check,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    authModalView,
    setAuthModalView,
    register,
    login,
    requestPasswordReset,
    resetPassword,
    pendingResetToken,
    setPendingResetToken,
    redirectAfterLogin,
    setRedirectAfterLogin,
    getLockoutStatus,
  } = useAuthStore();

  const { updateUserProfile } = useStudyStore();

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [resetTokenInput, setResetTokenInput] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [demoTokenGenerated, setDemoTokenGenerated] = useState<string | null>(null);

  // Sync pendingResetToken if present
  useEffect(() => {
    if (pendingResetToken) {
      setResetTokenInput(pendingResetToken);
    }
  }, [pendingResetToken]);

  // Reset errors when switching views
  useEffect(() => {
    setFormError(null);
    setDemoTokenGenerated(null);
  }, [authModalView]);

  if (authModalView === 'closed' || authModalView === 'profile') return null;

  const passwordStrength = validatePasswordStrength(password);
  const lockout = email ? getLockoutStatus(email) : { isLocked: false, remainingMinutes: 0 };

  // Handle Sign Up
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!termsAccepted) {
      setFormError('Please accept the Terms of Service & Privacy Policy.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const res = await register(name, email, password);
    setIsLoading(false);

    if (res.success) {
      // Synchronize with StudyStore user profile
      updateUserProfile({ name: name.trim(), email: email.trim().toLowerCase() });
    } else {
      setFormError(res.error || 'Failed to create account.');
    }
  };

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    setIsLoading(true);
    const res = await login(email, password, rememberMe);
    setIsLoading(false);

    if (res.success) {
      // Synchronize with StudyStore user profile
      const user = useAuthStore.getState().currentUser;
      if (user) {
        updateUserProfile({ name: user.name, email: user.email });
      }
    } else {
      setFormError(res.error || 'Invalid credentials.');
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    setIsLoading(true);
    const res = await requestPasswordReset(email);
    setIsLoading(false);

    if (res.success && res.token) {
      setDemoTokenGenerated(res.token);
      setPendingResetToken(res.token);
    } else if (!res.success) {
      setFormError(res.error || 'Could not process password reset request.');
    }
  };

  // Handle Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const res = await resetPassword(resetTokenInput, password);
    setIsLoading(false);

    if (res.success) {
      setPassword('');
      setConfirmPassword('');
      setResetTokenInput('');
    } else {
      setFormError(res.error || 'Failed to reset password.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="relative w-full max-w-md my-auto">
        {/* Ambient atmospheric orange glow behind the frosted glass card */}
        <div className="absolute -inset-2 bg-gradient-to-tr from-[#e9762b]/25 via-amber-500/10 to-orange-600/20 rounded-[2.5rem] blur-2xl opacity-75 pointer-events-none -z-10" />

        <div className="w-full rounded-3xl p-6 sm:p-8 glass-auth-modal shadow-2xl space-y-5 font-mono text-stone-900 dark:text-stone-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (authModalView === 'login') {
                  setAuthModalView('closed');
                  window.dispatchEvent(new CustomEvent('studyo:open-profile-modal'));
                } else {
                  setAuthModalView('login');
                }
              }}
              className="p-1.5 -ml-1 rounded-lg text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 transition cursor-pointer shrink-0 active:scale-95"
              title={authModalView === 'login' ? 'Back to profile' : 'Back to login'}
              aria-label={authModalView === 'login' ? 'Back to profile' : 'Back to login'}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#e9762b]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-extrabold tracking-wider uppercase">
                {authModalView === 'login' && 'Student Login'}
                {authModalView === 'signup' && 'Create Account'}
                {authModalView === 'forgot_password' && 'Password Recovery'}
                {authModalView === 'reset_password' && 'Set New Password'}
              </h2>
              <span className="text-[10px] text-stone-500 dark:text-slate-400">
                Studyo Offline-First Focus Engine
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAuthModalView('closed')}
            className="p-1.5 rounded-lg text-stone-400 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/10 transition cursor-pointer"
            title="Close (Esc)"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inline Error Alert */}
        {formError && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 leading-snug animate-shake"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {/* Lockout Warning */}
        {lockout.isLocked && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2.5 leading-snug">
            <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
            <span>
              Account locked due to consecutive failed attempts. Please retry in {lockout.remainingMinutes} minute(s).
            </span>
          </div>
        )}

        {/* ====================================================== */}
        {/* VIEW 1: LOGIN FORM                                     */}
        {/* ====================================================== */}
        {authModalView === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-[11px] uppercase tracking-wider font-bold text-stone-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setAuthModalView('forgot_password')}
                  className="text-[11px] text-[#e9762b] hover:underline font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-stone-400 hover:text-black dark:text-slate-400 dark:hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-[#e9762b] focus:ring-[#e9762b]"
                />
                <span className="text-stone-600 dark:text-slate-400 text-[11px]">Remember me on this browser</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || lockout.isLocked}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff5f00] to-[#e9762b] hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(233,118,43,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Register */}
            <div className="text-center pt-2 text-xs text-stone-600 dark:text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthModalView('signup')}
                className="font-bold text-[#e9762b] hover:underline cursor-pointer ml-1"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* ====================================================== */}
        {/* VIEW 2: SIGN UP FORM                                   */}
        {/* ====================================================== */}
        {authModalView === 'signup' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="reg-name" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative group">
                <User className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="reg-email" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="reg-password" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 8 chars)"
                  className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-stone-400 hover:text-black dark:text-slate-400 dark:hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Meter */}
              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-stone-500 dark:text-slate-400">Strength:</span>
                    <span className="font-bold" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden flex gap-1">
                    {[0, 1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className="h-full flex-1 rounded-full transition-colors duration-300"
                        style={{
                          backgroundColor:
                            step <= passwordStrength.score ? passwordStrength.color : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="reg-confirm" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reg-confirm"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1.5 text-stone-400 hover:text-black dark:text-slate-400 dark:hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-[#e9762b] focus:ring-[#e9762b] mt-0.5"
                />
                <span className="text-[11px] text-stone-600 dark:text-slate-400 leading-snug">
                  I agree to the <span className="text-[#e9762b] font-bold">Terms of Service</span> and acknowledge Studyo's offline-first privacy framework.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff5f00] to-[#e9762b] hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(233,118,43,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Switch to Login */}
            <div className="text-center pt-2 text-xs text-stone-600 dark:text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthModalView('login')}
                className="font-bold text-[#e9762b] hover:underline cursor-pointer ml-1"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* ====================================================== */}
        {/* VIEW 3: FORGOT PASSWORD                                */}
        {/* ====================================================== */}
        {authModalView === 'forgot_password' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
              Enter your registered student email address. We will generate a secure, 30-minute expiring recovery token to reset your password.
            </p>

            <div className="space-y-1.5">
              <label htmlFor="forgot-email" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {demoTokenGenerated && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#e9762b]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Secure Reset Token Generated</span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-slate-300">
                  Single-use token valid for 30 minutes:
                </p>
                <div className="p-2 rounded bg-black/40 border border-white/10 font-mono text-xs select-all text-[#e9762b] font-bold break-all">
                  {demoTokenGenerated}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetTokenInput(demoTokenGenerated);
                    setAuthModalView('reset_password');
                  }}
                  className="w-full py-2 rounded-lg bg-[#e9762b] hover:bg-[#ff5f00] text-black font-extrabold text-xs uppercase tracking-wider transition cursor-pointer"
                >
                  Proceed to Reset Password →
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff5f00] to-[#e9762b] hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(233,118,43,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Generating Secure Link...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Link / Token</span>
                  <KeyRound className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex justify-between items-center pt-2 text-xs">
              <button
                type="button"
                onClick={() => setAuthModalView('login')}
                className="text-stone-500 dark:text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                ← Back to Login
              </button>
              <button
                type="button"
                onClick={() => setAuthModalView('reset_password')}
                className="text-[#e9762b] hover:underline font-bold cursor-pointer"
              >
                Have a token?
              </button>
            </div>
          </form>
        )}

        {/* ====================================================== */}
        {/* VIEW 4: RESET PASSWORD                                 */}
        {/* ====================================================== */}
        {authModalView === 'reset_password' && (
          <form onSubmit={handleResetSubmit} className="space-y-3.5">
            <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed">
              Enter the recovery token and choose a new, strong password.
            </p>

            {/* Token Field */}
            <div className="space-y-1.5">
              <label htmlFor="reset-token" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Security Token
              </label>
              <div className="relative group">
                <KeyRound className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="reset-token"
                  type="text"
                  required
                  value={resetTokenInput}
                  onChange={(e) => setResetTokenInput(e.target.value)}
                  placeholder="Paste your recovery token"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="new-pass" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                New Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="new-pass"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password (min 8 chars)"
                  className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 text-stone-400 hover:text-black dark:text-slate-400 dark:hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-stone-500 dark:text-slate-400">Strength:</span>
                    <span className="font-bold" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-stone-200 dark:bg-white/10 rounded-full overflow-hidden flex gap-1">
                    {[0, 1, 2, 3].map((step) => (
                      <div
                        key={step}
                        className="h-full flex-1 rounded-full transition-colors duration-300"
                        style={{
                          backgroundColor:
                            step <= passwordStrength.score ? passwordStrength.color : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirm-new-pass" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-stone-400 dark:text-slate-500 group-focus-within:text-[#e9762b] transition-colors absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="confirm-new-pass"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-sans placeholder:text-stone-400/50 dark:placeholder:text-stone-600 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1.5 text-stone-400 hover:text-black dark:text-slate-400 dark:hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#ff5f00] to-[#e9762b] hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(233,118,43,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password</span>
                  <Check className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 text-xs">
              <button
                type="button"
                onClick={() => setAuthModalView('login')}
                className="text-stone-500 dark:text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
