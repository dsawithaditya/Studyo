import React from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { translations } from '../i18n/translations';
import { Language } from '../types';
import { Flame, Target, Maximize2, Database, Sparkles, BookOpen } from 'lucide-react';

interface NavbarProps {
  onOpenSupabaseModal: () => void;
  onOpenHalftoneShowcase?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSupabaseModal, onOpenHalftoneShowcase }) => {
  const { 
    language, 
    setLanguage, 
    user, 
    sessions, 
    zenMode, 
    setZenMode, 
    isCloudSynced 
  } = useStudyStore();
  const t = translations[language];

  // Calculate today's studied minutes
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMinutes = sessions
    .filter((s) => s.dateString === todayStr)
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const targetMinutes = user.dailyTargetMinutes || 300;
  const progressPercent = Math.min(100, Math.round((todayMinutes / targetMinutes) * 100));
  const hoursLeft = Math.max(0, ((targetMinutes - todayMinutes) / 60)).toFixed(1);

  const languages: { key: Language; label: string }[] = [
    { key: 'en', label: 'English' },
    { key: 'hinglish', label: 'Hinglish' },
    { key: 'hi', label: 'हिन्दी' },
  ];

  return (
    <header className="sticky top-0 z-40 glass-header px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo and Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                Studyo
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                PWA • Zero-Lag
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Center / Stats pills: Streak & Daily Target */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Streak pill */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 shadow-sm transition hover:bg-amber-500/15 cursor-default"
            title={`${user.streakDays} active consecutive study days`}
          >
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
            <div className="text-xs font-semibold">
              <span className="font-mono-numbers text-amber-200 font-bold">{user.streakDays}</span> {t.dashboard.streakDays}
            </div>
          </div>

          {/* Daily Target Progress Meter */}
          <div 
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 shadow-sm"
            title={`Today: ${(todayMinutes / 60).toFixed(1)} / ${(targetMinutes / 60).toFixed(1)} hours`}
          >
            <Target className="w-4 h-4 text-indigo-400" />
            <div className="text-xs">
              <span className="font-mono-numbers font-bold text-white">{(todayMinutes / 60).toFixed(1)}h</span>
              <span className="text-slate-400"> / {(targetMinutes / 60).toFixed(1)}h</span>
            </div>
            <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right side controls: Language Pill Selector, Zen Mode, Cloud Sync */}
        <div className="flex items-center gap-2">
          {/* Multilingual Selector Pill (EN / Hinglish / Hindi) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-white/10 shadow-inner">
            {languages.map((l) => (
              <button
                key={l.key}
                onClick={() => setLanguage(l.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                  language === l.key
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
                title={`Switch to ${l.label}`}
              >
                {l.key.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Halftone Showcase Switcher */}
          {onOpenHalftoneShowcase && (
            <button
              onClick={onOpenHalftoneShowcase}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold transition shadow-sm"
              title="Open Halftone Wordmark Component Showcase"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Halftone Showcase</span>
            </button>
          )}

          {/* Zen Mode Button */}
          <button
            onClick={() => setZenMode(!zenMode)}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition shadow-sm"
            title="Zen Mode (Fullscreen Focus)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Supabase Cloud Sync pill */}
          <button
            onClick={onOpenSupabaseModal}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition ${
              isCloudSynced
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700/80'
            }`}
            title="Supabase PostgreSQL & Cloud Sync Settings"
          >
            <Database className={`w-3.5 h-3.5 ${isCloudSynced ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>{isCloudSynced ? 'Synced' : 'Offline'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
