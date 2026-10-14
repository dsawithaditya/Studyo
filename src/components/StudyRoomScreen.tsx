import React, { useState, useEffect } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { translations } from '../i18n/translations';
import { SoundType } from '../services/soundSynth';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  Trash2, 
  CheckSquare, 
  Star, 
  Clock, 
  Sliders,
  Wind
} from 'lucide-react';

export const StudyRoomScreen: React.FC = () => {
  const { 
    language, 
    timer, 
    subjects, 
    distractionNotes, 
    ambientSound, 
    ambientVolume,
    zenMode,
    setTimerMode, 
    setActiveSubject, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    tickTimer,
    logSession, 
    setZenMode, 
    setAmbientSound, 
    setAmbientVolume,
    addDistraction, 
    deleteDistraction, 
    convertDistractionToTask 
  } = useStudyStore();

  const t = translations[language];

  // Distraction scratchpad input state
  const [scratchpadInput, setScratchpadInput] = useState('');

  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [sessionNotes, setSessionNotes] = useState('');

  // Custom interval inputs
  const [customWorkMins, setCustomWorkMins] = useState(25);

  // Active Subject and Chapters
  const activeSubject = subjects.find((s) => s.id === timer.activeSubjectId) || subjects[0];
  const chapters = activeSubject?.chapters || [];
  const activeChapter = chapters.find((c) => c.id === timer.activeChapterId);

  // Timer interval hook
  useEffect(() => {
    let interval: number | undefined;
    if (timer.isRunning) {
      interval = window.setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer.isRunning, tickTimer]);

  // Handle Complete Session
  const handleCompleteClick = () => {
    pauseTimer();
    setShowRatingModal(true);
  };

  const handleSaveRating = () => {
    logSession(rating, sessionNotes);
    setShowRatingModal(false);
    setSessionNotes('');
  };

  // Scratchpad handler
  const handleAddScratchpad = (e: React.FormEvent) => {
    e.preventDefault();
    if (scratchpadInput.trim()) {
      addDistraction(scratchpadInput.trim());
      setScratchpadInput('');
    }
  };

  // Timer formatted strings
  const minutes = Math.floor(timer.timeLeft / 60);
  const seconds = timer.timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Progress for circle
  const progressRatio = timer.initialDuration > 0
    ? (timer.initialDuration - timer.timeLeft) / timer.initialDuration
    : 0;

  const ambientSoundsList: { type: SoundType; label: string }[] = [
    { type: 'off', label: t.studyRoom.soundOff },
    { type: 'rain', label: t.studyRoom.soundRain },
    { type: 'brown', label: t.studyRoom.soundBrownNoise },
    { type: 'binaural', label: t.studyRoom.soundBinaural },
    { type: 'cafe', label: t.studyRoom.soundCafe },
    { type: 'clock', label: t.studyRoom.soundClock },
  ];

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fadeIn">
      {/* ======================================================== */}
      {/* 1. FOCUS CONTROLS & SUBJECT SELECTOR HEADER             */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl glass-panel border border-white/10 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode switch pills */}
          <button
            onClick={() => setTimerMode('pomodoro', 25)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              timer.mode === 'pomodoro'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            {t.studyRoom.pomodoro}
          </button>
          <button
            onClick={() => setTimerMode('short_break', 5)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              timer.mode === 'short_break'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            {t.studyRoom.shortBreak}
          </button>
          <button
            onClick={() => setTimerMode('long_break', 15)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              timer.mode === 'long_break'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            {t.studyRoom.longBreak}
          </button>
          <button
            onClick={() => setTimerMode('stopwatch')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              timer.mode === 'stopwatch'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            {t.studyRoom.stopwatch}
          </button>
        </div>

        {/* Subject & Chapter selector dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden lg:inline font-medium">Subject:</span>
            <select
              value={timer.activeSubjectId}
              onChange={(e) => setActiveSubject(e.target.value)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 shadow-inner"
            >
              {subjects.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={timer.activeChapterId || ''}
              onChange={(e) => setActiveSubject(timer.activeSubjectId, e.target.value || undefined)}
              className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500 shadow-inner max-w-[220px] truncate"
            >
              <option value="">{t.studyRoom.noChapter}</option>
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title}
                </option>
              ))}
            </select>
          </div>

          {/* Zen Mode Button */}
          <button
            onClick={() => setZenMode(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition shadow-sm"
            title="Launch Fullscreen Zen Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Zen Mode</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. THE FOCUS ENGINE TIMER DISPLAY                        */}
      {/* ======================================================== */}
      <div className="relative rounded-3xl p-8 sm:p-12 glass-panel border border-white/10 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
        {/* Ambient background glow according to active subject color */}
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: activeSubject?.color || '#e9762b' }}
        />

        {/* Active Subject and Topic Label */}
        <div className="relative z-10 text-center mb-6 space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold shadow-sm"
            style={{ 
              backgroundColor: `${activeSubject?.color || '#e9762b'}25`,
              color: activeSubject?.color || '#f2c48c',
              border: `1px solid ${activeSubject?.color || '#e9762b'}40`
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{activeSubject?.name}</span>
          </div>
          <h2 className="text-sm sm:text-base font-semibold text-slate-300 max-w-md truncate">
            {activeChapter ? activeChapter.title : t.studyRoom.noChapter}
          </h2>
        </div>

        {/* Circular Timer Visual */}
        <div className="relative z-10 w-72 h-72 sm:w-80 sm:h-80 rounded-full flex items-center justify-center p-4">
          {/* Outer animated halo ring */}
          <div 
            className={`absolute inset-0 rounded-full border border-indigo-500/20 ${timer.isRunning ? 'animate-pulse-slow' : ''}`}
            style={{ borderColor: timer.isRunning ? `${activeSubject?.color || '#e9762b'}40` : undefined }}
          />

          {/* SVG Progress Ring */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-slate-800/80 stroke-current"
              strokeWidth="4"
              fill="transparent"
            />
            {timer.mode !== 'stopwatch' && (
              <circle
                cx="50"
                cy="50"
                r="44"
                className="stroke-current transition-all duration-500"
                strokeWidth="4"
                strokeDasharray={2 * Math.PI * 44}
                strokeDashoffset={2 * Math.PI * 44 * (1 - progressRatio)}
                strokeLinecap="round"
                fill="transparent"
                style={{ color: activeSubject?.color || '#e9762b' }}
              />
            )}
          </svg>

          {/* Inner Content Display */}
          <div className="relative flex flex-col items-center justify-center text-center">
            <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white font-mono-numbers drop-shadow-md">
              {formattedTime}
            </span>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-2">
              {timer.mode.replace('_', ' ')}
            </span>
            {timer.isRunning && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Deep Focus Active
              </span>
            )}
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="relative z-10 mt-8 flex items-center gap-4">
          {/* Reset */}
          <button
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition shadow-md"
            title={t.studyRoom.reset}
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Play / Pause Primary Action */}
          {timer.isRunning ? (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base shadow-xl shadow-amber-500/25 transition transform hover:scale-105 active:scale-95"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>{t.studyRoom.pause}</span>
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 transition transform hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
              <span>{t.studyRoom.resume}</span>
            </button>
          )}

          {/* Complete Session */}
          <button
            onClick={handleCompleteClick}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 border border-emerald-400/30 transition"
            title="End Session & Log to Analytics"
          >
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">{t.studyRoom.complete}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. AMBIENT SOUNDSCAPES & SCRATCHPAD 2-COLUMN             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ambient Sound Hook */}
        <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {t.studyRoom.ambientSound}
                </h3>
                <p className="text-[11px] text-slate-400">
                  Synthesized via Web Audio API (100% offline, zero buffering)
                </p>
              </div>
            </div>
            {ambientSound !== 'off' && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Playing
              </span>
            )}
          </div>

          {/* Sound selector grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ambientSoundsList.map((item) => (
              <button
                key={item.type}
                onClick={() => setAmbientSound(item.type)}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                  ambientSound === item.type
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                {ambientSound === item.type && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                )}
              </button>
            ))}
          </div>

          {/* Volume Slider */}
          {ambientSound !== 'off' && (
            <div className="pt-2 flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Volume:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-xs font-mono-numbers text-slate-300 w-8">
                {Math.round(ambientVolume * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Distraction Quick-Scratchpad */}
        <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {t.studyRoom.scratchpadTitle}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {t.studyRoom.scratchpadHint}
                </p>
              </div>
            </div>
          </div>

          {/* Scratchpad form */}
          <form onSubmit={handleAddScratchpad} className="flex gap-2">
            <input
              type="text"
              value={scratchpadInput}
              onChange={(e) => setScratchpadInput(e.target.value)}
              placeholder={t.studyRoom.scratchpadPlaceholder}
              className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition shrink-0"
            >
              {t.studyRoom.addDistraction}
            </button>
          </form>

          {/* List of captured thoughts */}
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {distractionNotes.length === 0 ? (
              <p className="text-center py-4 text-xs text-slate-500 italic">
                No distractions logged. Mind is sharp and clear.
              </p>
            ) : (
              distractionNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs text-slate-300"
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-medium">{note.text}</p>
                    <span className="text-[10px] text-slate-500 font-mono-numbers">{note.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => convertDistractionToTask(note.id, activeSubject.id)}
                      className="p-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-300 transition"
                      title={t.studyRoom.convertToTask}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteDistraction(note.id)}
                      className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 transition"
                      title="Dismiss"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. POST-SESSION FOCUS RATING MODAL (1-5 STARS)           */}
      {/* ======================================================== */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 glass-modal shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-white">
                {t.studyRoom.ratingModalTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.studyRoom.ratingPrompt}
              </p>
            </div>

            {/* 1-5 Star Selection */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-2 transition transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 sm:w-8 sm:h-8 transition ${
                        rating >= star
                          ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-300">
                {t.studyRoom.ratingLabels[rating - 1]}
              </span>
            </div>

            {/* Session reflection notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Quick Session Reflection:
              </label>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder={t.studyRoom.sessionNotesPlaceholder}
                rows={3}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSaveRating}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition"
              >
                {t.studyRoom.saveSession}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
