import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import HalftoneWordmarkFooter from './ui/halftone-wordmark-footer';
import { DailyStudyLog } from './DailyStudyLog';
import { StudyLogAnalysis } from './StudyLogAnalysis';
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
  { label: '5M', seconds: 5 * 60 },
  { label: '15M', seconds: 15 * 60 },
  { label: '25M (DEFAULT)', seconds: 25 * 60 },
  { label: '45M', seconds: 45 * 60 },
  { label: '1 HOUR', seconds: 60 * 60 },
  { label: '2 HOURS', seconds: 2 * 60 * 60 },
  { label: '4 HOURS', seconds: 4 * 60 * 60 },
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
    dailyLogs,
    distractionNotes,
    ambientSound,
    autoStartNextRound,
    soundAlertOnFinish,
    stopwatchTime,
    stopwatchRunning,
    stopwatchLaps,
    setTimerDuration,
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
          className="text-left group cursor-pointer focus:outline-none flex items-center gap-2"
          title="Direct to Timer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#e9762b] animate-ping" />
          <div>
            <span className="font-extrabold text-sm sm:text-base tracking-widest text-white uppercase group-hover:text-[#e9762b] transition">
              Studyo
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono">
              Daily Log & Focus Suite
            </span>
          </div>
        </button>
      </div>

      {/* Center: Main Bar Navigation Tabs */}
      <div className="order-3 md:order-2 w-full md:w-auto flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-[#141413] border border-white/10 text-[11px] sm:text-xs uppercase tracking-wider font-bold shadow-xl overflow-x-auto">
        <button
          onClick={handleGoToTimer}
          className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg transition font-mono whitespace-nowrap ${
            activeView === 'timer'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-lg shadow-orange-500/25'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>TIMER</span>
        </button>

        <button
          onClick={() => handleSwitchTab('studylog')}
          className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg transition font-mono whitespace-nowrap ${
            activeView === 'studylog'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-lg shadow-orange-500/25'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>STUDY LOG</span>
        </button>

        <button
          onClick={() => handleSwitchTab('analysis')}
          className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg transition font-mono whitespace-nowrap ${
            activeView === 'analysis'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-lg shadow-orange-500/25'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>ANALYSIS</span>
        </button>

        <button
          onClick={() => handleSwitchTab('tasks')}
          className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-lg transition font-mono whitespace-nowrap ${
            activeView === 'tasks'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-lg shadow-orange-500/25'
              : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>TASKS ({pendingTasks.length})</span>
        </button>
      </div>

      {/* Right: Quick Controls */}
      <div className="order-2 md:order-3 flex items-center gap-2 text-xs font-mono">
        {/* Ambient Sound Selector */}
        <div className="hidden sm:flex items-center gap-1 bg-[#141413] border border-white/10 rounded-lg px-2.5 py-1.5">
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
          className="p-2 rounded-lg bg-[#141413] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition"
          title="Fullscreen Focus Mode (Press 'Z')"
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
    if (taskFilter === 'today') return task.dueDate <= new Date().toISOString().split('T')[0];
    if (taskFilter === 'upcoming') return task.dueDate > new Date().toISOString().split('T')[0];
    return true;
  });

  return (
    <div className="min-h-[100dvh] w-full bg-[#0c0c0b] text-[#e9e4da] flex flex-col font-mono selection:bg-orange-500 selection:text-black">
      {/* 1. TOP HEADER NAVIGATION */}
      <header ref={headerRef} className="sticky top-0 z-30 w-full bg-[#0c0c0b]/95 backdrop-blur-md border-b border-white/10">
        {mainBar}
      </header>

      {/* 2. GIANT HALFTONE "STUDY" HERO (ONLY ON TIMER VIEW) */}
      {activeView === 'timer' && (
        <section 
          className="relative w-full min-h-[420px] flex flex-col justify-center items-center border-b border-white/10 overflow-hidden bg-[#0c0c0b]" 
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

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="w-full flex-1 flex flex-col items-center px-3 sm:px-6 py-10 sm:py-16 max-w-5xl mx-auto">
        
        {/* ====================================================== */}
        {/* A. TIMER & STOPWATCH MODULE (Screenshot 2 Match)        */}
        {/* ====================================================== */}
        {activeView === 'timer' && (
          <div id="timer-section" className="w-full flex flex-col items-center space-y-8 sm:space-y-12 animate-fadeIn scroll-mt-24">
            
            {/* Top Bar inside Timer: Mode Switcher (Left) & Real-time Live Clock (Right) */}
            <div className="w-full flex items-center justify-between pb-2 border-b border-white/10">
              {/* Left: Mode Switch [ TIMER ] [ STOPWATCH ] */}
              <div className="flex items-center gap-1 bg-[#141413] border border-white/10 p-1 rounded-lg">
                <button
                  onClick={() => setTimerSubMode('timer')}
                  className={`px-4 py-1.5 rounded text-xs uppercase font-bold tracking-wider transition ${
                    timerSubMode === 'timer'
                      ? 'bg-[#e9762b] text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Timer
                </button>
                <button
                  onClick={() => setTimerSubMode('stopwatch')}
                  className={`px-4 py-1.5 rounded text-xs uppercase font-bold tracking-wider transition ${
                    timerSubMode === 'stopwatch'
                      ? 'bg-[#e9762b] text-black shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Stopwatch
                </button>
              </div>

              {/* Right: Live Clock (Current Real-world time) */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-300">{liveClock}</span>
              </div>
            </div>

            {/* If TIMER SUBMODE: Presets + Countdown Display */}
            {timerSubMode === 'timer' && (
              <>
                {/* Presets Row */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {QUICK_PRESETS.map((p) => {
                    const isCurrent = timer.initialDuration === p.seconds;
                    return (
                      <button
                        key={p.label}
                        onClick={() => setTimerDuration(p.seconds)}
                        className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-bold transition ${
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs bg-[#141413] text-slate-300 hover:text-white border border-[#e9762b]/40 hover:border-[#e9762b] transition uppercase tracking-wider font-bold"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[#e9762b]" />
                    <span>Customize (1s – 24h)</span>
                  </button>
                </div>

                {/* Clock Face: Giant Digits 00 : 25 : 00 with orange seconds glow */}
                <div className="flex flex-col items-center justify-center space-y-4 py-4 w-full">
                  <div className="flex items-baseline justify-center gap-2 sm:gap-4 md:gap-6 text-[3.8rem] min-[400px]:text-[4.6rem] sm:text-[7rem] md:text-[8.5rem] font-bold tracking-tight leading-none select-none">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#f2eee3] font-mono tabular-nums">{hhStr}</span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-semibold mt-2">Hours</span>
                    </div>

                    <div className="text-slate-600 pb-3 sm:pb-6 text-[2.5rem] sm:text-[4.5rem] font-light">:</div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#f2eee3] font-mono tabular-nums">{mmStr}</span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-semibold mt-2">Minutes</span>
                    </div>

                    <div className="text-slate-600 pb-3 sm:pb-6 text-[2.5rem] sm:text-[4.5rem] font-light">:</div>

                    {/* Seconds */}
                    <div className="flex flex-col items-center relative">
                      <div className="absolute inset-0 bg-[#e9762b]/15 blur-2xl rounded-full pointer-events-none" />
                      <span className="text-[#e9762b] drop-shadow-[0_0_35px_rgba(233,118,43,0.35)] font-mono tabular-nums relative z-10">{ssStr}</span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#e9762b]/80 font-semibold mt-2 relative z-10">Seconds</span>
                    </div>
                  </div>

                  {/* Quick Adjust Row */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 text-[11px] text-slate-400">
                    <span className="opacity-50 uppercase tracking-widest text-[10px] mr-1 font-bold">Quick Adjust:</span>
                    {[
                      { label: '+1H', sec: 3600 },
                      { label: '+10M', sec: 600 },
                      { label: '+1M', sec: 60 },
                      { label: '+30S', sec: 30 },
                      { label: '+10S', sec: 10 },
                      { label: '-1M', sec: -60 },
                      { label: '-10S', sec: -10 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        onClick={() => handleAdjustSeconds(btn.sec)}
                        className="px-2.5 py-1 rounded bg-[#141413] border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition font-mono active:scale-95"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Action Controls Row */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs tracking-widest uppercase">
                  {timer.isRunning ? (
                    <button
                      onClick={pauseTimer}
                      className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-[#e9762b] text-black font-extrabold rounded-lg hover:bg-orange-500 transition active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                      <Pause className="w-4 h-4 fill-black" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={startTimer}
                      className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-[#e9762b] text-black font-extrabold rounded-lg hover:bg-orange-500 transition active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>Start</span>
                    </button>
                  )}

                  <button
                    onClick={resetTimer}
                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#181817] hover:bg-[#222220] border border-white/10 hover:border-white/20 text-[#f2eee3] font-bold transition active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>Reset</span>
                  </button>

                  <button
                    onClick={handleFinish}
                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#111f18] hover:bg-[#14281e] border border-[#10b981]/40 text-[#10b981] font-bold transition active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>Finish</span>
                  </button>

                  <button
                    onClick={() => setZenMode(true)}
                    className="p-3 rounded-lg bg-[#181817] hover:bg-[#222220] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition active:scale-95"
                    title="Fullscreen Focus Mode (Press 'Z')"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Settings Toggles Row (Screenshot 2) */}
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-1 text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {/* Auto-start next round */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <span className="text-[11px] sm:text-xs">Auto-start next round</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoStartNextRound}
                      onClick={() => setAutoStartNextRound(!autoStartNextRound)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                        autoStartNextRound ? 'bg-[#e9762b]' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                          autoStartNextRound ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  {/* Sound alert on finish */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <span className="text-[11px] sm:text-xs">Sound alert on finish</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={soundAlertOnFinish}
                      onClick={() => setSoundAlertOnFinish(!soundAlertOnFinish)}
                      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
                        soundAlertOnFinish ? 'bg-[#e9762b]' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-black transition-transform ${
                          soundAlertOnFinish ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </>
            )}

            {/* If STOPWATCH SUBMODE: Stopwatch Display + Lap Controls */}
            {timerSubMode === 'stopwatch' && (
              <div className="w-full flex flex-col items-center space-y-6">
                {/* Stopwatch Digits */}
                <div className="flex flex-col items-center justify-center space-y-4 py-4 w-full">
                  <div className="flex items-baseline justify-center gap-2 sm:gap-4 md:gap-6 text-[3.8rem] min-[400px]:text-[4.6rem] sm:text-[7rem] md:text-[8.5rem] font-bold tracking-tight leading-none select-none">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#f2eee3] font-mono tabular-nums">{swHhStr}</span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-semibold mt-2">Hours</span>
                    </div>

                    <div className="text-slate-600 pb-3 sm:pb-6 text-[2.5rem] sm:text-[4.5rem] font-light">:</div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <span className="text-[#f2eee3] font-mono tabular-nums">{swMmStr}</span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-semibold mt-2">Minutes</span>
                    </div>

                    <div className="text-slate-600 pb-3 sm:pb-6 text-[2.5rem] sm:text-[4.5rem] font-light">:</div>

                    {/* Seconds */}
                    <div className="flex flex-col items-center relative">
                      <div className="absolute inset-0 bg-[#e9762b]/15 blur-2xl rounded-full pointer-events-none" />
                      <span className="text-[#e9762b] drop-shadow-[0_0_35px_rgba(233,118,43,0.35)] font-mono tabular-nums relative z-10">{swSsStr}</span>
                      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#e9762b]/80 font-semibold mt-2 relative z-10">Seconds</span>
                    </div>
                  </div>
                </div>

                {/* Stopwatch Controls */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs tracking-widest uppercase">
                  {stopwatchRunning ? (
                    <button
                      onClick={pauseStopwatch}
                      className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-[#e9762b] text-black font-extrabold rounded-lg hover:bg-orange-500 transition active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                      <Pause className="w-4 h-4 fill-black" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      onClick={startStopwatch}
                      className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-[#e9762b] text-black font-extrabold rounded-lg hover:bg-orange-500 transition active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                      <Play className="w-4 h-4 fill-black" />
                      <span>Start</span>
                    </button>
                  )}

                  <button
                    onClick={lapStopwatch}
                    disabled={!stopwatchRunning}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg border text-xs uppercase font-bold transition active:scale-95 ${
                      stopwatchRunning
                        ? 'bg-[#181817] hover:bg-[#222220] border-white/20 text-[#f2eee3]'
                        : 'opacity-40 border-white/5 cursor-not-allowed text-slate-500'
                    }`}
                  >
                    <TimerIcon className="w-4 h-4" />
                    <span>Lap</span>
                  </button>

                  <button
                    onClick={resetStopwatch}
                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-[#181817] hover:bg-[#222220] border border-white/10 hover:border-white/20 text-[#f2eee3] font-bold transition active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    <span>Reset</span>
                  </button>

                  <button
                    onClick={() => setZenMode(true)}
                    className="p-3 rounded-lg bg-[#181817] hover:bg-[#222220] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition active:scale-95"
                    title="Fullscreen Focus Mode (Press 'Z')"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Lap List Table */}
                {stopwatchLaps.length > 0 && (
                  <div className="w-full max-w-xl bg-[#141413] border border-white/10 rounded-xl p-4 mt-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wider font-bold text-slate-400 pb-2 border-b border-white/10">
                      <span>Lap</span>
                      <span>Lap Split</span>
                      <span>Total Time</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2">
                      {stopwatchLaps.map((lap) => (
                        <div key={lap.id} className="flex items-center justify-between text-xs text-slate-300 py-1 border-b border-white/5">
                          <span className="font-bold text-[#e9762b]">Lap {lap.lapNumber}</span>
                          <span className="font-mono text-slate-300">+{formatLapTime(lap.lapDurationSeconds)}</span>
                          <span className="font-mono text-white font-bold">{formatLapTime(lap.timestampSeconds)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Scratchpad Card (Exact Screenshot 2 Match) */}
            <div className="w-full max-w-2xl p-4 sm:p-5 rounded-xl bg-[#141413] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-slate-400" />
                  <span className="uppercase tracking-widest font-bold text-slate-200">Quick Scratchpad:</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">{distractionNotes.length} notes</span>
              </div>

              {/* Input row */}
              <form onSubmit={handleAddDistraction} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Note down stray thoughts without losing focus..."
                  value={scratchpadText}
                  onChange={(e) => setScratchpadText(e.target.value)}
                  className="flex-1 bg-[#0c0c0b] border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#e9762b] transition font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#222220] hover:bg-[#2c2c28] text-white rounded-lg text-xs font-bold uppercase transition"
                >
                  Add
                </button>
              </form>

              {/* List of notes */}
              {distractionNotes.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 pt-1">
                  {distractionNotes.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c0c0b] border border-white/5 text-xs group"
                    >
                      <span className="text-slate-300 truncate max-w-[280px] sm:max-w-md font-mono">{n.text}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => convertDistractionToTask(n.id)}
                          className="flex items-center gap-1 text-[11px] text-[#10b981] hover:underline font-bold uppercase"
                          title="Convert to Task"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Task</span>
                        </button>
                        <button
                          onClick={() => deleteDistraction(n.id)}
                          className="text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ambient Sound Bar (Screenshot 2 Match) */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs pt-2">
              <Volume2 className="w-4 h-4 text-slate-500 mr-1" />
              {SOUNDS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setAmbientSound(s.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs uppercase font-bold tracking-wider transition ${
                    ambientSound === s.id
                      ? 'bg-[#e9762b] text-black shadow-sm'
                      : 'bg-[#141413] text-slate-400 hover:text-white border border-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================== */}
        {/* B. DAILY STUDY LOG MODULE (Screenshot 3 & 4 Match)      */}
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
          <div className="w-full max-w-3xl flex flex-col space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h1 className="text-xl font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#e9762b]" />
                  Task Planner · Actionables
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Priorities, to-dos, and exam countdowns
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                <span className="text-[#e9762b] font-bold">{pendingTasks.length}</span> pending tasks
              </div>
            </div>

            {/* Inline Add Task Form */}
            <form onSubmit={handleCreateTask} className="p-4 rounded-xl bg-[#141413] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                <span>Add Task</span>
                <span className="text-[10px] text-slate-500">Press Enter to save</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Task title (e.g. Solve 10 calculus PYQs)..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-black border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="bg-black border border-white/15 text-xs text-white rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#e9762b]"
                  >
                    <option value="high">High Priority</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#e9762b] text-black font-extrabold rounded-lg text-xs hover:brightness-110 transition uppercase tracking-wider"
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
                  No {taskFilter} tasks found.
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
      </main>

      {/* 4. CUSTOM TIMER MODAL (1s to 24h) */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141413] border border-white/20 p-6 space-y-6 shadow-2xl rounded-2xl">
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
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={inputHours}
                  onChange={(e) => setInputHours(Math.max(0, Math.min(24, Number(e.target.value))))}
                  className="w-full text-center text-2xl font-bold bg-black border border-white/20 rounded-lg py-2 text-white focus:outline-none focus:border-[#e9762b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputMinutes}
                  onChange={(e) => setInputMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-full text-center text-2xl font-bold bg-black border border-white/20 rounded-lg py-2 text-white focus:outline-none focus:border-[#e9762b]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputSeconds}
                  onChange={(e) => setInputSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                  className="w-full text-center text-2xl font-bold bg-black border border-white/20 rounded-lg py-2 text-[#e9762b] focus:outline-none focus:border-[#e9762b]"
                />
              </div>
            </div>

            {/* Quick Presets Inside Modal */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '25m (Default)', h: 0, m: 25, s: 0 },
                  { label: '5m', h: 0, m: 5, s: 0 },
                  { label: '45m', h: 0, m: 45, s: 0 },
                  { label: '1 Hour', h: 1, m: 0, s: 0 },
                  { label: '2 Hours', h: 2, m: 0, s: 0 },
                  { label: '4 Hours', h: 4, m: 0, s: 0 },
                ].map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => {
                      setInputHours(qp.h);
                      setInputMinutes(qp.m);
                      setInputSeconds(qp.s);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-white/5 hover:bg-white/15 border border-white/10 rounded text-slate-300 font-mono"
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
                className="px-4 py-2 border border-white/10 opacity-70 hover:opacity-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomTime}
                className="px-6 py-2 bg-[#e9762b] text-black font-extrabold hover:brightness-110 rounded-lg transition"
              >
                Set Timer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. POST-SESSION FOCUS RATING MODAL */}
      {showRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141413] border border-white/20 p-6 space-y-6 shadow-2xl rounded-2xl">
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
                className="w-full h-20 bg-black border border-white/15 p-3 text-xs text-white focus:outline-none focus:border-[#e9762b] rounded-lg placeholder-slate-700"
              />
            </div>

            <div className="flex justify-end gap-3 text-xs tracking-wider uppercase">
              <button
                onClick={() => setShowRating(false)}
                className="px-4 py-2 border border-white/10 opacity-70 hover:opacity-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSession}
                className="px-6 py-2 bg-[#e9762b] text-black font-extrabold hover:brightness-110 rounded-lg transition"
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
