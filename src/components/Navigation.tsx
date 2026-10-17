import React from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { translations } from '../i18n/translations';
import { 
  LayoutDashboard, 
  Timer, 
  MapPin, 
  BarChart3, 
  CheckSquare, 
  Sparkles,
  Flame,
  Volume2
} from 'lucide-react';

export type ScreenTab = 'dashboard' | 'studyRoom' | 'syllabusMap' | 'analyticsHub' | 'taskPlanner';

interface NavigationProps {
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { language, timer, ambientSound, tasks } = useStudyStore();
  const t = translations[language];

  // Count pending today's tasks
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  const navItems = [
    {
      id: 'dashboard' as ScreenTab,
      label: t.nav.dashboard,
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'studyRoom' as ScreenTab,
      label: t.nav.studyRoom,
      icon: Timer,
      badge: timer.isRunning ? 'Active' : null,
      badgeColor: 'bg-emerald-500 text-white animate-pulse',
    },
    {
      id: 'syllabusMap' as ScreenTab,
      label: t.nav.syllabusMap,
      icon: MapPin,
      badge: null,
    },
    {
      id: 'analyticsHub' as ScreenTab,
      label: t.nav.analyticsHub,
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'taskPlanner' as ScreenTab,
      label: t.nav.taskPlanner,
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : null,
      badgeColor: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 dark:border-indigo-500/40',
    },
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* DESKTOP SIDEBAR (visible on md: and larger screens)      */}
      {/* ======================================================== */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white/70 dark:bg-black/40 backdrop-blur-2xl border-r border-black/10 dark:border-white/10 shrink-0 h-[calc(100vh-61px)] sticky top-[61px] p-4 justify-between transition-colors duration-300">
        <div className="space-y-6">
          {/* Section label */}
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Core Workspaces
            </p>
            <nav className="mt-2 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30'
                        : 'text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-black/10 dark:bg-white/10 text-slate-800 dark:text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick study mini widget in sidebar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white/80 to-slate-50/60 dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-slate-900 border border-indigo-500/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                Focus Status
              </span>
              {timer.isRunning ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                  Running
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Idle</span>
              )}
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-lg font-mono-numbers font-extrabold text-slate-900 dark:text-white">
                {Math.floor(timer.timeLeft / 60)}:{(timer.timeLeft % 60).toString().padStart(2, '0')}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                {timer.mode.replace('_', ' ')}
              </span>
            </div>
            {ambientSound !== 'off' && (
              <div className="mt-2.5 pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 text-[11px] text-cyan-600 dark:text-cyan-300">
                <Volume2 className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />
                <span className="capitalize">{ambientSound} audio active</span>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-3 rounded-xl bg-slate-100/90 dark:bg-slate-900/60 border border-black/5 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium mb-1">
            <span>Studyo PWA</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">v1.2</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Offline-first SQLite/IndexedDB & Supabase Sync Engine.
          </p>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px)                  */}
      {/* ======================================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-black/60 backdrop-blur-2xl border-t border-black/10 dark:border-white/10 px-2 py-1.5 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-colors duration-300">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-indigo-600 dark:text-indigo-400' : ''}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 ring-2 ring-[#f7f5f0] dark:ring-[#000000] animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] mt-1 tracking-tight truncate max-w-[62px]">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 w-6 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
