import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import HalftoneWordmarkFooter from './ui/halftone-wordmark-footer';
import { DailyStudyLog } from './DailyStudyLog';
import { StudyLogAnalysis } from './StudyLogAnalysis';
import { ProfileDropdown } from './ProfileDropdown';
import { ShinyButton } from './ui/shiny-button';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Star, 
  Maximize2, 
  Sliders, 
  Volume2, 
  Plus, 
  Minus, 
  Sparkles, 
  Clock, 
  StickyNote, 
  Trash2, 
  CheckSquare, 
  X,
  Flame,
  Target,
  Circle,
  Calendar,
  TrendingUp,
  Sun,
  Sunset,
  Moon,
  ChevronDown,
  BookOpen,
  Timer as TimerIcon,
  Check
} from 'lucide-react';
import { SoundType } from '../services/soundSynth';
import { TaskPriority } from '../types';

const QUICK_PRESETS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '1h', seconds: 60 * 60 },
  { label: '2h', seconds: 2 * 60 * 60 },
  { label: '4h', seconds: 4 * 60 * 60 },
];

const SlidersIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" y1="8" x2="20" y2="8" />
    <circle cx="8" cy="8" r="2" fill="currentColor" />
    <line x1="4" y1="16" x2="20" y2="16" />
    <circle cx="16" cy="16" r="2" fill="currentColor" />
  </svg>
);

const CornersIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4 8V4h4" />
    <path d="M20 8V4h-4" />
    <path d="M4 16v4h4" />
    <path d="M20 16v4h-4" />
  </svg>
);

const SOUNDS: { id: SoundType; label: string }[] = [
  { id: 'off', label: 'Mute' },
  { id: 'rain', label: 'Rain' },
  { id: 'brown', label: 'Brown Noise' },
  { id: 'binaural', label: 'Binaural 40Hz' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'clock', label: 'Clock' },
];

export const HomeScreen: React.FC = () => {
  const {
    timer,
    tasks,
    sessions,
    user,
    dailyLogs,
    distractionNotes,
    ambientSound,
    autoStartNextRound,
    soundAlertOnFinish,
    stopwatchTime,
    stopwatchRunning,
    stopwatchLaps,
    setTimerDuration,
    adjustTimerSeconds,
    startTimer,
    pauseTimer,
    resetTimer,
    logSession,
    setZenMode,
    setAmbientSound,
    setAutoStartNextRound,
    setSoundAlertOnFinish,
    startStopwatch,
    pauseStopwatch,
    resetStopwatch,
    lapStopwatch,
    addDistraction,
    deleteDistraction,
    convertDistractionToTask,
    addTask,
    toggleTask,
    deleteTask,
    addExamCountdown,
    deleteExamCountdown,
  } = useStudyStore();

  // Active Main View Tab: 'timer' | 'studylog' | 'analysis' | 'tasks'
  const [activeView, setActiveView] = useState<'timer' | 'studylog' | 'analysis' | 'tasks'>('timer');

  // Sub-mode in Timer: 'timer' | 'stopwatch'
  const [timerSubMode, setTimerSubMode] = useState<'timer' | 'stopwatch'>('timer');

  // Real-time live clock (top right corner of timer)
  const [liveClock, setLiveClock] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveClock(now.toTimeString().split(' ')[0]);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Settings & Custom adjustment panel toggle (Image 1 closed, Image 2 open)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(25);
  const [inputSeconds, setInputSeconds] = useState(0);

  const toggleSettingsPanel = () => {
    if (!showSettingsPanel) {
      const cur = timer.timeLeft ?? timer.initialDuration ?? 25 * 60;
      setInputHours(Math.floor(cur / 3600));
      setInputMinutes(Math.floor((cur % 3600) / 60));
      setInputSeconds(cur % 60);
    }
    setShowSettingsPanel((prev) => !prev);
  };

  // Rating modal
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');

  // Scratchpad
  const [scratchpadText, setScratchpadText] = useState('');

  // Task Planner State
  const [taskFilter, setTaskFilter] = useState<'today' | 'upcoming' | 'completed'>('today');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('high');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  // Exam Countdown State
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [showAddExam, setShowAddExam] = useState(false);

  // Measure sticky header so the "study" hero fills exactly the rest of the screen
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerH, setHeaderH] = useState(65);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderH(Math.round(el.getBoundingClientRect().height));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);
  const heroHeight = `calc(100dvh - ${headerH}px)`;

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (timerSubMode === 'timer') {
          if (timer.isRunning) pauseTimer();
          else startTimer();
        } else {
          if (stopwatchRunning) pauseStopwatch();
          else startStopwatch();
        }
      } else if (e.key === 'z' || e.key === 'Z') {
        setZenMode(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer.isRunning, stopwatchRunning, timerSubMode, pauseTimer, startTimer, pauseStopwatch, startStopwatch, setZenMode]);

  // Timer Digits Formatting
  const totalSeconds = timer.timeLeft;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hhStr = String(hours).padStart(2, '0');
  const mmStr = String(minutes).padStart(2, '0');
  const ssStr = String(seconds).padStart(2, '0');

  // Stopwatch Digits Formatting
  const swHours = Math.floor(stopwatchTime / 3600);
  const swMinutes = Math.floor((stopwatchTime % 3600) / 60);
  const swSeconds = stopwatchTime % 60;

  const swHhStr = String(swHours).padStart(2, '0');
  const swMmStr = String(swMinutes).padStart(2, '0');
  const swSsStr = String(swSeconds).padStart(2, '0');

  const formatLapTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Quick adjust duration (+ / - seconds)
  const handleAdjustSeconds = (deltaSeconds: number) => {
    adjustTimerSeconds(deltaSeconds);
  };

  // Apply custom time (1 second to 24 hours)
  const handleApplyCustomTime = () => {
    const total = (Number(inputHours) * 3600) + (Number(inputMinutes) * 60) + Number(inputSeconds);
    const validTotal = Math.max(1, Math.min(24 * 3600, total || 60));
    setTimerDuration(validTotal);
  };

  // Finish session
  const handleFinish = () => {
    pauseTimer();
    setShowRating(true);
  };

  const handleSaveSession = () => {
    logSession(rating, sessionNotes);
    setShowRating(false);
    setSessionNotes('');
  };

  // Scratchpad
  const handleAddDistraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (scratchpadText.trim()) {
      addDistraction(scratchpadText.trim());
      setScratchpadText('');
    }
  };

  // Handle Create Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask({
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        dueDate: newTaskDate,
        estimatedPomodoros: 2,
        subjectId: 'sub-general',
      });
      setNewTaskTitle('');
    }
  };

  // Handle Switch Tab
  const handleSwitchTab = (tab: 'timer' | 'studylog' | 'analysis' | 'tasks') => {
    setActiveView(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Smooth scroll down to timer under study hero
  const handleGoToTimer = () => {
    setActiveView('timer');
    setTimeout(() => {
      const el = document.getElementById('timer-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  const pendingTasks = tasks.filter((t) => !t.completed);

  // Top Main Bar persistent across the whole website
  const mainBar = (
    <div className="w-full px-3 sm:px-8 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
      {/* Left: Brand */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handleGoToTimer}
          className="text-left group cursor-pointer focus:outline-none flex items-center gap-2.5 px-3.5 py-2 rounded-xl glass-pill hover:border-white/30 transition"
          title="Direct to Timer"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5f00] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e9762b]"></span>
          </span>
          <span className="font-extrabold text-sm sm:text-base tracking-widest text-white uppercase group-hover:text-[#e9762b] transition">
            Studyo
          </span>
        </button>
      </div>

      {/* Center: Main Bar Navigation Tabs */}
      <div className="order-3 md:order-2 w-full md:w-auto flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl glass-panel text-xs sm:text-sm uppercase tracking-wider font-bold overflow-x-auto shadow-[inset_0_1px_0_0_rgba(255,255,255,0.16),0_8px_25px_rgba(0,0,0,0.6)]">
        <button
          onClick={handleGoToTimer}
          className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl transition font-mono whitespace-nowrap ${
            activeView === 'timer'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_20px_rgba(233,118,43,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>TIMER</span>
        </button>

        <button
          onClick={() => handleSwitchTab('studylog')}
          className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl transition font-mono whitespace-nowrap ${
            activeView === 'studylog'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_20px_rgba(233,118,43,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>STUDY LOG</span>
        </button>

        <button
          onClick={() => handleSwitchTab('analysis')}
          className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl transition font-mono whitespace-nowrap ${
            activeView === 'analysis'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_20px_rgba(233,118,43,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ANALYSIS</span>
        </button>

        <button
          onClick={() => handleSwitchTab('tasks')}
          className={`flex-1 md:flex-none justify-center flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl transition font-mono whitespace-nowrap ${
            activeView === 'tasks'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_20px_rgba(233,118,43,0.35)]'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>TASKS ({pendingTasks.length})</span>
        </button>
      </div>

      {/* Right: Quick Controls */}
      <div className="order-2 md:order-3 flex items-center gap-2 text-xs font-mono">
        {/* Ambient Sound Selector */}
        <div className="hidden sm:flex items-center gap-1.5 glass-pill rounded-xl px-3 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)]">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={ambientSound}
            onChange={(e) => setAmbientSound(e.target.value as SoundType)}
            className="bg-transparent text-[11px] text-slate-200 focus:outline-none uppercase cursor-pointer"
          >
            {SOUNDS.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#141413] text-white">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Focus Mode Button */}
        <button
          onClick={() => setZenMode(true)}
          className="p-2 rounded-xl glass-pill hover:border-white/30 text-slate-300 hover:text-white transition shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] cursor-pointer"
          title="Fullscreen Focus Mode (Press 'Z')"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Top Right Profile & Settings Button */}
        <ProfileDropdown />
      </div>
    </div>
  );

  // Filtered tasks for Tasks view
  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'completed') return task.completed;
    if (task.completed) return false;
    if (taskFilter === 'today') return task.dueDate <= new Date().toISOString().split('T')[0];
    if (taskFilter === 'upcoming') return task.dueDate > new Date().toISOString().split('T')[0];
    return true;
  });

  return (
    <div className="min-h-[100dvh] w-full bg-[#000000] text-[#e9e4da] flex flex-col font-mono selection:bg-orange-500 selection:text-black relative">
      {/* Ambient Glass Glow Orbs (Shine through frosted glass surfaces) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Top Header Ambient Refraction Glow - shines directly through the frosted header bar */}
        <div 
          className="absolute -top-[140px] left-1/2 -translate-x-1/2 w-[950px] h-[340px] rounded-full opacity-35 blur-[110px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255, 95, 0, 0.45) 0%, rgba(233, 118, 43, 0.22) 45%, transparent 70%)' }}
        />
        {activeView !== 'timer' && (
          <div 
            className="absolute top-[6%] left-1/2 -translate-x-1/2 w-[720px] h-[480px] rounded-full opacity-20 blur-[130px]"
            style={{ background: 'radial-gradient(circle, #ff5f00 0%, #e9762b 40%, transparent 70%)' }}
          />
        )}
        <div 
          className="absolute top-[40%] right-[-10%] w-[520px] h-[420px] rounded-full opacity-10 blur-[140px]"
          style={{ background: 'radial-gradient(circle, #ff9253 0%, transparent 65%)' }}
        />
        <div 
          className="absolute bottom-[10%] left-[-10%] w-[580px] h-[440px] rounded-full opacity-15 blur-[150px]"
          style={{ background: 'radial-gradient(circle, #e9762b 0%, #ff5f00 35%, transparent 70%)' }}
        />
      </div>

      {/* 1. TOP HEADER NAVIGATION */}
      <header ref={headerRef} className="sticky top-0 z-[60] w-full glass-header">
        {mainBar}
      </header>

      {/* CONTINUOUS UNIFIED AMBIENT BACKDROP (MERGES STUDY HERO + FOCUS TIMER INTO ONE CONTINUOUS IMAGE) */}
      {activeView === 'timer' && (
        <div className="absolute top-0 inset-x-0 w-full pointer-events-none overflow-hidden z-0" style={{ height: '2600px' }}>
          {/* Base continuous ember-to-obsidian radial wash */}
          <div 
            className="absolute top-0 inset-x-0 w-full h-[2200px]"
            style={{
              background: 'radial-gradient(ellipse 140% 1100px at 50% 500px, rgba(233, 118, 43, 0.24) 0%, rgba(255, 95, 0, 0.14) 30%, rgba(180, 65, 10, 0.08) 52%, rgba(20, 9, 3, 0.65) 75%, transparent 92%)'
            }}
          />
          {/* 1. Primary Radiant Amber Core directly behind "study" text */}
          <div 
            className="absolute top-[220px] sm:top-[280px] left-1/2 -translate-x-1/2 w-[850px] sm:w-[1250px] h-[450px] sm:h-[550px] rounded-full opacity-55 blur-[120px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255, 105, 25, 0.6) 0%, rgba(233, 118, 43, 0.38) 45%, rgba(180, 65, 10, 0.15) 65%, transparent 75%)'
            }}
          />
          {/* 2. Fluid Connecting Glow across the transition zone (NO SEAM, NO DARK GAP) */}
          <div 
            className="absolute top-[680px] sm:top-[780px] left-1/2 -translate-x-1/2 w-[800px] sm:w-[1150px] h-[550px] sm:h-[650px] rounded-full opacity-50 blur-[125px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(255, 95, 0, 0.52) 0%, rgba(233, 118, 43, 0.3) 48%, rgba(180, 65, 10, 0.12) 68%, transparent 78%)'
            }}
          />
          {/* 3. Focus Timer Hearth Glow behind the timer cards & clock digits */}
          <div 
            className="absolute top-[1200px] sm:top-[1350px] left-1/2 -translate-x-1/2 w-[750px] sm:w-[1050px] h-[480px] sm:h-[580px] rounded-full opacity-40 blur-[135px]"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(233, 118, 43, 0.4) 0%, rgba(255, 95, 0, 0.22) 45%, transparent 72%)'
            }}
          />
        </div>
      )}

      {/* 2. GIANT HALFTONE "STUDY" HERO (ONLY ON TIMER VIEW) */}
      {activeView === 'timer' && (
        <section 
          className="relative w-full min-h-[420px] flex flex-col justify-center items-center bg-transparent z-10" 
          style={{ height: heroHeight }}
        >
          <HalftoneWordmarkFooter
            wordmark="study"
            label=""
            meta=""
            columns={[]}
            backToTop={false}
            crop={0}
            dotGap={7}
            radius={110}
            palette={{
              background: 'transparent',
              ink: '#f3ece2',
              warm: '#ff6200',
            }}
            grain={0.15}
            height={heroHeight}
            className="relative z-10"
          />

          {/* Smooth Scroll Cue to Timer (Seamlessly floating with no border or cutoff) */}
          <button
            onClick={handleGoToTimer}
            className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 px-4 py-2 rounded-full glass-panel border border-[#e9762b]/30 hover:border-[#e9762b]/70 shadow-[0_0_20px_rgba(233,118,43,0.18)] hover:shadow-[0_0_25px_rgba(233,118,43,0.35)] transition-all duration-300 cursor-pointer group backdrop-blur-md active:scale-95"
            title="Scroll down to Timer"
            aria-label="Scroll down to timer"
          >
            <span className="text-[10px] sm:text-xs uppercase font-mono tracking-widest text-slate-300 group-hover:text-[#ff9253] transition font-bold">
              Scroll to Timer
            </span>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e9762b] group-hover:text-[#ff9253] group-hover:translate-y-0.5 transition duration-300 animate-bounce" />
          </button>
        </section>
      )}

      {/* 3. MAIN CONTENT CONTAINER (Uniform width & rhythm across ALL tabs) */}
      <main className="w-full flex-1 flex flex-col items-center py-6 sm:py-8 mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        
        {/* ====================================================== */}
        {/* A. TIMER & STOPWATCH MODULE                             */}
        {/* ====================================================== */}
        {activeView === 'timer' && (
          <div id="timer-section" className="w-full flex flex-col space-y-8 animate-fadeIn scroll-mt-24">
            
            {/* Unified Top Header for Timer */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-[#e9762b] font-bold block mb-1">
                  STUDY TRACKER
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase font-mono">
                  Focus Timer
                </h1>
              </div>

              {/* Mode Switcher [ TIMER ] [ STOPWATCH ] + Live Clock */}
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <div className="flex items-center gap-1 glass-panel p-1 rounded-xl font-mono text-xs font-bold">
                  <button
                    onClick={() => setTimerSubMode('timer')}
                    className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition ${
                      timerSubMode === 'timer'
                        ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_15px_rgba(233,118,43,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    TIMER
                  </button>
                  <button
                    onClick={() => setTimerSubMode('stopwatch')}
                    className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider transition ${
                      timerSubMode === 'stopwatch'
                        ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_15px_rgba(233,118,43,0.3)]'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    STOPWATCH
                  </button>
                </div>

                <div className="text-slate-300 font-mono text-xs sm:text-sm font-bold tracking-widest tabular-nums glass-pill px-3.5 py-2 rounded-xl">
                  {liveClock}
                </div>
              </div>
            </div>

            {/* If TIMER SUBMODE: Presets + Countdown Display */}
            {timerSubMode === 'timer' && (
              <>
                {/* Presets Row (Matches Image 1 exactly: 7 pills) */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
                  {QUICK_PRESETS.map((p) => {
                    const isCurrent = timer.initialDuration === p.seconds;
                    return (
                      <button
                        key={p.label}
                        onClick={() => {
                          setTimerDuration(p.seconds);
                          setInputHours(Math.floor(p.seconds / 3600));
                          setInputMinutes(Math.floor((p.seconds % 3600) / 60));
                          setInputSeconds(p.seconds % 60);
                        }}
                        className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold transition-all active:scale-95 ${
                          isCurrent
                            ? 'border border-[#e9762b] text-[#e9762b] bg-[#e9762b]/10 shadow-[0_0_15px_rgba(233,118,43,0.2),inset_0_1px_0_rgba(255,255,255,0.15)]'
                            : 'glass-pill text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Clock Face: Giant Digits with glass panel background */}
                <div className="flex flex-col items-center justify-center py-6 sm:py-10 w-full select-none glass-panel rounded-3xl relative overflow-hidden my-2">
                  {/* Subtle glass gloss rim line */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-7 text-6xl sm:text-8xl md:text-[9.5rem] font-bold tracking-tight leading-none">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#f5f5f4] slashed-zero-num leading-none">
                        {hhStr}
                      </span>
                      <span className="text-xs sm:text-sm tracking-[0.25em] text-slate-500 font-mono uppercase font-semibold mt-3 sm:mt-5">
                        HOURS
                      </span>
                    </div>

                    {/* Colon Dots */}
                    <div className="flex flex-col justify-center items-center gap-3 sm:gap-5 px-1 sm:px-3 pb-6 sm:pb-8">
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#525252]" />
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#525252]" />
                    </div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#f5f5f4] slashed-zero-num leading-none">
                        {mmStr}
                      </span>
                      <span className="text-xs sm:text-sm tracking-[0.25em] text-slate-500 font-mono uppercase font-semibold mt-3 sm:mt-5">
                        MINUTES
                      </span>
                    </div>

                    {/* Colon Dots */}
                    <div className="flex flex-col justify-center items-center gap-3 sm:gap-5 px-1 sm:px-3 pb-6 sm:pb-8">
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#525252]" />
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#525252]" />
                    </div>

                    {/* Seconds */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#e9762b] slashed-zero-num leading-none">
                        {ssStr}
                      </span>
                      <span className="text-xs sm:text-sm tracking-[0.25em] text-[#e9762b]/90 font-mono uppercase font-semibold mt-3 sm:mt-5">
                        SECONDS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Controls Row */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                  <ShinyButton
                    onClick={timer.isRunning ? pauseTimer : startTimer}
                    label={timer.isRunning ? 'PAUSE' : 'START'}
                    cornerRadius={12}
                    className="!px-9 sm:!px-12 !py-3.5 sm:!py-4 !text-xs sm:!text-sm !font-mono !font-extrabold !tracking-widest !uppercase !rounded-xl active:scale-95 transition"
                  />

                  <button
                    onClick={resetTimer}
                    className="px-8 sm:px-10 py-3.5 sm:py-4 glass-panel hover:bg-[#1e1e1d]/90 border border-white/12 text-slate-300 hover:text-white font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl transition active:scale-95"
                  >
                    RESET
                  </button>

                  <button
                    onClick={handleFinish}
                    className="px-8 sm:px-10 py-3.5 sm:py-4 glass-panel hover:bg-[#1e1e1d]/90 border border-white/12 text-slate-300 hover:text-white font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl transition active:scale-95"
                  >
                    FINISH
                  </button>

                  {/* Settings / Sliders Button (Image 1 vs Image 2 toggle) */}
                  <button
                    onClick={toggleSettingsPanel}
                    className={`p-3.5 sm:p-4 rounded-xl border transition active:scale-95 ${
                      showSettingsPanel
                        ? 'bg-[#181817] border-[#e9762b]/60 text-[#e9762b] shadow-[0_0_15px_rgba(233,118,43,0.25)]'
                        : 'glass-panel hover:bg-[#1e1e1d]/90 border-white/12 text-slate-400 hover:text-white'
                    }`}
                    title="Timer Settings & Custom Adjustment"
                    aria-label="Timer settings"
                  >
                    <SlidersIcon className="w-5 h-5" />
                  </button>

                  {/* Fullscreen Button */}
                  <button
                    onClick={() => setZenMode(true)}
                    className="p-3.5 sm:p-4 rounded-xl glass-panel hover:bg-[#1e1e1d]/90 border border-white/12 text-slate-400 hover:text-white transition active:scale-95"
                    title="Fullscreen Mode"
                    aria-label="Fullscreen mode"
                  >
                    <CornersIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Collapsible Settings Panel (Matches Image 2 exactly when clicked) */}
                {showSettingsPanel && (
                  <div className="w-full flex flex-col items-center animate-fadeIn space-y-6 pt-4">
                    {/* Thin divider line */}
                    <div className="w-full max-w-4xl border-t border-white/[0.08]" />

                    {/* CUSTOM Row */}
                    <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap text-sm font-mono">
                      <span className="text-slate-500 uppercase tracking-widest font-bold select-none text-xs sm:text-sm">
                        CUSTOM
                      </span>

                      {/* Hours */}
                      <div className="flex items-baseline">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={inputHours}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '');
                            setInputHours(v === '' ? 0 : Math.min(24, parseInt(v, 10)));
                          }}
                          className="w-14 sm:w-16 bg-transparent text-center font-mono font-bold text-white text-base sm:text-lg border-b border-[#3f3f3e] hover:border-white/40 focus:border-[#e9762b] pb-1 outline-none transition-colors"
                        />
                        <span className="text-slate-400 font-mono text-xs sm:text-sm ml-1.5 mr-2 sm:mr-3 select-none">
                          h
                        </span>
                      </div>

                      {/* Minutes */}
                      <div className="flex items-baseline">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={inputMinutes}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '');
                            setInputMinutes(v === '' ? 0 : Math.min(59, parseInt(v, 10)));
                          }}
                          className="w-14 sm:w-16 bg-transparent text-center font-mono font-bold text-white text-base sm:text-lg border-b border-[#3f3f3e] hover:border-white/40 focus:border-[#e9762b] pb-1 outline-none transition-colors"
                        />
                        <span className="text-slate-400 font-mono text-xs sm:text-sm ml-1.5 mr-2 sm:mr-3 select-none">
                          m
                        </span>
                      </div>

                      {/* Seconds */}
                      <div className="flex items-baseline">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={inputSeconds}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '');
                            setInputSeconds(v === '' ? 0 : Math.min(59, parseInt(v, 10)));
                          }}
                          className="w-14 sm:w-16 bg-transparent text-center font-mono font-bold text-white text-base sm:text-lg border-b border-[#3f3f3e] hover:border-white/40 focus:border-[#e9762b] pb-1 outline-none transition-colors"
                        />
                        <span className="text-slate-400 font-mono text-xs sm:text-sm ml-1.5 mr-2 sm:mr-3 select-none">
                          s
                        </span>
                      </div>

                      {/* Set button */}
                      <button
                        onClick={handleApplyCustomTime}
                        className="px-4 py-1.5 bg-transparent hover:bg-[#1a1a19] border border-white/20 hover:border-white/40 text-slate-300 hover:text-white rounded-lg text-xs sm:text-sm font-mono normal-case tracking-normal transition active:scale-95"
                      >
                        Set
                      </button>
                    </div>

                    {/* ADJUST Row */}
                    <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm font-mono pt-1">
                      <span className="text-slate-500 uppercase tracking-widest font-bold mr-1 text-xs select-none">
                        ADJUST
                      </span>
                      {[
                        { label: '+1h', sec: 3600 },
                        { label: '+10m', sec: 600 },
                        { label: '+1m', sec: 60 },
                        { label: '+30s', sec: 30 },
                        { label: '+10s', sec: 10 },
                        { label: '-1m', sec: -60 },
                        { label: '-10s', sec: -10 },
                      ].map((btn) => (
                        <button
                          key={btn.label}
                          onClick={() => handleAdjustSeconds(btn.sec)}
                          className="px-3.5 sm:px-4 py-2 rounded-xl bg-[#141413] hover:bg-[#1f1f1e] border border-white/10 hover:border-white/25 text-slate-400 hover:text-white text-xs sm:text-sm font-mono font-bold normal-case tracking-normal transition active:scale-95"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Toggles Row (Matches Image 1 and Image 2) */}
                <div className="flex items-center justify-center gap-10 sm:gap-14 pt-3 sm:pt-5 flex-wrap select-none">
                  {/* Auto-start next toggle */}
                  <label className="flex items-center gap-3.5 cursor-pointer">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoStartNextRound}
                      onClick={() => setAutoStartNextRound(!autoStartNextRound)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        autoStartNextRound ? 'bg-[#e9762b]' : 'bg-[#252524]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                          autoStartNextRound ? 'translate-x-6 bg-black' : 'translate-x-1 bg-slate-400'
                        }`}
                      />
                    </button>
                    <span className="text-xs sm:text-sm font-mono uppercase tracking-widest font-bold text-slate-400">
                      AUTO-START NEXT
                    </span>
                  </label>

                  {/* Sound on finish toggle */}
                  <label className="flex items-center gap-3.5 cursor-pointer">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={soundAlertOnFinish}
                      onClick={() => setSoundAlertOnFinish(!soundAlertOnFinish)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        soundAlertOnFinish ? 'bg-[#e9762b]' : 'bg-[#252524]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                          soundAlertOnFinish ? 'translate-x-6 bg-black' : 'translate-x-1 bg-slate-400'
                        }`}
                      />
                    </button>
                    <span className={`text-xs sm:text-sm font-mono uppercase tracking-widest font-bold ${
                      soundAlertOnFinish ? 'text-[#f5f5f4]' : 'text-slate-500'
                    }`}>
                      SOUND ON FINISH
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* If STOPWATCH SUBMODE: Stopwatch Display + Lap Controls */}
            {timerSubMode === 'stopwatch' && (
              <div className="w-full flex flex-col items-center space-y-6">
                {/* Stopwatch Digits */}
                <div className="flex flex-col items-center justify-center py-6 sm:py-10 w-full select-none glass-panel rounded-3xl relative overflow-hidden my-2">
                  {/* Subtle glass gloss rim line */}
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                  <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-7 text-6xl sm:text-8xl md:text-[9.5rem] font-bold tracking-tight leading-none">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#f5f5f4] slashed-zero-num leading-none">
                        {swHhStr}
                      </span>
                      <span className="text-xs sm:text-sm tracking-[0.25em] text-slate-500 font-mono uppercase font-semibold mt-3 sm:mt-5">
                        HOURS
                      </span>
                    </div>

                    {/* Colon Dots */}
                    <div className="flex flex-col justify-center items-center gap-3 sm:gap-5 px-1 sm:px-3 pb-6 sm:pb-8">
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#525252]" />
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#525252]" />
                    </div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#f5f5f4] slashed-zero-num leading-none">
                        {swMmStr}
                      </span>
                      <span className="text-xs sm:text-sm tracking-[0.25em] text-slate-500 font-mono uppercase font-semibold mt-3 sm:mt-5">
                        MINUTES
                      </span>
                    </div>

                    {/* Colon Dots */}
                    <div className="flex flex-col justify-center items-center gap-3 sm:gap-5 px-1 sm:px-3 pb-6 sm:pb-8">
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#525252]" />
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[#525252]" />
                    </div>

                    {/* Seconds */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#e9762b] slashed-zero-num leading-none">
                        {swSsStr}
                      </span>
                      <span className="text-xs sm:text-sm tracking-[0.25em] text-[#e9762b]/90 font-mono uppercase font-semibold mt-3 sm:mt-5">
                        SECONDS
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stopwatch Controls */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
                  <ShinyButton
                    onClick={stopwatchRunning ? pauseStopwatch : startStopwatch}
                    label={stopwatchRunning ? 'PAUSE' : 'START'}
                    cornerRadius={12}
                    className="!px-9 sm:!px-12 !py-3.5 sm:!py-4 !text-xs sm:!text-sm !font-mono !font-extrabold !tracking-widest !uppercase !rounded-xl active:scale-95 transition"
                  />

                  <button
                    onClick={lapStopwatch}
                    disabled={!stopwatchRunning}
                    className={`px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl border text-xs sm:text-sm uppercase font-bold tracking-widest transition active:scale-95 ${
                      stopwatchRunning
                        ? 'glass-panel hover:bg-[#1e1e1d]/90 border-white/12 text-slate-300 hover:text-white'
                        : 'opacity-40 border-white/5 cursor-not-allowed text-slate-600 bg-[#141413]/50'
                    }`}
                  >
                    LAP
                  </button>

                  <button
                    onClick={resetStopwatch}
                    className="px-8 sm:px-10 py-3.5 sm:py-4 glass-panel hover:bg-[#1e1e1d]/90 border border-white/12 text-slate-400 hover:text-white font-bold text-xs sm:text-sm tracking-widest uppercase rounded-xl transition active:scale-95"
                  >
                    RESET
                  </button>

                  <button
                    onClick={() => setZenMode(true)}
                    className="p-3.5 sm:p-4 rounded-xl glass-panel hover:bg-[#1e1e1d]/90 border border-white/12 text-slate-400 hover:text-white transition active:scale-95"
                    title="Fullscreen Mode"
                  >
                    <CornersIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Lap List Table */}
                {stopwatchLaps.length > 0 && (
                  <div className="w-full glass-panel rounded-2xl p-5 sm:p-6 mt-6 shadow-xl">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wider font-bold text-slate-400 pb-3 border-b border-white/10 font-mono">
                      <span>Lap</span>
                      <span>Lap Split</span>
                      <span>Total Time</span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pt-3">
                      {stopwatchLaps.map((lap) => (
                        <div key={lap.id} className="flex items-center justify-between text-xs sm:text-sm text-slate-300 py-2 border-b border-white/5 font-mono">
                          <span className="font-bold text-[#e9762b]">Lap {lap.lapNumber}</span>
                          <span className="text-slate-400">+{formatLapTime(lap.lapDurationSeconds)}</span>
                          <span className="text-white font-bold">{formatLapTime(lap.timestampSeconds)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Scratchpad Card */}
            <div className="w-full p-5 sm:p-6 rounded-2xl glass-panel shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-slate-400" />
                  <span className="uppercase tracking-widest font-bold text-slate-200">Quick Scratchpad:</span>
                </div>
                <span className="text-xs text-slate-400 font-mono font-bold">{distractionNotes.length} notes</span>
              </div>

              {/* Input row */}
              <form onSubmit={handleAddDistraction} className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Note down stray thoughts without losing focus..."
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  className="flex-1 glass-input rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none transition font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 glass-panel hover:bg-[#2c2c28] text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition font-mono"
                >
                  Add
                </button>
              </form>

              {/* List of notes */}
              {distractionNotes.length > 0 && (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 pt-1 font-mono">
                  {distractionNotes.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-xs sm:text-sm group"
                    >
                      <span className="text-slate-300 truncate max-w-[320px] sm:max-w-xl font-mono">{n.text}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => convertDistractionToTask(n.id)}
                          className="flex items-center gap-1 text-xs text-[#10b981] hover:underline font-bold uppercase"
                          title="Convert to Task"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Task</span>
                        </button>
                        <button
                          onClick={() => deleteDistraction(n.id)}
                          className="text-slate-500 hover:text-rose-400 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ambient Sound Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs pt-2 font-mono">
              <Volume2 className="w-4 h-4 text-slate-400 mr-1" />
              {SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAmbientSound(s.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs uppercase font-bold tracking-wider transition ${
                    ambientSound === s.id
                      ? 'bg-[#e9762b] text-black shadow-[0_0_15px_rgba(233,118,43,0.35)] font-extrabold'
                      : 'glass-pill text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* B. DAILY STUDY LOG MODULE                              */}
        {/* ====================================================== */}
        {activeView === 'studylog' && (
          <div className="w-full animate-fadeIn">
            <DailyStudyLog />
          </div>
        )}

        {/* ====================================================== */}
        {/* C. STUDY LOG ANALYSIS MODULE                           */}
        {/* ====================================================== */}
        {activeView === 'analysis' && (
          <div className="w-full animate-fadeIn">
            <StudyLogAnalysis />
          </div>
        )}

        {/* ====================================================== */}
        {/* D. TASK PLANNER MODULE                                 */}
        {/* ====================================================== */}
        {activeView === 'tasks' && (
          <div className="w-full flex flex-col space-y-8 animate-fadeIn font-mono">
            {/* Unified Top Header for Task Planner */}
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-[#e9762b] font-bold block mb-1">
                  STUDY TRACKER
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase font-mono">
                  Task Planner
                </h1>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-mono glass-pill px-3.5 py-2 rounded-xl">
                <span className="text-[#e9762b] font-bold">{pendingTasks.length}</span> pending tasks
              </div>
            </div>

            {/* Inline Add Task Form */}
            <form onSubmit={handleCreateTask} className="p-5 sm:p-6 rounded-2xl glass-panel shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>Add Task</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Task title (e.g. Solve 10 calculus PYQs)..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 glass-input rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none"
                />
                <div className="flex items-center gap-2.5">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="glass-input text-xs font-bold text-white rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer"
                  >
                    <option value="high" className="bg-[#141413] text-white">High Priority</option>
                    <option value="med" className="bg-[#141413] text-white">Medium</option>
                    <option value="low" className="bg-[#141413] text-white">Low</option>
                  </select>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#e9762b] text-black font-extrabold rounded-xl text-xs sm:text-sm hover:brightness-110 transition uppercase tracking-wider shadow-[0_0_15px_rgba(233,118,43,0.3)]"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs sm:text-sm">
              <div className="flex gap-2">
                {(['today', 'upcoming', 'completed'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold transition font-mono ${
                      taskFilter === filter
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">{filteredTasks.length} tasks</span>
            </div>

            {/* Tasks List */}
            <div className="space-y-3 sm:space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="p-12 text-center text-sm sm:text-base text-slate-500 border border-white/5 rounded-2xl glass-panel">
                  No {taskFilter} tasks found.
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 sm:p-5 rounded-2xl glass-panel glass-panel-interactive flex items-center justify-between gap-4 text-sm sm:text-base group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="text-slate-400 hover:text-[#e9762b] flex-shrink-0 transition"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </button>
                      <span
                        className={`truncate ${
                          task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          task.priority === 'high'
                            ? 'bg-orange-500/20 text-[#e9762b] border border-orange-500/30'
                            : task.priority === 'med'
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-white/10'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-40 group-hover:opacity-100 hover:text-rose-400 transition p-1"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* 5. POST-SESSION FOCUS RATING MODAL */}
      {showRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-modal p-6 sm:p-7 space-y-6 rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs uppercase tracking-widest font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e9762b]" />
                Session Complete · Rate Focus
              </h3>
              <button
                onClick={() => setShowRating(false)}
                className="p-1 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-center">
              <span className="text-[11px] opacity-60 uppercase tracking-widest font-bold">Rate session focus (1-5):</span>
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    onClick={() => setRating(starVal)}
                    className="p-1 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        starVal <= rating
                          ? 'text-[#e9762b] fill-[#e9762b]'
                          : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] opacity-60 uppercase tracking-widest font-bold">Notes (optional):</span>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you study during this timer?..."
                className="w-full h-20 glass-input p-3 text-xs text-white focus:outline-none rounded-xl placeholder-slate-700"
              />
            </div>

            <div className="flex justify-end gap-3 text-xs tracking-wider uppercase">
              <button
                onClick={() => setShowRating(false)}
                className="px-4 py-2 glass-pill text-slate-300 hover:text-white rounded-lg transition"
              >
                Cancel
              </button>
              <ShinyButton
                onClick={handleSaveSession}
                label="Save"
                cornerRadius={8}
                className="!px-6 !py-2 !text-xs !font-mono !font-extrabold !uppercase !tracking-wider active:scale-95 transition"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
