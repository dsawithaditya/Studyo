import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useStudyStore } from '../store/useStudyStore';
import {
  User,
  Users,
  Settings,
  Bell,
  Download,
  RefreshCw,
  RotateCcw,
  Copy,
  Sparkles,
  X,
  Check,
  Clock,
  StickyNote,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Table2,
  Sliders,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundType } from '../services/soundSynth';
import { ThemeSwitch } from './ThemeSwitch';
import { ExportConfirmModal } from './ExportConfirmModal';
import { useAuthStore } from '../store/useAuthStore';
import {
  LogIn,
  LogOut,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';

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
    theme,
    user,
    timer,
    updateUserProfile,
    autoStartNextRound,
    setAutoStartNextRound,
    soundAlertOnFinish,
    setSoundAlertOnFinish,
    showFinishButton,
    setShowFinishButton,
    enableQuickScratchpad,
    setEnableQuickScratchpad,
    ambientSound,
    setAmbientSound,
    ambientVolume,
    setAmbientVolume,
    dailyLogs,
    tasks,
    sessions,
    clearUserData,
    setTimerDuration,
    updateProfileMetricSlot,
    setCustomWordmarkText,
    customTables,
    activeTableId,
    setActiveTableId,
    updateCustomTable,
    deleteCustomTable,
    generateNewFriendCode,
  } = useStudyStore();

  const { currentUser, setAuthModalView, openLogoutModal, updateProfile } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTableSettingsModal, setShowTableSettingsModal] = useState(false);
  const [showExportConfirmModal, setShowExportConfirmModal] = useState(false);
  const [exportSource, setExportSource] = useState<'dropdown' | 'settings'>('dropdown');

  // Settings tab navigation: 'all' | 'network' | 'tables' | 'general' | 'study' | 'audio'
  const [settingsTab, setSettingsTab] = useState<'all' | 'network' | 'tables' | 'general' | 'study' | 'audio'>('all');
  const [copiedSettingCode, setCopiedSettingCode] = useState(false);
  const [regenerateSuccessMsg, setRegenerateSuccessMsg] = useState<string | null>(null);

  // Scroll ref for horizontal tabs slider
  const settingsTabsRef = useRef<HTMLDivElement>(null);
  const scrollSettingsTabs = (direction: 'left' | 'right') => {
    if (settingsTabsRef.current) {
      const scrollAmount = direction === 'left' ? -130 : 130;
      settingsTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Profile Form state (Name only - email and 5h goal removed per user request)
  const [profileName, setProfileName] = useState(user.name || 'Alex');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  // Table Settings state
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [editTableTitle, setEditTableTitle] = useState('');
  const [editTableDesc, setEditTableDesc] = useState('');
  const [tableSettingsSuccessMsg, setTableSettingsSuccessMsg] = useState(false);

  // Settings Form state
  const isDark = theme === 'dark';
  const [defaultWorkMin, setDefaultWorkMin] = useState(25);
  const [defaultShortBreakMin, setDefaultShortBreakMin] = useState(5);
  const [defaultLongBreakMin, setDefaultLongBreakMin] = useState(15);
  const [customWordmarkInput, setCustomWordmarkInput] = useState((user.customWordmarkText || 'studyo').slice(0, 12));
  const [settingsSuccessMsg, setSettingsSuccessMsg] = useState(false);

  // Compute metrics from Analysis tab for customizable profile cards
  const analysisMetrics = useMemo(() => {
    const logs = Array.isArray(dailyLogs) && dailyLogs.length > 0 ? dailyLogs : [];

    // Streak calculation
    const sortedDates = [...new Set(logs.map((l) => l.date))].sort().reverse();
    const d = new Date();
    const today = d.toISOString().split('T')[0];
    d.setDate(d.getDate() - 1);
    const yest = d.toISOString().split('T')[0];
    const checkDate = sortedDates.includes(today) ? new Date() : sortedDates.includes(yest) ? d : null;
    let computedStreak = 0;
    if (checkDate) {
      while (true) {
        const ds = checkDate.toISOString().split('T')[0];
        if (sortedDates.includes(ds)) {
          computedStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    const currentStreakVal = `${user.streakDays || computedStreak || 14}d`;
    const bestStreakVal = `${user.longestStreak || Math.max(21, user.streakDays || 0)}d`;
    const daysLoggedVal = `${logs.length}`;

    // Total hours
    const totalHours = logs.reduce((acc, l) => acc + (Number(l.studyHours) || 0), 0);
    const totalHoursVal = `${totalHours.toFixed(1)}h`;

    // 7-day and 30-day hours
    const now = new Date();
    const past7Str = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const past30Str = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];

    const weekHours = logs
      .filter((l) => l.date >= past7Str)
      .reduce((acc, l) => acc + (Number(l.studyHours) || 0), 0);
    const monthHours = logs
      .filter((l) => l.date >= past30Str)
      .reduce((acc, l) => acc + (Number(l.studyHours) || 0), 0);

    // Focus
    const logsWithFocus = logs.filter((l) => l.focusRating && Number(l.focusRating) > 0);
    const avgFocus = logsWithFocus.length
      ? (logsWithFocus.reduce((acc, l) => acc + (Number(l.focusRating) || 0), 0) / logsWithFocus.length).toFixed(1)
      : '5.0';

    // Habit %
    const totalDays = logs.length || 1;
    const revisionPct = Math.round((logs.filter((l) => l.revisionDone).length / totalDays) * 100);
    const classPct = Math.round((logs.filter((l) => l.attendedClass).length / totalDays) * 100);
    const mockPct = Math.round((logs.filter((l) => l.mockTestTaken).length / totalDays) * 100);
    const pyqPct = Math.round((logs.filter((l) => (l.pyqsSolved ?? 0) > 0).length / totalDays) * 100);
    const totalPyqs = logs.reduce((acc, l) => acc + (Number(l.pyqsSolved) || 0), 0);

    return {
      currentStreak: { label: 'CURRENT STREAK', value: currentStreakVal, color: 'text-[#e9762b]' },
      bestStreak: { label: 'BEST STREAK', value: bestStreakVal, color: 'text-amber-400' },
      daysLogged: { label: 'DAYS LOGGED', value: daysLoggedVal, color: 'text-[#10b981]' },
      totalHours: { label: 'TOTAL HOURS', value: totalHoursVal, color: 'text-sky-400' },
      weekHours: { label: '7-DAY HOURS', value: `${weekHours.toFixed(1)}h`, color: 'text-orange-400' },
      monthHours: { label: '30-DAY HOURS', value: `${monthHours.toFixed(1)}h`, color: 'text-purple-400' },
      avgFocus: { label: 'AVG FOCUS', value: `${avgFocus}/5`, color: 'text-yellow-400' },
      revisionRate: { label: 'REVISION', value: `${revisionPct}%`, color: 'text-emerald-400' },
      classRate: { label: 'CLASS RATE', value: `${classPct}%`, color: 'text-blue-400' },
      mockRate: { label: 'MOCK RATE', value: `${mockPct}%`, color: 'text-violet-400' },
      pyqRate: { label: 'PYQ HABIT', value: `${pyqPct}%`, color: 'text-teal-400' },
      totalPyqs: { label: 'TOTAL PYQS', value: `${totalPyqs}`, color: 'text-rose-400' },
    } as Record<string, { label: string; value: string; color: string }>;
  }, [dailyLogs, user]);

  const METRIC_OPTIONS = [
    { key: 'currentStreak', label: 'Current Streak' },
    { key: 'bestStreak', label: 'Best Streak' },
    { key: 'daysLogged', label: 'Days Logged' },
    { key: 'totalHours', label: 'Total Hours' },
    { key: 'weekHours', label: '7-Day Hours' },
    { key: 'monthHours', label: '30-Day Hours' },
    { key: 'avgFocus', label: 'Avg Focus' },
    { key: 'revisionRate', label: 'Revision Rate' },
    { key: 'classRate', label: 'Class Rate' },
    { key: 'mockRate', label: 'Mock Test Rate' },
    { key: 'pyqRate', label: 'PYQ Habit Rate' },
    { key: 'totalPyqs', label: 'Total PYQs' },
  ];

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
        setShowTableSettingsModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for external requests to reopen Profile Modal (e.g. from AccountProfileModal back button)
  useEffect(() => {
    const handleOpenProfileModal = () => {
      setShowSettingsModal(false);
      setShowTableSettingsModal(false);
      setShowProfileModal(true);
    };
    window.addEventListener('studyo:open-profile-modal', handleOpenProfileModal);
    return () => window.removeEventListener('studyo:open-profile-modal', handleOpenProfileModal);
  }, []);

  // Compute active custom table for Table Settings modal
  const activeCustomTable = useMemo(() => {
    const list = customTables || [];
    if (selectedTableId) {
      const found = list.find((t) => t.id === selectedTableId);
      if (found) return found;
    }
    if (activeTableId && activeTableId !== 'main') {
      const found = list.find((t) => t.id === activeTableId);
      if (found) return found;
    }
    return list[0] || null;
  }, [customTables, selectedTableId, activeTableId]);

  // Sync selected table fields when table changes
  useEffect(() => {
    if (activeCustomTable) {
      if (!selectedTableId || selectedTableId !== activeCustomTable.id) {
        setSelectedTableId(activeCustomTable.id);
      }
      setEditTableTitle(activeCustomTable.title || '');
      setEditTableDesc(activeCustomTable.description || '');
      setTableSettingsSuccessMsg(false);
    }
  }, [activeCustomTable, showTableSettingsModal]);

  const handleSelectTableToEdit = (tableId: string) => {
    setSelectedTableId(tableId);
    const target = (customTables || []).find((t) => t.id === tableId);
    if (target) {
      setEditTableTitle(target.title || '');
      setEditTableDesc(target.description || '');
      setTableSettingsSuccessMsg(false);
    }
  };

  const handleSaveTableSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedTableId) return;
    updateCustomTable(selectedTableId, {
      title: editTableTitle.trim() || 'Untitled Study Table',
      description: editTableDesc.trim(),
    });
    setTableSettingsSuccessMsg(true);
    setTimeout(() => {
      setTableSettingsSuccessMsg(false);
    }, 1200);
  };

  const handleDeleteSelectedTable = () => {
    if (!selectedTableId) return;
    const target = (customTables || []).find((t) => t.id === selectedTableId);
    const title = target?.title || 'this study table';
    if (window.confirm(`Are you sure you want to delete "${title}" and all its recorded data? This action cannot be undone.`)) {
      deleteCustomTable(selectedTableId);
      const remaining = (customTables || []).filter((t) => t.id !== selectedTableId);
      if (remaining.length > 0) {
        handleSelectTableToEdit(remaining[0].id);
      } else {
        setSelectedTableId('');
        setShowTableSettingsModal(false);
      }
    }
  };

  // Sync profile form when user store changes or modal opens
  useEffect(() => {
    if (showProfileModal) {
      setProfileName(user.name || 'Alex');
      setProfileSuccessMsg(false);
    }
  }, [showProfileModal, user]);

  // Sync settings form when settings modal opens
  useEffect(() => {
    if (showSettingsModal) {
      const currentWorkMins = Math.round((timer.initialDuration || 25 * 60) / 60);
      setDefaultWorkMin(currentWorkMins > 0 ? currentWorkMins : 25);
      setCustomWordmarkInput((user.customWordmarkText || 'studyo').slice(0, 12));
      setSettingsSuccessMsg(false);
    }
  }, [showSettingsModal, timer.initialDuration, user.customWordmarkText]);

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = profileName.trim() || user.name || 'Alex';
    updateUserProfile({
      name: finalName,
    });
    if (currentUser && currentUser.name !== finalName) {
      updateProfile(finalName, currentUser.email);
    }
    setProfileSuccessMsg(true);
    setTimeout(() => {
      setProfileSuccessMsg(false);
    }, 1500);
  };

  const handleAutoSaveName = () => {
    const trimmed = profileName.trim();
    if (trimmed && trimmed !== (user.name || 'Alex')) {
      handleSaveProfile();
    }
  };

  const handleCloseProfileModal = () => {
    handleAutoSaveName();
    setShowProfileModal(false);
  };

  const handleSaveSettings = () => {
    setTimerDuration(defaultWorkMin * 60);
    setCustomWordmarkText(customWordmarkInput.trim().slice(0, 12) || 'studyo');
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
      {/* Top Right Profile Button - Only Orange Avatar Icon (Seamless circle, zero black ring) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-all duration-200 cursor-pointer select-none flex items-center justify-center relative ${
          isOpen
            ? 'ring-2 ring-[#e9762b] shadow-[0_0_20px_rgba(233,118,43,0.45)]'
            : 'hover:ring-2 hover:ring-[#e9762b]/40 shadow-sm'
        }`}
        title="Account, Profile & Settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Orange Avatar Circle */}
        <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-extrabold text-black text-xs sm:text-sm font-mono shadow-[0_0_12px_rgba(233,118,43,0.5)] ring-1 ring-white/30">
          {initialLetter}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10b981] border-2 border-[#fae8dc] dark:border-[#141413] shadow-sm" />
      </button>

      {/* Dropdown Menu - No full-screen backdrop blur so the header bar remains completely unblurred */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2.5 w-[300px] sm:w-[320px] rounded-2xl p-3.5 z-[80] animate-in fade-in zoom-in-95 duration-150 space-y-3 glass-dropdown-menu"
          style={{
            backgroundColor: isDark ? 'rgba(15, 15, 14, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(36px) saturate(200%)',
            WebkitBackdropFilter: 'blur(36px) saturate(200%)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(0, 0, 0, 0.12)',
            boxShadow: isDark
              ? '0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 1px 0 rgba(255, 255, 255, 0.28), inset 0 0 20px 0 rgba(255, 255, 255, 0.02)'
              : '0 30px 80px rgba(0, 0, 0, 0.12), inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), inset 0 0 20px 0 rgba(0, 0, 0, 0.02)',
          }}
        >
          {/* User Info Header Card */}
          {/* User Info Header Card */}
          <div 
            className="p-3 rounded-xl shadow-inner border"
            style={{
              backgroundColor: isDark ? 'rgba(26, 26, 25, 0.85)' : 'rgba(240, 237, 230, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-extrabold text-black text-sm shadow-[0_0_16px_rgba(233,118,43,0.6)] ring-1 ring-white/30 shrink-0">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : initialLetter}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-sm font-extrabold text-stone-900 dark:text-white truncate tracking-wider uppercase">
                    {currentUser?.name || user.name || 'Alex'}
                  </h4>
                  {currentUser ? (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                      ONLINE
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                      GUEST
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {currentUser?.email ? (
                    <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono truncate">
                      {currentUser.email}
                    </span>
                  ) : (
                    <>
                      <span className="text-[10px] text-stone-500 dark:text-slate-400 uppercase tracking-widest font-mono">CODE:</span>
                      <span className="text-[11px] font-bold text-[#e9762b] font-mono select-all">
                        {user.friendCode || 'A9X4K'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 dark:border-white/10" />

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
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#e9762b] flex items-center justify-center border border-orange-500/35 group-hover:scale-105 group-hover:bg-[#e9762b] group-hover:text-black transition">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider block text-stone-900 dark:text-white group-hover:text-[#e9762b] transition">
                    PROFILE
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-stone-700 dark:text-slate-200 group-hover:text-black group-hover:bg-[#e9762b] px-2.5 py-1 rounded-md bg-stone-200/80 dark:bg-white/10 border border-stone-300 dark:border-white/15 transition font-mono">
                Open
              </span>
            </button>

            {/* 2. SETTINGS SUB BUTTON */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSettingsTab('all');
                setShowSettingsModal(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all group cursor-pointer text-left border shadow-sm hover:border-cyan-500/50"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/35 group-hover:scale-105 group-hover:bg-cyan-400 group-hover:text-black transition">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider block text-stone-900 dark:text-white group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition">
                    SETTINGS
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-stone-700 dark:text-slate-200 group-hover:text-black group-hover:bg-cyan-400 px-2.5 py-1 rounded-md bg-stone-200/80 dark:bg-white/10 border border-stone-300 dark:border-white/15 transition font-mono">
                Config
              </span>
            </button>
          </div>

          <div className="border-t border-stone-200 dark:border-white/10" />

          {/* Bottom Actions: Export + Log Out / Log In */}
          <div className="pt-0.5 space-y-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setExportSource('dropdown');
                setShowExportConfirmModal(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-stone-700 dark:text-slate-200 hover:text-black dark:hover:text-white text-xs font-bold uppercase transition border cursor-pointer shadow-sm hover:bg-stone-100 dark:hover:bg-white/10"
              style={{
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
              }}
              title="Download backup file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {/* Extra Log Out or Log In below Export */}
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  openLogoutModal();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 text-xs font-bold uppercase tracking-wider transition border border-rose-500/25 bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer shadow-sm group"
                title="Sign out of your account"
              >
                <LogOut className="w-3.5 h-3.5 transition group-hover:scale-110" />
                <span>Log Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setAuthModalView('login');
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-stone-900 dark:text-white hover:text-black bg-gradient-to-r from-orange-500/20 to-orange-600/30 hover:from-orange-500 hover:to-orange-600 text-xs font-bold uppercase tracking-wider transition border border-orange-500/40 hover:border-orange-500 cursor-pointer shadow-sm group"
                title="Sign in or register"
              >
                <LogIn className="w-3.5 h-3.5 text-[#e9762b] group-hover:text-black transition" />
                <span className="text-[#e9762b] group-hover:text-black transition font-extrabold">Log In</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DEDICATED PROFILE MODAL (PORTALED TO BODY)                             */}
      {/* ========================================================================= */}
      {showProfileModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono overflow-y-auto"
            onClick={handleCloseProfileModal}
          >
            <div 
              className="w-full max-w-lg my-auto rounded-3xl p-6 sm:p-8 glass-modal shadow-2xl space-y-5 font-mono text-stone-900 dark:text-stone-100 border border-orange-500/20 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      handleAutoSaveName();
                      setShowProfileModal(false);
                      setIsOpen(true);
                    }}
                    className="p-1.5 -ml-1 rounded-lg text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 transition cursor-pointer shrink-0 active:scale-95"
                    title="Back to menu"
                    aria-label="Back to menu"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-[#e9762b]/20 text-[#e9762b] flex items-center justify-center border border-[#e9762b]/40">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                      USER PROFILE
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleAutoSaveName();
                      setShowProfileModal(false);
                      setSettingsTab('all');
                      setShowSettingsModal(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition cursor-pointer"
                    title="Open Settings"
                    aria-label="Open Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseProfileModal}
                    className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                    title="Close (Esc)"
                    aria-label="Close profile"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Profile Overview Stats Grid - Customizable from Analysis tab */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                {((user.profileMetricSlots || ['currentStreak', 'bestStreak', 'daysLogged']) as [string, string, string]).map((metricKey, idx) => {
                  const metric = analysisMetrics[metricKey] || analysisMetrics['daysLogged'];
                  return (
                    <div
                      key={idx}
                      className="relative p-2.5 sm:p-3 rounded-xl bg-stone-100/80 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/20 transition flex flex-col justify-between items-center group"
                    >
                      <div className="relative w-full flex items-center justify-center">
                        <select
                          value={metricKey}
                          onChange={(e) => updateProfileMetricSlot(idx as 0 | 1 | 2, e.target.value)}
                          className="appearance-none bg-transparent text-[10px] uppercase font-bold text-stone-700 dark:text-slate-300 hover:text-black dark:hover:text-white cursor-pointer pr-3.5 focus:outline-none text-center truncate max-w-full font-mono"
                          title="Click to customize metric"
                        >
                          {METRIC_OPTIONS.map((opt) => (
                            <option key={opt.key} value={opt.key} className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-2.5 h-2.5 text-stone-400 dark:text-slate-400 absolute right-0.5 pointer-events-none group-hover:text-black dark:group-hover:text-white transition" />
                      </div>
                      <span className={`text-base sm:text-lg font-extrabold mt-1.5 font-mono ${metric.color}`}>
                        {metric.value}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Student Name with inside 'x' (delete/clear) and '✓' (tick save) buttons + auto-save */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="student-name-input" className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-300 font-bold block">
                    STUDENT NAME
                  </label>
                  {profileSuccessMsg && (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in font-mono">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>SAVED</span>
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    id="student-name-input"
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    onBlur={handleAutoSaveName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveProfile();
                      }
                    }}
                    placeholder="Enter your name..."
                    className="w-full glass-input rounded-xl pl-3.5 pr-20 py-2.5 text-xs text-stone-900 dark:text-white placeholder-slate-400 focus:outline-none font-mono"
                  />

                  {/* Inside Buttons: 'x' (clear) & '✓' (tick save) */}
                  <div className="absolute right-1.5 flex items-center gap-1">
                    {profileName.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileName('');
                          const el = document.getElementById('student-name-input');
                          el?.focus();
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 transition cursor-pointer"
                        title="Clear name (x)"
                        aria-label="Clear name"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleSaveProfile()}
                      className={`p-1.5 rounded-lg transition cursor-pointer flex items-center justify-center ${
                        profileSuccessMsg
                          ? 'bg-emerald-500 text-black shadow-sm'
                          : 'bg-[#e9762b] text-black hover:brightness-110 active:scale-95 shadow-sm shadow-orange-500/25'
                      }`}
                      title="Save name"
                      aria-label="Save name"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Account & Security Section Inside Profile */}
              <div 
                className="p-4 rounded-xl border space-y-3"
                style={{
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${currentUser ? 'text-emerald-500' : 'text-[#e9762b]'}`} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-900 dark:text-white">
                      ACCOUNT & SECURITY
                    </span>
                  </div>
                  {currentUser ? (
                    <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                      Guest Mode
                    </span>
                  )}
                </div>

                {currentUser ? (
                  <>
                    <div className="text-xs space-y-1.5 py-1">
                      <div className="flex items-center justify-between text-stone-600 dark:text-slate-400">
                        <span className="text-[10px] uppercase font-bold tracking-wider">Email</span>
                        <span className="font-mono text-stone-900 dark:text-white text-xs truncate max-w-[200px]">{currentUser.email}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600 dark:text-slate-400">
                        <span className="text-[10px] uppercase font-bold tracking-wider">Security</span>
                        <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">PBKDF2-SHA256 Encrypted</span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileModal(false);
                          setAuthModalView('profile');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-bold uppercase transition cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Manage Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileModal(false);
                          openLogoutModal();
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-rose-400 hover:text-rose-300 text-xs font-bold uppercase transition border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer"
                        title="Sign out of your account"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-stone-600 dark:text-slate-400 leading-relaxed">
                      You are using local offline mode. Sign in to synchronize study logs across devices, protect your streak, and manage password security.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileModal(false);
                        setAuthModalView('login');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#e9762b] to-[#ff5f00] text-black font-extrabold text-xs font-mono uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/25"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In / Register</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 2. DEDICATED SETTINGS MODAL (PORTALED TO BODY)                            */}
      {/* ========================================================================= */}
      {showSettingsModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono"
            onClick={() => setShowSettingsModal(false)}
          >
            <div 
              className="w-full max-w-lg rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.95)] border flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: isDark ? 'rgba(18, 18, 17, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(36px)',
                WebkitBackdropFilter: 'blur(36px)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                boxShadow: isDark
                  ? '0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
                  : '0 30px 80px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.95)'
              }}
            >
              {/* Pinned Modal Header (Never scrolls away) */}
              <div className={`flex items-center justify-between border-b border-stone-200 dark:border-white/10 px-5 sm:px-6 py-4 shrink-0 ${isDark ? 'bg-[#141413]' : 'bg-[#f4f0e8]'}`}>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowProfileModal(true);
                    }}
                    className="p-1.5 -ml-1 rounded-lg text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 transition cursor-pointer shrink-0 active:scale-95"
                    title="Back to Profile"
                    aria-label="Back to Profile"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-500 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                      APP SETTINGS
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                  title="Close settings (Esc)"
                  aria-label="Close settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Settings Sub-Navigation Tabs with Slide Left/Right Arrows */}
              <div className={`flex items-center px-1.5 sm:px-2 border-b border-stone-200 dark:border-white/10 shrink-0 text-xs font-mono select-none ${isDark ? 'bg-[#181817]' : 'bg-[#ece8df]'}`}>
                {/* Left Slide Arrow */}
                <button
                  type="button"
                  onClick={() => scrollSettingsTabs('left')}
                  className="p-1 sm:p-1.5 rounded-lg text-[#e9762b] hover:text-[#ff5f00] hover:bg-stone-300/40 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
                  title="Scroll tabs left"
                  aria-label="Scroll settings tabs left"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.75] drop-shadow-[0_1px_4px_rgba(233,118,43,0.35)]" />
                </button>

                {/* Scrollable Tabs */}
                <div 
                  ref={settingsTabsRef}
                  className="flex-1 flex items-center gap-1.5 px-1.5 py-2.5 overflow-x-auto no-scrollbar scroll-smooth"
                >
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'network', label: 'Network', icon: Users },
                    { id: 'tables', label: 'Tables', icon: Table2 },
                    { id: 'general', label: 'General', icon: Sliders },
                    { id: 'study', label: 'Timer', icon: Clock },
                    { id: 'audio', label: 'Audio', icon: Bell },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = settingsTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSettingsTab(tab.id as typeof settingsTab)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer text-xs ${
                          isActive
                            ? 'bg-[#e9762b] text-black shadow-sm font-extrabold'
                            : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-300/40 dark:hover:bg-white/5'
                        }`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Slide Arrow */}
                <button
                  type="button"
                  onClick={() => scrollSettingsTabs('right')}
                  className="p-1 sm:p-1.5 rounded-lg text-[#e9762b] hover:text-[#ff5f00] hover:bg-stone-300/40 dark:hover:bg-white/10 transition cursor-pointer shrink-0"
                  title="Scroll tabs right"
                  aria-label="Scroll settings tabs right"
                >
                  <ChevronRight className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.75] drop-shadow-[0_1px_4px_rgba(233,118,43,0.35)]" />
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 min-h-0">
                {/* Section: Student Network & Code Regeneration */}
                {(settingsTab === 'all' || settingsTab === 'network') && (
                  <div className="space-y-3.5 p-4 rounded-xl bg-orange-500/5 dark:bg-[#e9762b]/[0.06] border border-[#e9762b]/35 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-[#e9762b] flex items-center justify-center border border-orange-500/40">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-[#e9762b] font-extrabold block">
                          STUDENT ID
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#e9762b]/20 text-[#e9762b] font-extrabold border border-[#e9762b]/40">
                        NETWORK
                      </span>
                    </div>

                    {/* Code Display & Action Row */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/90 dark:bg-black/40 border border-stone-200 dark:border-white/10 shadow-inner">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-slate-400 block font-bold">
                          STUDENT CODE
                        </span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-[#e9762b] select-all">
                            {user.friendCode || 'A9X4K'}
                          </span>
                          <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono">
                            ({user.name || 'Student'})
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const code = user.friendCode || 'A9X4K';
                            navigator.clipboard.writeText(code);
                            setCopiedSettingCode(true);
                            setTimeout(() => setCopiedSettingCode(false), 2000);
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-200 dark:bg-white/10 hover:bg-stone-300 dark:hover:bg-white/20 text-stone-800 dark:text-white text-xs font-bold transition cursor-pointer font-mono"
                          title="Copy student code"
                        >
                          {copiedSettingCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>COPIED</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-stone-600 dark:text-slate-300" />
                              <span>COPY</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const newCode = generateNewFriendCode();
                            confetti({ particleCount: 35, spread: 60 });
                            setRegenerateSuccessMsg(newCode);
                            setTimeout(() => setRegenerateSuccessMsg(null), 5000);
                          }}
                          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-[#e9762b] hover:from-orange-600 hover:to-[#d65914] text-black font-extrabold text-xs transition cursor-pointer font-mono shadow-md shadow-[#e9762b]/30 active:scale-95 whitespace-nowrap"
                          title="Generate new student code"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>NEW CODE</span>
                        </button>
                      </div>
                    </div>

                    {regenerateSuccessMsg && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono animate-in fade-in">
                        <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          NEW CODE: <strong>#{regenerateSuccessMsg}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Section 0: Theme & Appearance */}
                {(settingsTab === 'all' || settingsTab === 'general') && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                        THEME
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 dark:text-slate-400 uppercase font-semibold">
                        {theme === 'dark' ? 'DARK' : 'LIGHT'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-bold text-stone-900 dark:text-white block">DARK MODE</span>
                      <ThemeSwitch size={18} id="settings-theme-switch" />
                    </div>
                  </div>
                )}

                {/* Section 1: Custom Study Tables Settings */}
                {(settingsTab === 'all' || settingsTab === 'tables' || settingsTab === 'general') && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                        CUSTOM TABLES
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 dark:text-slate-400 uppercase font-semibold">
                        {(customTables || []).length} TABLE{((customTables || []).length === 1 ? '' : 'S')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(false);
                        setShowTableSettingsModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase transition border border-emerald-500/30 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Table2 className="w-4 h-4" />
                      <span>MANAGE TABLES</span>
                    </button>
                  </div>
                )}

                {/* Section 2: Timer Durations & Controls */}
                {(settingsTab === 'all' || settingsTab === 'study') && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                      TIMER DURATIONS
                    </span>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600 dark:text-slate-300 uppercase font-bold block">
                          WORK (MIN)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={defaultWorkMin}
                          onChange={(e) => setDefaultWorkMin(Number(e.target.value) || 25)}
                          className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-center text-stone-900 dark:text-white font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600 dark:text-slate-300 uppercase font-bold block">
                          SHORT BREAK
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={defaultShortBreakMin}
                          onChange={(e) => setDefaultShortBreakMin(Number(e.target.value) || 5)}
                          className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-center text-stone-900 dark:text-white font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600 dark:text-slate-300 uppercase font-bold block">
                          LONG BREAK
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={defaultLongBreakMin}
                          onChange={(e) => setDefaultLongBreakMin(Number(e.target.value) || 15)}
                          className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-center text-stone-900 dark:text-white font-bold"
                        />
                      </div>
                    </div>

                    {/* Finish Button Setting Toggle */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-200 dark:border-white/5">
                      <span className="text-stone-900 dark:text-white font-bold block text-xs">FINISH BUTTON</span>
                      <button
                        type="button"
                        onClick={() => setShowFinishButton(!showFinishButton)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                          showFinishButton ? 'bg-[#10b981]' : isDark ? 'bg-white/20' : 'bg-stone-300'
                        }`}
                        title={showFinishButton ? 'Turn off Finish Button' : 'Turn on Finish Button'}
                        aria-label="Toggle Finish Button"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            showFinishButton ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {/* Section 3: Productivity Features */}
                {(settingsTab === 'all' || settingsTab === 'general') && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                      FEATURES
                    </span>

                    {/* Quick Scratchpad Toggle */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                          <StickyNote className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-stone-900 dark:text-white font-bold block text-xs">SCRATCHPAD</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEnableQuickScratchpad(!enableQuickScratchpad)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 shrink-0 ${
                          enableQuickScratchpad ? 'bg-[#10b981]' : isDark ? 'bg-white/20' : 'bg-stone-300'
                        }`}
                        title={enableQuickScratchpad ? 'Turn off Quick Scratchpad' : 'Turn on Quick Scratchpad'}
                        aria-label="Toggle Quick Scratchpad"
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            enableQuickScratchpad ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Bottom Wordmark Customization */}
                    <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-stone-600 dark:text-slate-300 uppercase font-bold block">
                          WORDMARK
                        </label>
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold transition-colors ${
                            customWordmarkInput.length >= 12
                              ? 'bg-[#e9762b]/20 text-[#e9762b] border border-[#e9762b]/30'
                              : 'text-stone-400 dark:text-slate-500 bg-stone-200/50 dark:bg-white/5'
                          }`}
                        >
                          {customWordmarkInput.length}/12
                        </span>
                      </div>
                      <input
                        type="text"
                        maxLength={12}
                        value={customWordmarkInput}
                        onChange={(e) => setCustomWordmarkInput(e.target.value.slice(0, 12))}
                        placeholder="studyo"
                        className="w-full glass-input rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-white font-mono tracking-wider focus:outline-none focus:border-[#e9762b]"
                      />
                    </div>
                  </div>
                )}

                {/* Section 4: Audio */}
                {(settingsTab === 'all' || settingsTab === 'audio') && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-cyan-500 dark:text-cyan-400 font-bold block">
                      AUDIO
                    </span>

                    {/* Sound alert finish */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-900 dark:text-white font-bold block text-xs">CHIME ALERT</span>
                      <button
                        type="button"
                        onClick={() => setSoundAlertOnFinish(!soundAlertOnFinish)}
                        className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer p-0.5 ${
                          soundAlertOnFinish ? 'bg-[#10b981]' : isDark ? 'bg-white/20' : 'bg-stone-300'
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
                    <div className="space-y-1.5 pt-2 border-t border-stone-200 dark:border-white/5">
                      <label className="text-[10px] text-stone-600 dark:text-slate-300 uppercase font-bold block">
                        AMBIENT SOUND
                      </label>
                      <select
                        value={ambientSound}
                        onChange={(e) => setAmbientSound(e.target.value as SoundType)}
                        className="w-full glass-input rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                      >
                        {SOUNDS.map((s) => (
                          <option key={s.id} value={s.id} className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ambient Volume Slider */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-stone-600 dark:text-slate-300 font-bold">
                        <span>VOLUME</span>
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
                )}

                {/* Section 5: Data */}
                {(settingsTab === 'all' || settingsTab === 'general') && (
                  <div className="space-y-2 p-3.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10">
                    <span className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-300 font-bold block">
                      DATA
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setExportSource('settings');
                          setShowExportConfirmModal(true);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-200/90 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 text-stone-800 dark:text-white text-xs font-bold uppercase transition border border-stone-300 dark:border-white/15 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>EXPORT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Clear all local study data?')) {
                            clearUserData();
                            setShowSettingsModal(false);
                          }
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-bold uppercase transition border border-red-500/20 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>CLEAR DATA</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Section 6: Shortcuts */}
                {(settingsTab === 'all' || settingsTab === 'general') && (
                  <div className="p-3 rounded-xl bg-stone-100/50 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 text-xs text-stone-700 dark:text-slate-300 space-y-1.5">
                    <span className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-slate-400 font-bold block mb-1">
                      SHORTCUTS
                    </span>
                    <div className="flex justify-between">
                      <span>TIMER</span>
                      <span className="font-mono text-stone-900 dark:text-white bg-stone-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] border border-stone-300 dark:border-white/10">Space</span>
                    </div>
                    <div className="flex justify-between">
                      <span>FULLSCREEN</span>
                      <span className="font-mono text-stone-900 dark:text-white bg-stone-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] border border-stone-300 dark:border-white/10">Z</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CLOSE</span>
                      <span className="font-mono text-stone-900 dark:text-white bg-stone-200 dark:bg-white/10 px-1.5 py-0.5 rounded text-[10px] border border-stone-300 dark:border-white/10">Esc</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Pinned Modal Footer Actions (Always visible at bottom) */}
              <div className={`flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-stone-200 dark:border-white/10 shrink-0 ${isDark ? 'bg-[#141413]' : 'bg-[#f4f0e8]'}`}>
                {settingsSuccessMsg ? (
                  <div className="p-1.5 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                    <Check className="w-4 h-4" />
                    <span>SAVED</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-mono hidden sm:inline">
                    STUDYO
                  </span>
                )}

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className={`px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 ${isDark ? 'bg-[#1c1c1b] border-white/10 text-slate-300 hover:text-white' : 'bg-stone-200 border-stone-300 text-stone-800 hover:text-black'}`}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-6 py-2.5 rounded-full bg-[#e9762b] text-black font-extrabold text-xs font-mono uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-[#e9762b]/30"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================================= */}
      {/* 3. DEDICATED TABLE SETTINGS MODAL (PORTALED TO BODY)                      */}
      {/* ========================================================================= */}
      {showTableSettingsModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-mono"
            onClick={() => setShowTableSettingsModal(false)}
          >
            <div 
              className="w-full max-w-lg rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.95)] border flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: isDark ? 'rgba(18, 18, 17, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(36px)',
                WebkitBackdropFilter: 'blur(36px)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                boxShadow: isDark
                  ? '0 30px 80px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
                  : '0 30px 80px rgba(0, 0, 0, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.95)'
              }}
            >
              {/* Header */}
              <div className={`flex items-center justify-between border-b border-stone-200 dark:border-white/10 px-5 sm:px-6 py-4 shrink-0 ${isDark ? 'bg-[#141413]' : 'bg-[#f4f0e8]'}`}>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTableSettingsModal(false);
                      setShowSettingsModal(true);
                      setSettingsTab('tables');
                    }}
                    className="p-1.5 -ml-1 rounded-lg text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 transition cursor-pointer shrink-0 active:scale-95"
                    title="Back to Settings"
                    aria-label="Back to Settings"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                    <Table2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                      TABLE SETTINGS
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTableSettingsModal(false)}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 hover:text-black dark:hover:text-white transition cursor-pointer"
                  title="Close (Esc)"
                  aria-label="Close table settings"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 min-h-0">
                {/* Table Selector Tabs */}
                {(customTables || []).length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-stone-600 dark:text-slate-300 uppercase font-bold block">
                      SELECT TABLE
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(customTables || []).map((t) => {
                        const isSel = (t.id === selectedTableId) || (!selectedTableId && t.id === activeCustomTable?.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectTableToEdit(t.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition flex items-center gap-2 cursor-pointer border ${
                              isSel
                                ? 'bg-[#e9762b] text-black border-[#e9762b] shadow-sm'
                                : 'bg-stone-100 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
                            }`}
                          >
                            <span>{t.title || 'Untitled'}</span>
                            {t.id === activeTableId && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-extrabold ${isSel ? 'bg-black/20 text-black' : 'bg-[#e9762b]/20 text-[#e9762b]'}`}>
                                ACTIVE
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeCustomTable ? (
                  <form onSubmit={handleSaveTableSettings} className="space-y-4 pt-1">
                    {/* Table Title Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-600 dark:text-slate-300 uppercase font-bold block">
                        TABLE TITLE
                      </label>
                      <input
                        type="text"
                        value={editTableTitle}
                        onChange={(e) => setEditTableTitle(e.target.value)}
                        placeholder="e.g. Mock Tests"
                        className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none"
                        required
                      />
                    </div>

                    {/* Table Description Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-600 dark:text-slate-300 uppercase font-bold block">
                        DESCRIPTION
                      </label>
                      <textarea
                        rows={2}
                        value={editTableDesc}
                        onChange={(e) => setEditTableDesc(e.target.value)}
                        placeholder="Table notes..."
                        className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none resize-none"
                      />
                    </div>

                    {/* Table Stats & Active View Info */}
                    <div className="p-3.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 space-y-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                        STATUS
                      </span>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2.5 rounded-lg bg-stone-200/60 dark:bg-black/30 border border-stone-300/60 dark:border-white/5">
                          <span className="text-[10px] text-stone-500 dark:text-slate-400 uppercase font-bold block">COLUMNS</span>
                          <span className="text-base font-extrabold text-stone-900 dark:text-white font-mono">
                            {(activeCustomTable.columns || []).length}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-stone-200/60 dark:bg-black/30 border border-stone-300/60 dark:border-white/5">
                          <span className="text-[10px] text-stone-500 dark:text-slate-400 uppercase font-bold block">ROWS</span>
                          <span className="text-base font-extrabold text-stone-900 dark:text-white font-mono">
                            {(activeCustomTable.rows || []).length}
                          </span>
                        </div>
                      </div>

                      {/* Active Status in Study Log */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-bold text-stone-800 dark:text-white">
                          ACTIVE VIEW
                        </span>
                        {activeTableId === selectedTableId ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-mono">
                            <Check className="w-3 h-3" />
                            ACTIVE
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTableId(selectedTableId)}
                            className="px-3 py-1 rounded-lg bg-orange-500/15 hover:bg-[#e9762b] text-[#e9762b] hover:text-black border border-orange-500/30 text-[10px] font-bold uppercase transition cursor-pointer"
                          >
                            SET ACTIVE
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Delete table */}
                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex items-center justify-between">
                      <span className="text-xs font-bold text-red-500 dark:text-red-400 block">
                        DELETE TABLE
                      </span>
                      <button
                        type="button"
                        onClick={handleDeleteSelectedTable}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-bold uppercase transition border border-red-500/30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>DELETE</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="py-8 text-center text-stone-500 dark:text-slate-400 text-xs">
                    No custom tables found.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-stone-200 dark:border-white/10 shrink-0 ${isDark ? 'bg-[#141413]' : 'bg-[#f4f0e8]'}`}>
                {tableSettingsSuccessMsg ? (
                  <div className="p-1.5 px-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 font-bold animate-in fade-in">
                    <Check className="w-4 h-4" />
                    <span>SAVED</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-stone-500 dark:text-slate-400 font-mono hidden sm:inline">
                    TABLES
                  </span>
                )}

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowTableSettingsModal(false)}
                    className={`px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 ${
                      isDark
                        ? 'bg-[#1c1c1b] border-white/10 text-slate-300 hover:text-white'
                        : 'bg-stone-200 border-stone-300 text-stone-800 hover:text-black'
                    }`}
                  >
                    Close
                  </button>
                  {activeCustomTable && (
                    <button
                      type="button"
                      onClick={handleSaveTableSettings}
                      className="px-6 py-2.5 rounded-full bg-[#e9762b] text-black font-extrabold text-xs font-mono uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-[#e9762b]/30"
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Export Confirmation Modal */}
      <ExportConfirmModal
        isOpen={showExportConfirmModal}
        onClose={() => setShowExportConfirmModal(false)}
        onBack={() => {
          setShowExportConfirmModal(false);
          if (exportSource === 'dropdown') {
            setIsOpen(true);
          } else if (exportSource === 'settings') {
            setShowSettingsModal(true);
          }
        }}
      />
    </div>
  );
};
