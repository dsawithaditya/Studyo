import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import HalftoneWordmarkFooter, { FooterColumn } from './ui/halftone-wordmark-footer';
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
  ChevronRight,
  ChevronDown,
  Globe
} from 'lucide-react';
import { SoundType } from '../services/soundSynth';
import { TaskPriority } from '../types';

const QUICK_PRESETS = [
  { label: '25m (Default)', seconds: 25 * 60 },
  { label: '5m', seconds: 5 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '45m', seconds: 45 * 60 },
  { label: '1 Hour', seconds: 60 * 60 },
  { label: '2 Hours', seconds: 2 * 60 * 60 },
  { label: '4 Hours', seconds: 4 * 60 * 60 },
];

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
    language,
    distractionNotes,
    ambientSound,
    ambientVolume,
    examCountdowns,
    setTimerDuration,
    startTimer,
    pauseTimer,
    resetTimer,
    tickTimer,
    logSession,
    setZenMode,
    setAmbientSound,
    setAmbientVolume,
    setLanguage,
    addDistraction,
    deleteDistraction,
    convertDistractionToTask,
    addTask,
    toggleTask,
    deleteTask,
    addExamCountdown,
    deleteExamCountdown,
  } = useStudyStore();

  // Active Main View Tab: 'timer' | 'tasks' | 'analytics'
  const [activeView, setActiveView] = useState<'timer' | 'tasks' | 'analytics'>('timer');

  // Custom time inputs (1 second to 24 hours)
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(25);
  const [inputSeconds, setInputSeconds] = useState(0);

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

  // Today study calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.dateString === todayStr);
  const todayStudyMins = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const todayHours = (todayStudyMins / 60).toFixed(1);
  const targetHours = (user.dailyTargetMinutes / 60).toFixed(1);
  const targetPct = Math.min(100, Math.round((todayStudyMins / user.dailyTargetMinutes) * 100));

  const pendingTasks = tasks.filter((t) => !t.completed);
  const topPendingTask = pendingTasks[0];

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
        if (timer.isRunning) pauseTimer();
        else startTimer();
      } else if (e.key === 'z' || e.key === 'Z') {
        setZenMode(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer.isRunning, pauseTimer, startTimer, setZenMode]);

  // Hours, Minutes, Seconds formatting
  const totalSeconds = timer.timeLeft;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hhStr = String(hours).padStart(2, '0');
  const mmStr = String(minutes).padStart(2, '0');
  const ssStr = String(seconds).padStart(2, '0');

  // Quick adjust duration (+ / - seconds)
  const handleAdjustSeconds = (deltaSeconds: number) => {
    const currentInitial = timer.initialDuration || 25 * 60;
    const newTotal = Math.max(1, Math.min(24 * 3600, currentInitial + deltaSeconds));
    setTimerDuration(newTotal);
  };

  // Apply custom time from modal (1 second to 24 hours)
  const handleApplyCustomTime = () => {
    const total = (inputHours * 3600) + (inputMinutes * 60) + inputSeconds;
    const validTotal = Math.max(1, Math.min(24 * 3600, total));
    setTimerDuration(validTotal);
    setShowCustomModal(false);
  };

  const handleOpenCustomModal = () => {
    const current = timer.initialDuration || timer.timeLeft || 25 * 60;
    setInputHours(Math.floor(current / 3600));
    setInputMinutes(Math.floor((current % 3600) / 60));
    setInputSeconds(current % 60);
    setShowCustomModal(true);
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

  // Handle Create Exam Countdown
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExamTitle.trim() && newExamDate) {
      addExamCountdown(newExamTitle.trim(), 'sub-general', newExamDate);
      setNewExamTitle('');
      setNewExamDate('');
      setShowAddExam(false);
    }
  };

  // Language cycle
  const handleCycleLanguage = () => {
    const langMap: Record<string, 'en' | 'hinglish' | 'hi'> = {
      en: 'hinglish',
      hinglish: 'hi',
      hi: 'en',
    };
    setLanguage(langMap[language] || 'en');
  };

  // Tab switcher with instant scroll to top
  const handleSwitchTab = (tab: 'timer' | 'tasks' | 'analytics') => {
    setActiveView(tab);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // Direct immediately down to timer under study text
  const handleGoToTimer = () => {
    setActiveView('timer');
    setTimeout(() => {
      const el = document.getElementById('timer-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  // Top Main Bar (1st Image) persistent on top across the whole website
  const mainBar = (
    <div className="w-full px-3 sm:px-8 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
      {/* Left: Brand & Live Stats */}
      <div className="flex items-center gap-4 order-1">
        <button 
          onClick={handleGoToTimer}
          className="text-left group cursor-pointer focus:outline-none"
          title="Direct to Timer"
        >
          <span className="font-extrabold text-sm sm:text-base tracking-widest text-white uppercase flex items-center gap-2 group-hover:text-[#e9762b] transition">
            <span className="w-2 h-2 rounded-full bg-[#e9762b] animate-ping" />
            Studyo
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">
            Focus & Analytics Suite
          </span>
        </button>

        <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-white/10 text-xs font-mono">
          <button
            onClick={() => handleSwitchTab('analytics')}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition"
            title="View Streak in Analytics"
          >
            <Flame className="w-3.5 h-3.5 text-[#e9762b] fill-[#e9762b]" />
            <span className="font-bold text-white">{user.streakDays}d Streak</span>
          </button>
          <span className="text-slate-600">·</span>
          <button
            onClick={() => handleSwitchTab('analytics')}
            className="flex items-center gap-1 text-slate-300 hover:text-white transition"
            title="View Daily Target in Analytics"
          >
            <Target className="w-3.5 h-3.5 text-[#e9762b]" />
            <span>{todayHours}/{targetHours}h</span>
          </button>
        </div>
      </div>

      {/* Center: Main Bar Pill Tabs (Exact 1st Image) */}
      <div className="order-3 md:order-2 w-full md:w-auto flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-[#141413] border border-white/10 text-[11px] sm:text-xs uppercase tracking-wider font-bold shadow-xl">
        <button
          onClick={handleGoToTimer}
          className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-2 rounded-lg transition font-mono ${
            activeView === 'timer'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-lg shadow-orange-500/25'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>TIMER</span>
        </button>

        <button
          onClick={() => handleSwitchTab('tasks')}
          className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-2 rounded-lg transition font-mono ${
            activeView === 'tasks'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-lg shadow-orange-500/25'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>TASKS ({pendingTasks.length})</span>
        </button>

        <button
          onClick={() => handleSwitchTab('analytics')}
          className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-2 rounded-lg transition font-mono ${
            activeView === 'analytics'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-lg shadow-orange-500/25'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ANALYTICS</span>
        </button>
      </div>

      {/* Right: Quick Utility Controls */}
      <div className="order-2 md:order-3 flex items-center gap-2 text-xs font-mono">
        {/* Ambient Sound Selector */}
        <div className="flex items-center gap-1 bg-[#141413] border border-white/10 rounded-lg px-2.5 py-1.5">
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

        {/* Zen Mode Button */}
        <button
          onClick={() => setZenMode(true)}
          className="p-2 rounded-lg bg-[#141413] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition"
          title="Fullscreen Zen Mode (Press 'Z')"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  // Filtered tasks for Tasks view
  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === 'completed') return task.completed;
    if (task.completed) return false;
    if (taskFilter === 'today') return task.dueDate <= todayStr;
    if (taskFilter === 'upcoming') return task.dueDate > todayStr;
    return true;
  });

  // Analytics peak hours computation
  let morningMins = 0;
  let afternoonMins = 0;
  let nightMins = 0;
  sessions.forEach((s) => {
    if (s.hour >= 5 && s.hour < 12) morningMins += s.durationMinutes;
    else if (s.hour >= 12 && s.hour < 18) afternoonMins += s.durationMinutes;
    else nightMins += s.durationMinutes;
  });
  const totalPeakMins = morningMins + afternoonMins + nightMins || 1;
  const morningPct = Math.round((morningMins / totalPeakMins) * 100);
  const afternoonPct = Math.round((afternoonMins / totalPeakMins) * 100);
  const nightPct = Math.round((nightMins / totalPeakMins) * 100);

  // 30-day activity map
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const ds = d.toISOString().split('T')[0];
    const mins = sessions
      .filter((s) => s.dateString === ds)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    return { date: ds, mins };
  });

  return (
    <div className="min-h-[100dvh] w-full bg-[#0c0c0b] text-[#e9e4da] flex flex-col font-mono selection:bg-orange-500 selection:text-black">
      {/* ======================================================== */}
      {/* 1. TOP: MAIN BAR ON TOP (STICKY ACROSS WHOLE WEBSITE)     */}
      {/* ======================================================== */}
      <header ref={headerRef} className="sticky top-0 z-30 w-full bg-[#0c0c0b]/95 backdrop-blur-md border-b border-white/10">
        {mainBar}
      </header>

      {/* ======================================================== */}
      {/* 2. GIANT HALFTONE "STUDY" - FULL SCREEN HERO (TIMER TAB) */}
      {/* ======================================================== */}
      {activeView === 'timer' && (
        <section className="relative w-full min-h-[420px] flex flex-col justify-center items-center border-b border-white/10 overflow-hidden bg-[#0c0c0b]" style={{ height: heroHeight }}>
          <HalftoneWordmarkFooter
            wordmark="study"
            label=""
            meta=""
            columns={[]}
            backToTop={false}
            crop={0}
            dotGap={7}
            radius={110}
            height={heroHeight}
          />

          {/* Smooth Scroll Cue to Timer */}
          <button
            onClick={handleGoToTimer}
            className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5 opacity-60 hover:opacity-100 transition cursor-pointer group"
            title="Scroll down to Timer"
            aria-label="Scroll down to timer"
          >
            <span className="text-[10px] sm:text-xs uppercase font-mono tracking-widest text-slate-400 group-hover:text-[#e9762b] transition">
              Scroll to Timer
            </span>
            <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-[#e9762b] animate-bounce" />
          </button>
        </section>
      )}

      {/* ======================================================== */}
      {/* 3. VIEW CONTAINER                                        */}
      {/* ======================================================== */}
      <main className="w-full flex-1 flex flex-col items-center px-3 sm:px-8 py-14 sm:py-28 max-w-5xl mx-auto">
        
        {/* ====================================================== */}
        {/* A. TIMER VIEW (Simple Timer 1s - 24h, HH:MM:SS)        */}
        {/* ====================================================== */}
        {activeView === 'timer' && (
          <div id="timer-section" className="w-full flex flex-col items-center space-y-10 sm:space-y-16 animate-fadeIn scroll-mt-32 md:scroll-mt-24">
            


            {/* Quick Presets Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {QUICK_PRESETS.map((p) => {
                const isCurrent = timer.initialDuration === p.seconds;
                return (
                  <button
                    key={p.label}
                    onClick={() => setTimerDuration(p.seconds)}
                    className={`px-3.5 py-1.5 rounded text-xs uppercase tracking-wider font-bold transition ${
                      isCurrent
                        ? 'bg-[#e9762b] text-black shadow-lg shadow-orange-500/20'
                        : 'bg-[#141413] text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
              <button
                onClick={handleOpenCustomModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs bg-[#141413] text-slate-300 hover:text-white border border-[#e9762b]/40 hover:border-[#e9762b] transition uppercase tracking-wider"
              >
                <Sliders className="w-3.5 h-3.5 text-[#e9762b]" />
                <span>Customize (1s – 24h)</span>
              </button>
            </div>

            {/* Big High-Contrast Digital Display: HH : MM : SS */}
            <div className="flex flex-col items-center justify-center space-y-4 py-2">
              <div className="flex items-baseline justify-center">
                <div
                  className="font-black leading-none tabular-nums select-none tracking-tight text-white drop-shadow-2xl flex items-baseline gap-0.5 sm:gap-4"
                  style={{ fontFamily: '"Inter Tight", system-ui, sans-serif', fontSize: 'clamp(52px, 19vw, 240px)' }}
                >
                  <div className="flex flex-col items-center">
                    <span>{hhStr}</span>
                    <span className="text-[11px] sm:text-sm font-mono font-normal tracking-widest text-slate-500 uppercase mt-2">Hours</span>
                  </div>
                  <span className="text-slate-600 font-extralight select-none px-1 sm:px-2">:</span>
                  <div className="flex flex-col items-center">
                    <span>{mmStr}</span>
                    <span className="text-[11px] sm:text-sm font-mono font-normal tracking-widest text-slate-500 uppercase mt-2">Minutes</span>
                  </div>
                  <span className="text-slate-600 font-extralight select-none px-1 sm:px-2">:</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[#e9762b] drop-shadow-[0_0_35px_rgba(233,118,43,0.35)]">{ssStr}</span>
                    <span className="text-[11px] sm:text-sm font-mono font-normal tracking-widest text-[#e9762b]/80 uppercase mt-2">Seconds</span>
                  </div>
                </div>
              </div>

              {/* Quick Increment/Decrement Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 text-[11px] text-slate-400">
                <span className="opacity-40 uppercase tracking-widest text-[10px] mr-1">Quick Adjust:</span>
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
                    className="px-2 py-0.5 rounded bg-black/60 border border-white/10 hover:border-white/30 hover:text-white transition"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Primary Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs tracking-widest uppercase">
              {timer.isRunning ? (
                <button
                  onClick={pauseTimer}
                  className="flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-[#e9e4da] text-black font-extrabold hover:bg-white transition active:scale-95"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={startTimer}
                  className="flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-[#e9762b] text-black font-extrabold hover:brightness-110 transition active:scale-95 shadow-lg shadow-orange-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start</span>
                </button>
              )}

              <button
                onClick={resetTimer}
                className="flex items-center gap-2 px-5 py-3.5 border border-white/20 hover:bg-white/10 transition active:scale-95"
                title="Reset to Initial Duration"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-5 py-3.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition active:scale-95"
                title="Finish & Save Session"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Finish</span>
              </button>

              <button
                onClick={() => setZenMode(true)}
                className="p-3.5 rounded border border-white/20 hover:bg-white/10 transition active:scale-95 text-slate-300 hover:text-white"
                title="Fullscreen Zen Mode (Press 'Z')"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Distraction Scratchpad */}
            <div className="w-full max-w-xl p-4 rounded-xl bg-[#141413] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-[#e9762b]" />
                  <span className="uppercase tracking-widest font-bold">Quick Scratchpad:</span>
                </div>
                <span className="text-[11px] text-slate-500">{distractionNotes.length} notes</span>
              </div>

              <form onSubmit={handleAddDistraction} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Note down stray thoughts without losing focus..."
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  className="flex-1 bg-black border border-white/15 rounded px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-bold transition"
                >
                  Add
                </button>
              </form>

              {distractionNotes.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {distractionNotes.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5 text-xs"
                    >
                      <span className="text-slate-300 truncate max-w-[280px] sm:max-w-md">{n.text}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => convertDistractionToTask(n.id)}
                          className="text-[10px] text-[#e9762b] hover:underline"
                          title="Convert to Task"
                        >
                          → Task
                        </button>
                        <button
                          onClick={() => deleteDistraction(n.id)}
                          className="text-slate-500 hover:text-rose-400"
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
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <Volume2 className="w-3.5 h-3.5 text-slate-500 mr-1" />
              {SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAmbientSound(s.id)}
                  className={`px-2.5 py-1 rounded border text-[11px] transition ${
                    ambientSound === s.id
                      ? 'border-[#e9762b] text-[#e9762b] bg-[#e9762b]/10'
                      : 'border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* B. TASKS VIEW (Minimalist Task Planner from PDF)        */}
        {/* ====================================================== */}
        {activeView === 'tasks' && (
          <div className="w-full max-w-3xl flex flex-col space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h1 className="text-xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#e9762b]" />
                  Task Planner · Actionables
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Priorities, daily to-dos, and exam countdowns
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                <span className="text-[#e9762b] font-bold">{pendingTasks.length}</span> pending tasks
              </div>
            </div>
            
            {/* Exam Countdown Card */}
            {examCountdowns.length > 0 && (
              <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-[#e9762b]" />
                  <span className="font-bold text-white">{examCountdowns[0].title}</span>
                  <span className="text-slate-400">· {examCountdowns[0].examDate}</span>
                </div>
                <button
                  onClick={() => deleteExamCountdown(examCountdowns[0].id)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Inline Add Task Form */}
            <form onSubmit={handleCreateTask} className="p-4 rounded-xl bg-[#141413] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>Add Task</span>
                <span className="text-[10px] text-slate-500">Press Enter to save</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Task title (e.g. Solve 10 calculus problems)..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-black border border-white/15 rounded px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="bg-black border border-white/15 text-xs text-white rounded px-2.5 py-2 focus:outline-none focus:border-[#e9762b]"
                  >
                    <option value="high">High Priority</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#e9762b] text-black font-extrabold rounded text-xs hover:brightness-110 transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>

            {/* Filter Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
              <div className="flex gap-2">
                {(['today', 'upcoming', 'completed'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTaskFilter(filter)}
                    className={`px-3 py-1 rounded text-xs uppercase tracking-wider transition ${
                      taskFilter === filter
                        ? 'bg-white/10 text-white font-bold'
                        : 'text-slate-500 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500">{filteredTasks.length} tasks</span>
            </div>

            {/* Tasks List */}
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 border border-white/5 rounded-xl">
                  No {taskFilter} tasks found. Keep up the great work!
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-[#141413] border border-white/10 flex items-center justify-between gap-3 text-xs hover:border-white/20 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="text-slate-400 hover:text-[#e9762b] flex-shrink-0"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
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

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
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
                        className="opacity-40 group-hover:opacity-100 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* C. ANALYTICS VIEW (Minimalist Analytics Hub from PDF)   */}
        {/* ====================================================== */}
        {activeView === 'analytics' && (
          <div className="w-full max-w-3xl flex flex-col space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h1 className="text-xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#e9762b]" />
                  Analytics Hub · Focus Insights
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Activity heatmap, consistency streak, and circadian productivity distribution
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                <span className="text-[#e9762b] font-bold">{sessions.length}</span> sessions logged
              </div>
            </div>
            
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#141413] border border-white/10 flex flex-col justify-between">
                <span className="text-[11px] uppercase tracking-widest text-slate-500">Daily Target</span>
                <div className="text-2xl font-extrabold text-white mt-2">
                  {todayHours} <span className="text-sm font-normal text-slate-500">/ {targetHours}h</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 mt-3 overflow-hidden">
                  <div
                    className="h-full bg-[#e9762b] rounded-full"
                    style={{ width: `${targetPct}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141413] border border-white/10 flex flex-col justify-between">
                <span className="text-[11px] uppercase tracking-widest text-slate-500">Study Streak</span>
                <div className="text-2xl font-extrabold text-[#e9762b] flex items-center gap-1.5 mt-2">
                  <Flame className="w-6 h-6 fill-current" />
                  <span>{user.streakDays} Days</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-3">Consistency goal active</span>
              </div>

              <div className="p-4 rounded-xl bg-[#141413] border border-white/10 flex flex-col justify-between">
                <span className="text-[11px] uppercase tracking-widest text-slate-500">Total Logged</span>
                <div className="text-2xl font-extrabold text-white mt-2">
                  {sessions.length} <span className="text-sm font-normal text-slate-500">sessions</span>
                </div>
                <span className="text-[11px] text-slate-400 mt-3">Stored locally & safe</span>
              </div>
            </div>

            {/* GitHub-style 30-Day Activity Heatmap */}
            <div className="p-5 rounded-xl bg-[#141413] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-300">
                  <Calendar className="w-4 h-4 text-[#e9762b]" />
                  <span>30-Day Activity Heatmap</span>
                </div>
                <span className="text-[11px] text-slate-500">Focus hours distribution</span>
              </div>

              <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 pt-2">
                {last30Days.map((d) => {
                  let bg = 'bg-white/5';
                  if (d.mins >= 120) bg = 'bg-[#e9762b]';
                  else if (d.mins >= 60) bg = 'bg-[#e9762b]/70';
                  else if (d.mins >= 25) bg = 'bg-[#e9762b]/40';
                  else if (d.mins > 0) bg = 'bg-[#e9762b]/20';

                  return (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.mins} mins studied`}
                      className={`h-7 rounded border border-white/5 ${bg} transition hover:scale-110 flex items-center justify-center`}
                    >
                      <span className="text-[9px] text-black/60 font-bold select-none">
                        {d.mins > 0 ? `${Math.round(d.mins / 60)}h` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500 pt-2">
                <span>Less</span>
                <div className="w-3 h-3 rounded bg-white/5 border border-white/5" />
                <div className="w-3 h-3 rounded bg-[#e9762b]/20" />
                <div className="w-3 h-3 rounded bg-[#e9762b]/40" />
                <div className="w-3 h-3 rounded bg-[#e9762b]/70" />
                <div className="w-3 h-3 rounded bg-[#e9762b]" />
                <span>More</span>
              </div>
            </div>

            {/* Peak Productivity Hours Bar */}
            <div className="p-5 rounded-xl bg-[#141413] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#e9762b]" />
                  <span>Peak Focus Time</span>
                </div>
                <span className="text-[11px] text-slate-500">Circadian study rhythm</span>
              </div>

              <div className="w-full h-3 rounded-full overflow-hidden flex bg-white/5">
                <div
                  style={{ width: `${morningPct}%` }}
                  className="bg-amber-400/90 h-full transition-all"
                  title={`Morning: ${morningPct}%`}
                />
                <div
                  style={{ width: `${afternoonPct}%` }}
                  className="bg-[#e9762b] h-full transition-all"
                  title={`Afternoon: ${afternoonPct}%`}
                />
                <div
                  style={{ width: `${nightPct}%` }}
                  className="bg-indigo-400/90 h-full transition-all"
                  title={`Night: ${nightPct}%`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Morning {morningPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sunset className="w-3.5 h-3.5 text-[#e9762b]" />
                  <span>Afternoon {afternoonPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Night {nightPct}%</span>
                </div>
              </div>
            </div>

            {/* Recent Session Logs */}
            <div className="p-5 rounded-xl bg-[#141413] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                <span>Recent Focus Logs</span>
                <span className="text-[11px] text-slate-500">Past 5 sessions</span>
              </div>

              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded bg-black/40 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{s.subjectName || 'Deep Focus'}</span>
                      <span className="text-[11px] text-slate-500">
                        {s.dateString} · {s.durationMinutes} mins
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= s.focusRating
                              ? 'text-[#e9762b] fill-[#e9762b]'
                              : 'text-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 4. CUSTOM TIMER MODAL (1s to 24h)                        */}
      {/* ======================================================== */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141413] border border-white/20 p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs uppercase tracking-widest font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#e9762b]" />
                Customize Timer (1s – 24h)
              </h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Inputs for Hours, Minutes, Seconds */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={inputHours}
                  onChange={(e) => setInputHours(Math.max(0, Math.min(24, Number(e.target.value))))}
                  className="w-full text-center text-2xl font-bold bg-black border border-white/20 rounded py-2 text-white focus:outline-none focus:border-[#e9762b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-full text-center text-2xl font-bold bg-black border border-white/20 rounded py-2 text-white focus:outline-none focus:border-[#e9762b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputSeconds}
                  onChange={(e) => setInputSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-full text-center text-2xl font-bold bg-black border border-white/20 rounded py-2 text-[#e9762b] focus:outline-none focus:border-[#e9762b]"
                />
              </div>
            </div>

            {/* Quick Presets Shortcut Inside Modal */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Default 25m', h: 0, m: 25, s: 0 },
                  { label: '5m', h: 0, m: 5, s: 0 },
                  { label: '30s', h: 0, m: 0, s: 30 },
                  { label: '10s', h: 0, m: 0, s: 10 },
                  { label: '1 Hour', h: 1, m: 0, s: 0 },
                  { label: '3 Hours', h: 3, m: 0, s: 0 },
                ].map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => {
                      setInputHours(qp.h);
                      setInputMinutes(qp.m);
                      setInputSeconds(qp.s);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-white/5 hover:bg-white/15 border border-white/10 rounded text-slate-300"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 text-xs tracking-wider uppercase pt-2">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 border border-white/10 opacity-70 hover:opacity-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomTime}
                className="px-6 py-2 bg-[#e9762b] text-black font-extrabold hover:brightness-110 rounded transition"
              >
                Set Timer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. POST-SESSION FOCUS RATING MODAL                       */}
      {/* ======================================================== */}
      {showRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141413] border border-white/20 p-6 space-y-6 shadow-2xl">
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
              <span className="text-[11px] opacity-60 uppercase tracking-widest">Rate session focus (1-5):</span>
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
              <span className="text-[11px] opacity-60 uppercase tracking-widest">Notes:</span>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you study during this timer?..."
                className="w-full h-20 bg-black border border-white/15 p-3 text-xs text-white focus:outline-none focus:border-[#e9762b] rounded placeholder-slate-700"
              />
            </div>

            <div className="flex justify-end gap-3 text-xs tracking-wider uppercase">
              <button
                onClick={() => setShowRating(false)}
                className="px-4 py-2 border border-white/10 opacity-70 hover:opacity-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                className="px-6 py-2 bg-[#e9762b] text-black font-extrabold hover:brightness-110 rounded transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
