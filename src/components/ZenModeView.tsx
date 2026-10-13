import React, { useState, useEffect } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { translations } from '../i18n/translations';
import { SoundType } from '../services/soundSynth';
import { 
  Minimize2, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  Volume2, 
  Sparkles, 
  Star,
  Wind
} from 'lucide-react';

export const ZenModeView: React.FC = () => {
  const { 
    language, 
    timer, 
    ambientSound, 
    ambientVolume, 
    setZenMode, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    logSession, 
    setAmbientSound, 
    setAmbientVolume 
  } = useStudyStore();
  const t = translations[language];

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState('');

  // Keyboard shortcuts in Zen Mode
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
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleComplete = () => {
    pauseTimer();
    setShowRatingModal(true);
  };

  const handleSaveRating = () => {
    logSession(rating, notes);
    setShowRatingModal(false);
    setZenMode(false);
  };

  const sounds: { type: SoundType; label: string }[] = [
    { type: 'off', label: 'Mute' },
    { type: 'rain', label: 'Rain' },
    { type: 'brown', label: 'Brown Noise' },
    { type: 'binaural', label: 'Binaural 40Hz' },
    { type: 'cafe', label: 'Cafe' },
    { type: 'clock', label: 'Clock' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0c0b] text-[#e9e4da] flex flex-col justify-between p-6 sm:p-12 animate-fadeIn select-none font-mono">
      {/* Top bar: Zen status & Exit Zen button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#e9762b] animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Zen Focus
          </span>
        </div>

        {/* Exit Zen Button */}
        <button
          onClick={() => setZenMode(false)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition"
        >
          <Minimize2 className="w-4 h-4" />
          <span>{t.studyRoom.exitZen}</span>
        </button>
      </div>

      {/* Center Focus Element: Giant Breathing Ring and Digital Display */}
      <div className="flex flex-col items-center justify-center my-auto relative">
        {/* Soft breathing pulse effect */}
        <div 
          className={`w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-white/10 flex items-center justify-center transition-transform duration-1000 ${
            timer.isRunning ? 'animate-breathe' : ''
          }`}
          style={{ borderColor: 'rgba(233, 118, 43, 0.25)' }}
        >
          <div 
            className="w-64 h-64 sm:w-80 sm:h-80 rounded-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-white/[0.03] to-transparent shadow-2xl"
          >
            <span className="text-[2.6rem] min-[380px]:text-5xl sm:text-7xl md:text-8xl font-black font-mono-numbers tracking-tighter text-white drop-shadow-2xl whitespace-nowrap">
              {formattedTime}
            </span>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-500 mt-3">
              {timer.mode.replace('_', ' ')}
            </span>
            {timer.isRunning && (
              <span className="text-[11px] text-[#e9762b] flex items-center gap-1.5 mt-2 font-medium">
                <Wind className="w-3.5 h-3.5 animate-spin" />
                In The Zone
              </span>
            )}
          </div>
        </div>

        {/* Big Minimal Controls */}
        <div className="flex items-center gap-6 mt-10">
          <button
            onClick={resetTimer}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition"
            title={t.studyRoom.reset}
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          {timer.isRunning ? (
            <button
              onClick={pauseTimer}
              className="p-6 rounded-3xl bg-[#e9762b] hover:brightness-110 text-slate-950 font-bold transition transform hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/25"
              title="Pause Timer (Space)"
            >
              <Pause className="w-8 h-8 fill-current" />
            </button>
          ) : (
            <button
              onClick={startTimer}
              className="p-6 rounded-3xl bg-[#e9762b] hover:brightness-110 text-slate-950 font-bold transition transform hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/25"
              title="Start Timer (Space)"
            >
              <Play className="w-8 h-8 fill-current ml-0.5" />
            </button>
          )}

          <button
            onClick={handleComplete}
            className="p-4 rounded-2xl bg-emerald-600/80 hover:bg-emerald-500 text-white border border-emerald-400/30 transition shadow-lg"
            title={t.studyRoom.complete}
          >
            <Check className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Ambient sound switch & breathing prompt */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-4">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <div className="flex items-center gap-1.5">
            {sounds.map((s) => (
              <button
                key={s.type}
                onClick={() => setAmbientSound(s.type)}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                  ambientSound === s.type
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Inhale calm, exhale distraction. Deep uninterrupted focus.
        </p>
      </div>

      {/* Rating modal in Zen mode */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 bg-[#0c0c0b] border border-indigo-500/30 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
              <h3 className="text-xl font-extrabold text-white">
                {t.studyRoom.ratingModalTitle}
              </h3>
              <p className="text-xs text-slate-400">
                {t.studyRoom.ratingPrompt}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-2 transition transform hover:scale-125"
                >
                  <Star
                    className={`w-7 h-7 ${
                      rating >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.studyRoom.sessionNotesPlaceholder}
              rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSaveRating}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
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
