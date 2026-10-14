import React, { useState, useRef, useEffect } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import {
  User,
  Settings,
  Bell,
  Download,
  RefreshCw,
  X,
  Check,
  Clock,
} from 'lucide-react';
import { SoundType } from '../services/soundSynth';

const SOUNDS: { id: SoundType; label: string }[] = [
  { id: 'off', label: 'Mute' },
  { id: 'rain', label: 'Rain' },
  { id: 'brown', label: 'Brown Noise' },
  { id: 'binaural', label: 'Binaural 40Hz' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'clock', label: 'Clock' },
];

export const ProfileDropdown: React.FC = () => {
  const {
    user,
    updateUserProfile,
    autoStartNextRound,
    setAutoStartNextRound,
    soundAlertOnFinish,
    setSoundAlertOnFinish,
    ambientSound,
    setAmbientSound,
    ambientVolume,
    setAmbientVolume,
    dailyLogs,
    tasks,
    sessions,
    loadDemoData,
    setTimerDuration,
  } = useStudyStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Profile Form state (Name only - email and 5h goal removed per user request)
  const [profileName, setProfileName] = useState(user.name || 'Alex');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // Settings Form state
  const [defaultWorkMin, setDefaultWorkMin] = useState(25);
  const [defaultShortBreakMin, setDefaultShortBreakMin] = useState(5);
  const [defaultLongBreakMin, setDefaultLongBreakMin] = useState(15);
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key to close dropdown or modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowProfileModal(false);
        setShowSettingsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync profile form when user store changes or modal opens
  useEffect(() => {
    if (showProfileModal) {
      setProfileName(user.name || 'Alex');
      setProfileSuccessMsg(false);
    }
  }, [showProfileModal, user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: profileName.trim() || 'Alex',
    });
    setProfileSuccessMsg(true);
    setTimeout(() => {
      setProfileSuccessMsg(false);
      setShowProfileModal(false);
    }, 800);
  };

  const handleSaveSettings = () => {
    setTimerDuration(defaultWorkMin * 60);
    setSettingsSuccessMsg(true);
    setTimeout(() => {
      setSettingsSuccessMsg(false);
      setShowSettingsModal(false);
    }, 700);
  };

  // Export data as JSON
  const handleExportData = () => {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      user,
      dailyLogs,
      tasks,
      sessions,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `studyo_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const initialLetter = (user.name || 'A').charAt(0).toUpperCase();

  return (
    <div className="relative inline-block font-mono" ref={dropdownRef}>
      {/* Top Right Profile Button - Only Orange Avatar Icon */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`p-1 rounded-xl transition cursor-pointer select-none border shadow-md flex items-center justify-center ${
          isOpen
            ? 'bg-[#1c1c1b] border-[#e9762b] shadow-[0_0_20px_rgba(233,118,43,0.4)] ring-1 ring-[#e9762b]'
            : 'glass-pill hover:border-white/40'
        }`}
        title="Account, Profile & Settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Orange Avatar Circle */}
        <div className="relative flex items-center justify-center">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-extrabold text-black text-xs font-mono shadow-[0_0_12px_rgba(233,118,43,0.5)] ring-1 ring-white/30">
            {initialLetter}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10b981] border-2 border-[#141413] shadow-sm" />
        </div>
      </button>

      {/* Dropdown Menu - No full-screen backdrop blur so the header bar remains completely unblurred */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2.5 w-[300px] sm:w-[320px] rounded-2xl p-3.5 z-[80] animate-in fade-in zoom-in-95 duration-150 space-y-3 glass-dropdown-menu"
          style={{
            backgroundColor: 'rgba(15, 15, 14, 0.95)',
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 1px 0 rgba(255, 255, 255, 0.28), inset 0 0 20px 0 rgba(255, 255, 255, 0.02)',
          }}
        >
          {/* User Info Header Card */}
          <div 
            className="p-3 rounded-xl shadow-inner border"
            style={{
              backgroundColor: 'rgba(26, 26, 25, 0.85)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-extrabold text-black text-sm shadow-[0_0_16px_rgba(233,118,43,0.6)] ring-1 ring-white/30 shrink-0">
                {initialLetter}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-extrabold text-white truncate tracking-wider uppercase">
                  {user.name || 'Alex'}
                </h4>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* Primary Sub Buttons */}
          <div className="space-y-2">
            {/* 1. PROFILE SUB BUTTON */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowProfileModal(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all group cursor-pointer text-left border shadow-sm hover:border-orange-500/50"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#e9762b] flex items-center justify-center border border-orange-500/35 group-hover:scale-105 group-hover:bg-[#e9762b] group-hover:text-black transition">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider block text-white group-hover:text-[#e9762b] transition">
                    PROFILE
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-200 group-hover:text-black group-hover:bg-[#e9762b] px-2.5 py-1 rounded-md bg-white/10 border border-white/15 transition font-mono">
                OPEN
              </span>
            </button>

            {/* 2. SETTINGS ("SITTING") SUB BUTTON */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowSettingsModal(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all group cursor-pointer text-left border shadow-sm hover:border-cyan-500/50"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(255, 255, 255, 0.12)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/35 group-hover:scale-105 group-hover:bg-cyan-400 group-hover:text-black transition">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider block text-white group-hover:text-cyan-400 transition">
                    SETTINGS
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-200 group-hover:text-black group-hover:bg-cyan-400 px-2.5 py-1 rounded-md bg-white/10 border border-white/15 transition font-mono">
                CONFIG
              </span>
            </button>
          </div>

          <div className="border-t border-white/10" />

          {/* Quick Direct Controls */}
          <div 
            className="p-2.5 rounded-xl border space-y-2"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-extrabold block px-1">
              QUICK TOGGLES
            </span>

            {/* Sound Alert Toggle */}
            <div className="flex items-center justify-between px-1 py-1">
              <span className="flex items-center gap-2 text-white font-medium text-xs">
                <Bell className="w-3.5 h-3.5 text-slate-300" />
                Sound Alerts
              </span>
              <button
                type="button"
                onClick={() => setSoundAlertOnFinish(!soundAlertOnFinish)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  soundAlertOnFinish ? 'bg-[#10b981]' : 'bg-white/20'
                }`}
                title="Toggle chime when timer finishes"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    soundAlertOnFinish ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto Start Next Round Toggle */}
            <div className="flex items-center justify-between px-1 py-1">
              <span className="flex items-center gap-2 text-white font-medium text-xs">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                Auto-Start Breaks
              </span>
              <button
                type="button"
                onClick={() => setAutoStartNextRound(!autoStartNextRound)}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                  autoStartNextRound ? 'bg-[#10b981]' : 'bg-white/20'
                }`}
                title="Automatically start break after timer"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${
                    autoStartNextRound ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* Bottom Actions */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={handleExportData}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-slate-200 hover:text-white text-xs font-bold uppercase transition border cursor-pointer shadow-sm hover:bg-white/10"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                borderColor: 'rgba(255, 255, 255, 0.15)',
              }}
              title="Download backup file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT BACKUP</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DEDICATED PROFILE MODAL                                                */}
      {/* ========================================================================= */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.95)] border space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(18, 18, 17, 0.96)',
              backdropFilter: 'blur(36px)',
              WebkitBackdropFilter: 'blur(36px)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#e9762b]/20 text-[#e9762b] flex items-center justify-center border border-[#e9762b]/40">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    USER PROFILE
                  </h3>
                  <span className="text-[11px] text-slate-300 block">
                    Personal profile &amp; study achievements
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Overview Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] uppercase text-slate-300 font-bold block mb-1">
                  CURRENT STREAK
                </span>
                <span className="text-lg font-extrabold text-[#e9762b]">
                  {user.streakDays || 14}d
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] uppercase text-slate-300 font-bold block mb-1">
                  BEST STREAK
                </span>
                <span className="text-lg font-extrabold text-amber-400">
                  {user.longestStreak || 21}d
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] uppercase text-slate-300 font-bold block mb-1">
                  DAYS LOGGED
                </span>
                <span className="text-lg font-extrabold text-[#10b981]">
                  {dailyLogs.length}
                </span>
              </div>
            </div>

            {/* Edit Form - Name only */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-slate-300 font-bold block">
                  STUDENT NAME
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  required
                />
              </div>

              {/* Success Notification */}
              {profileSuccessMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2 font-bold animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c1b] border border-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#e9762b] text-black font-extrabold text-xs font-mono uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/25"
                >
                  SAVE PROFILE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED SETTINGS ("SITTING") MODAL                                   */}
      {/* ========================================================================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.95)] border space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'rgba(18, 18, 17, 0.96)',
              backdropFilter: 'blur(36px)',
              WebkitBackdropFilter: 'blur(36px)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    APP SETTINGS
                  </h3>
                  <span className="text-[11px] text-slate-300 block">
                    Timer durations, sound preferences &amp; storage
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Section 1: Timer Durations */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  DEFAULT TIMER DURATIONS
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 uppercase font-bold block">
                      WORK (MIN)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={defaultWorkMin}
                      onChange={(e) => setDefaultWorkMin(Number(e.target.value) || 25)}
                      className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-center text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 uppercase font-bold block">
                      SHORT BREAK
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={defaultShortBreakMin}
                      onChange={(e) => setDefaultShortBreakMin(Number(e.target.value) || 5)}
                      className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-center text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-300 uppercase font-bold block">
                      LONG BREAK
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={defaultLongBreakMin}
                      onChange={(e) => setDefaultLongBreakMin(Number(e.target.value) || 15)}
                      className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-center text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Audio & Ambience */}
              <div className="space-y-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold block">
                  AUDIO &amp; SOUND PREFERENCES
                </span>

                {/* Sound alert finish */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-bold block text-xs">Session Chime Alert</span>
                    <span className="text-[11px] text-slate-300">Play pleasant tone when countdown hits 0</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSoundAlertOnFinish(!soundAlertOnFinish)}
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                      soundAlertOnFinish ? 'bg-[#10b981]' : 'bg-white/20'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        soundAlertOnFinish ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Ambient Sound Selector */}
                <div className="space-y-1.5 pt-2 border-t border-white/5">
                  <label className="text-[10px] text-slate-300 uppercase font-bold block">
                    AMBIENT BACKGROUND AUDIO
                  </label>
                  <select
                    value={ambientSound}
                    onChange={(e) => setAmbientSound(e.target.value as SoundType)}
                    className="w-full glass-input rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    {SOUNDS.map((s) => (
                      <option key={s.id} value={s.id} className="bg-[#141413] text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ambient Volume Slider */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[10px] text-slate-300 font-bold">
                    <span>AMBIENT VOLUME</span>
                    <span>{Math.round((ambientVolume || 0.4) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={ambientVolume || 0.4}
                    onChange={(e) => setAmbientVolume(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              {/* Section 3: Data & Diagnostics */}
              <div className="space-y-2 p-3.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-slate-300 font-bold block">
                  STORAGE &amp; DATA BACKUP
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase transition border border-white/15 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORT JSON</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Reset local demo records with rich sample data?')) {
                        loadDemoData();
                        setShowSettingsModal(false);
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase transition border border-red-500/20 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>RESET DEMO DATA</span>
                  </button>
                </div>
              </div>

              {/* Section 4: Keyboard Shortcuts Cheatsheet */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 space-y-1.5">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">
                  KEYBOARD SHORTCUTS
                </span>
                <div className="flex justify-between">
                  <span>Start / Pause Timer</span>
                  <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded text-[10px] border border-white/10">Space</span>
                </div>
                <div className="flex justify-between">
                  <span>Fullscreen Focus Mode</span>
                  <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded text-[10px] border border-white/10">Z</span>
                </div>
                <div className="flex justify-between">
                  <span>Close Dialogs / Popups</span>
                  <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded text-[10px] border border-white/10">Esc</span>
                </div>
              </div>
            </div>

            {/* Success Notification */}
            {settingsSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-center gap-2 font-bold animate-in fade-in">
                <Check className="w-4 h-4" />
                <span>Settings applied!</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1c1c1b] border border-white/10 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                CLOSE
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-extrabold text-xs font-mono uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-cyan-500/25"
              >
                APPLY SETTINGS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
