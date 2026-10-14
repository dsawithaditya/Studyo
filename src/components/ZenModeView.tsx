import React, { useState, useEffect } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { Play, Pause, RotateCcw, Check, Minimize2 } from 'lucide-react';
import { ShinyButton } from './ui/shiny-button';

export const ZenModeView: React.FC = () => {
  const { 
    timer, 
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
    <div className="fixed inset-0 z-50 bg-[#000000] text-[#f2eee3] flex flex-col items-center justify-center p-4 sm:p-8 select-none font-mono relative overflow-hidden">
      {/* Ambient Glass Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-20 blur-[140px]"
          style={{ background: 'radial-gradient(circle, #ff5f00 0%, #e9762b 40%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-[10%] right-[10%] w-[500px] h-[400px] rounded-full opacity-10 blur-[130px]"
          style={{ background: 'radial-gradient(circle, #ff9253 0%, transparent 65%)' }}
        />
      </div>

      {/* Centered Clock Face & Controls (Exact Screenshot 1 match) */}
      <div className="flex flex-col items-center justify-center w-full max-w-5xl my-auto relative z-10">
        {/* Giant Monospace Digits */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 md:gap-8 text-[4.5rem] sm:text-[7rem] md:text-[9.5rem] lg:text-[11.5rem] font-bold tracking-tight leading-none select-none">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <span className="text-[#f2eee3] drop-shadow-sm font-mono tabular-nums">
              {hhStr}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-slate-500 font-semibold mt-2 sm:mt-4">
              Hours
            </span>
          </div>

          {/* Colon */}
          <div className="text-slate-600 pb-5 sm:pb-8 text-[3rem] sm:text-[5rem] md:text-[7rem] font-light">
            :
          </div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <span className="text-[#f2eee3] drop-shadow-sm font-mono tabular-nums">
              {mmStr}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-slate-500 font-semibold mt-2 sm:mt-4">
              Minutes
            </span>
          </div>

          {/* Colon */}
          <div className="text-slate-600 pb-5 sm:pb-8 text-[3rem] sm:text-[5rem] md:text-[7rem] font-light">
            :
          </div>

          {/* Seconds (Highlighted vibrant orange with soft radial glow) */}
          <div className="flex flex-col items-center relative">
            <div className="absolute inset-0 bg-[#e9762b]/15 blur-2xl rounded-full pointer-events-none" />
            <span className="text-[#e9762b] drop-shadow-[0_0_35px_rgba(233,118,43,0.35)] font-mono tabular-nums relative z-10">
              {ssStr}
            </span>
            <span className="text-[10px] sm:text-xs md:text-sm uppercase tracking-widest text-[#e9762b]/80 font-semibold mt-2 sm:mt-4 relative z-10">
              Seconds
            </span>
          </div>
        </div>

        {/* Action Controls Row (Exact Screenshot 1 match) */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 mt-10 sm:mt-14 flex-wrap">
          {/* Start / Pause */}
          <ShinyButton
            onClick={timer.isRunning ? pauseTimer : startTimer}
            cornerRadius={12}
            className="!px-7 sm:!px-9 !py-3 !text-xs sm:!text-sm !font-mono !font-extrabold !uppercase !tracking-wider !rounded-xl active:scale-95 transition shadow-lg shadow-orange-500/20"
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
            className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl glass-panel hover:bg-[#222220]/90 text-[#f2eee3] font-bold text-xs sm:text-sm uppercase tracking-wider transition active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset</span>
          </button>

          {/* Finish */}
          <button
            onClick={handleFinish}
            className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-[#111f18]/80 backdrop-blur-md hover:bg-[#14281e] border border-[#10b981]/40 text-[#10b981] font-bold text-xs sm:text-sm uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            <Check className="w-4 h-4 text-[#10b981]" />
            <span>Finish</span>
          </button>

          {/* Exit Focus Mode (Square Icon Button) */}
          <button
            onClick={() => setZenMode(false)}
            className="p-3 rounded-xl glass-panel hover:bg-[#222220]/90 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer"
            title="Exit Focus Mode (Esc or Z)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Optional Rating Modal when clicking Finish in Focus Mode */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-modal rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-2">
              Rate Focus Session
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Rate your concentration level for this session.
            </p>

            {/* 1-5 Rating Stars */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-11 h-11 rounded-lg border flex items-center justify-center text-sm font-bold transition ${
                    rating >= star
                      ? 'bg-[#e9762b] text-black border-[#e9762b] shadow-[0_0_15px_rgba(233,118,43,0.3)]'
                      : 'glass-pill text-slate-400 hover:border-white/20'
                  }`}
                >
                  {star}
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label className="text-xs uppercase text-slate-400 font-bold block mb-2">
                Session Note (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you work on or learn?"
                rows={3}
                className="w-full glass-input rounded-xl p-3 text-xs text-white focus:outline-none transition"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRatingModal(false)}
                className="px-4 py-2 rounded-lg glass-pill text-slate-300 text-xs font-bold uppercase transition"
              >
                Skip
              </button>
              <ShinyButton
                onClick={handleSaveRating}
                label="Save"
                cornerRadius={10}
                className="!px-6 !py-2 !text-xs !font-bold !uppercase transition active:scale-95"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
