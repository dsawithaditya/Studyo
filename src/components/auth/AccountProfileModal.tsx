import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useStudyStore } from '../../store/useStudyStore';
import { validatePasswordStrength } from '../../services/authCrypto';
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  RotateCcw,
  LogOut,
  Calendar,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export const AccountProfileModal: React.FC = () => {
  const {
    currentUser,
    authModalView,
    setAuthModalView,
    updateProfile,
    changePassword,
    openLogoutModal,
  } = useAuthStore();

  const { updateUserProfile } = useStudyStore();

  // Profile fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // States
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  if (authModalView !== 'profile' || !currentUser) return null;

  const passwordStrength = validatePasswordStrength(newPassword);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsLoading(true);

    const res = await updateProfile(name, email);
    setIsLoading(false);

    if (res.success) {
      updateUserProfile({ name: name.trim(), email: email.trim().toLowerCase() });
      setProfileMsg({ type: 'success', text: 'Profile changes saved successfully!' });
      setTimeout(() => setProfileMsg(null), 3000);
    } else {
      setProfileMsg({ type: 'error', text: res.error || 'Failed to update profile.' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsLoading(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Password successfully changed!' });
      setTimeout(() => setPasswordMsg(null), 3000);
    } else {
      setPasswordMsg({ type: 'error', text: res.error || 'Failed to update password.' });
    }
  };

  const handleLogoutClick = () => {
    setAuthModalView('closed');
    openLogoutModal();
  };

  const handleBackClick = () => {
    setAuthModalView('closed');
    window.dispatchEvent(new CustomEvent('studyo:open-profile-modal'));
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto font-mono"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleBackClick();
        }
      }}
    >
      <div 
        className="w-full max-w-lg my-auto rounded-3xl p-6 sm:p-8 glass-modal shadow-2xl space-y-5 font-mono text-stone-900 dark:text-stone-100 border border-orange-500/20 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleBackClick}
              className="p-1.5 -ml-1 rounded-lg text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 transition cursor-pointer shrink-0 active:scale-95"
              title="Go back to profile"
              aria-label="Go back to profile"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-extrabold text-black text-sm shadow-[0_0_15px_rgba(233,118,43,0.5)]">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 id="account-modal-title" className="text-base font-extrabold tracking-tight uppercase">
                {currentUser.name}
              </h2>
              <span className="text-[11px] text-stone-500 dark:text-slate-400">
                {currentUser.email}
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

        {/* Tab Switcher: Details vs Security */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-stone-200/60 dark:bg-white/5 border border-stone-300/80 dark:border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-2 rounded-lg font-bold uppercase transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'details'
                ? 'bg-[#e9762b] text-black shadow-sm font-extrabold'
                : 'text-stone-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 rounded-lg font-bold uppercase transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'security'
                ? 'bg-[#e9762b] text-black shadow-sm font-extrabold'
                : 'text-stone-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: PROFILE DETAILS                                   */}
        {/* ======================================================== */}
        {activeTab === 'details' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {profileMsg && (
              <div
                role="alert"
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 leading-snug ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {profileMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="account-name" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="account-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="account-email" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="account-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Account Metadata Cards */}
            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200/80 dark:border-white/5 space-y-0.5">
                <span className="text-[10px] text-stone-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-[#e9762b]" /> Member Since
                </span>
                <span className="font-extrabold text-stone-900 dark:text-white text-xs block">
                  {new Date(currentUser.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-stone-100 dark:bg-white/5 border border-stone-200/80 dark:border-white/5 space-y-0.5">
                <span className="text-[10px] text-stone-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Security
                </span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs block">
                  PBKDF2 SHA-256
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#e9762b] hover:bg-[#ff5f00] text-black font-extrabold text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogoutClick}
                className="px-4 py-2.5 rounded-xl glass-pill text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600/80 border-rose-500/30 font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                title="Log out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CHANGE PASSWORD                                   */}
        {/* ======================================================== */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
            {passwordMsg && (
              <div
                role="alert"
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 leading-snug ${
                  passwordMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {passwordMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            {/* Current Password */}
            <div className="space-y-1.5">
              <label htmlFor="curr-pass" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Current Password
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="curr-pass"
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="p-1.5 text-stone-400 hover:text-black dark:text-slate-400 dark:hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="profile-new-pass" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-new-pass"
                  type={showNewPass ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, numbers & uppercase"
                  className="w-full glass-input rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="p-1.5 text-stone-400 hover:text-black dark:text-slate-400 dark:hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {newPassword.length > 0 && (
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
              <label htmlFor="profile-confirm-pass" className="text-[11px] uppercase tracking-wider font-bold block text-stone-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="profile-confirm-pass"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-mono focus:outline-none"
                />
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
                  <span>Updating Security Credentials...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
