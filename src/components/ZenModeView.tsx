import React, { useState, useEffect } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { Play, Pause, RotateCcw, Check, Minimize2 } from 'lucide-react';
import { ShinyButton } from './ui/shiny-button';
import { ThemeSwitch } from './ThemeSwitch';

export const ZenModeView: React.FC = () => {
  const {
    timer,
    showFinishButton,
    setZenMode,
    startTimer,
    pauseTimer,
    resetTimer,
    logSession
  } = useStudyStore();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');

  // Keyboard shortcuts in Focus Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (timer.isRunning) pauseTimer();
        else startTimer();
      } else if (e.key === 'Escape' || e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        setZenMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timer.isRunning, pauseTimer, startTimer, setZenMode]);

  const hours = Math.floor(timer.timeLeft / 3600);
  const minutes = Math.floor((timer.timeLeft % 3600) / 60);
  const seconds = timer.timeLeft % 60;

  const hhStr = String(hours).padStart(2, '0');
  const mmStr = String(minutes).padStart(2, '0');
  const ssStr = String(seconds).padStart(2, '0');

  const handleFinish = () => {
    pauseTimer();
    setShowRatingModal(true);
  };

  const handleSaveRating = () => {
    logSession(rating, notes);
    setShowRatingModal(false);
    setZenMode(false);
  };

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen h-[100dvh] min-h-[100dvh] bg-[#fae8dc] text-zinc-900 dark:bg-[#000000] dark:text-[#f2eee3] flex flex-col items-center justify-center p-4 sm:p-8 select-none font-mono overflow-hidden transition-colors duration-300">
      {/* Top Right Quick Controls in Zen Mode */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-3">
        <ThemeSwitch size={12.5} id="zen-theme-switch" />
        <button
          onClick={() => setZenMode(false)}
          className="p-2.5 rounded-full glass-panel hover:bg-black/5 dark:hover:bg-[#222220]/90 text-stone-700 dark:text-slate-300 hover:text-black dark:hover:text-white transition active:scale-95 cursor-pointer shadow-sm"
          title="Exit Focus Mode (Esc or Z)"
          aria-label="Exit Focus Mode"
        >
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Ambient Glass Glow Orbs (Centered warm hearth diffusion) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <div
          className="w-[850px] sm:w-[1200px] h-[550px] sm:h-[750px] rounded-full opacity-20 dark:opacity-25 blur-[160px]"
          style={{ background: 'radial-gradient(ellipse at center, #ff5f00 0%, #e9762b 45%, transparent 70%)' }}
        />
      </div>

      {/* Perfectly Centered Clock Face & Controls */}
      <div className="w-full max-w-7xl px-4 flex flex-col items-center justify-center relative z-10 my-auto">
        {/* Giant Monospace Digits Centered in Screen */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-7 lg:gap-10 text-[clamp(4.5rem,14.5vw,7.5rem)] sm:text-[clamp(6.5rem,17.5vw,13.5rem)] md:text-[clamp(8rem,18.5vw,17rem)] lg:text-[clamp(9.5rem,19vw,19.5rem)] font-extrabold tracking-tight leading-none select-none w-full">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <span className="text-zinc-900 dark:text-[#f2eee3] drop-shadow-sm font-mono tabular-nums slashed-zero-num leading-none">
              {hhStr}
            </span>
            <span className="text-[11px] sm:text-xs md:text-sm uppercase tracking-[0.25em] text-stone-600 dark:text-slate-400 font-bold mt-3 sm:mt-5">
              Hours
            </span>
          </div>

          {/* Colon */}
          <div className="text-stone-400/80 dark:text-stone-600/80 pb-4 sm:pb-7 md:pb-10 text-[0.6em] font-light select-none leading-none">
            :
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <span className="text-zinc-900 dark:text-[#f2eee3] drop-shadow-sm font-mono tabular-nums slashed-zero-num leading-none">
              {mmStr}
            </span>
            <span className="text-[11px] sm:text-xs md:text-sm uppercase tracking-[0.25em] text-stone-600 dark:text-slate-400 font-bold mt-3 sm:mt-5">
              Minutes
            </span>
          </div>

          {/* Colon */}
          <div className="text-stone-400/80 dark:text-stone-600/80 pb-4 sm:pb-7 md:pb-10 text-[0.6em] font-light select-none leading-none">
            :
          </div>

          {/* Seconds (Highlighted vibrant orange with soft radial glow) */}
          <div className="flex flex-col items-center relative">
            <div className="absolute inset-0 bg-[#e9762b]/20 dark:bg-[#e9762b]/30 blur-3xl rounded-full pointer-events-none scale-125" />
            <span className="text-[#e9762b] drop-shadow-[0_0_40px_rgba(233,118,43,0.45)] font-mono tabular-nums slashed-zero-num relative z-10 leading-none">
              {ssStr}
            </span>
            <span className="text-[11px] sm:text-xs md:text-sm uppercase tracking-[0.25em] text-[#e9762b] font-bold mt-3 sm:mt-5 relative z-10">
              Seconds
            </span>
          </div>
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-12 md:mt-16 flex-wrap">
          {/* Start / Pause (Border Magic Pill) */}
          <ShinyButton
            onClick={timer.isRunning ? pauseTimer : startTimer}
            className="!px-8 sm:!px-10 !py-3.5 !text-xs sm:!text-sm !font-mono !font-extrabold !uppercase !tracking-wider active:scale-95 transition shadow-lg shadow-orange-500/25 cursor-pointer"
          >
            {timer.isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-white text-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Start</span>
              </>
            )}
          </ShinyButton>

          {/* Reset */}
          <button
            onClick={resetTimer}
            className="flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-full glass-panel hover:bg-black/5 dark:hover:bg-[#222220]/90 text-stone-800 dark:text-[#f2eee3] font-bold text-xs sm:text-sm uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-stone-500 dark:text-slate-400" />
            <span>Reset</span>
          </button>

          {/* Finish (Optional based on timerSettings.showFinishButton) */}
          {showFinishButton && (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 sm:px-7 py-3.5 rounded-full bg-emerald-500/15 dark:bg-[#111f18]/80 backdrop-blur-md hover:bg-emerald-500/25 dark:hover:bg-[#14281e] border border-emerald-600/30 dark:border-[#10b981]/40 text-emerald-700 dark:text-[#10b981] font-bold text-xs sm:text-sm uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            >
              <Check className="w-4 h-4 text-emerald-600 dark:text-[#10b981]" />
              <span>Finish</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Rating Modal when clicking Finish in Focus Mode */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-modal rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
              Rate Focus
            </h3>

            {/* 1-5 Rating Stars */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-11 h-11 rounded-lg border flex items-center justify-center text-sm font-bold transition ${rating >= star
                      ? 'bg-[#e9762b] text-black border-[#e9762b] shadow-[0_0_15px_rgba(233,118,43,0.3)]'
                      : 'glass-pill text-slate-500 dark:text-slate-400 hover:border-black/20 dark:hover:border-white/20'
                    }`}
                >
                  {star}
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-xs uppercase text-stone-600 dark:text-slate-400 font-bold block mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Session notes..."
                rows={3}
                className="w-full glass-input rounded-xl p-3 text-xs text-zinc-900 dark:text-white focus:outline-none transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="px-5 py-2.5 rounded-full glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold uppercase transition cursor-pointer"
              >
                Skip
              </button>
              <ShinyButton
                onClick={handleSaveRating}
                label="Save"
                className="!px-7 !py-2.5 !text-xs !font-bold !uppercase transition active:scale-95"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
