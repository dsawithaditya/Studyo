import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useStudyStore } from '../../store/useStudyStore';
import { CheckCircle2, AlertTriangle, Sparkles, X } from 'lucide-react';

export const FlashNotification: React.FC = () => {
  const { flashMessage, clearFlashMessage } = useAuthStore();
  const { theme } = useStudyStore();
  const isDark = theme === 'dark';

  if (!flashMessage) return null;

  const isSuccess = flashMessage.type === 'success';
  const isError = flashMessage.type === 'error';

  return (
    <aside
      aria-label="System notification"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[130] pointer-events-auto max-w-[92vw] sm:max-w-md animate-in slide-in-from-bottom-3 sm:slide-in-from-right-3 fade-in duration-200"
    >
      <div
        role="alert"
        aria-live="polite"
        className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl font-mono text-xs shadow-2xl border transition-all duration-200 select-none"
        style={{
          backgroundColor: isDark ? 'rgba(15, 15, 14, 0.94)' : 'rgba(255, 252, 248, 0.97)',
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
          borderColor: isDark
            ? isSuccess
              ? 'rgba(16, 185, 129, 0.45)'
              : isError
                ? 'rgba(244, 63, 94, 0.45)'
                : 'rgba(233, 118, 43, 0.45)'
            : isSuccess
              ? 'rgba(16, 185, 129, 0.5)'
              : isError
                ? 'rgba(244, 63, 94, 0.5)'
                : 'rgba(233, 118, 43, 0.4)',
          boxShadow: isDark
            ? '0 20px 50px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 20px rgba(233, 118, 43, 0.1)'
            : '0 20px 45px rgba(180, 80, 20, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.95), 0 0 15px rgba(233, 118, 43, 0.1)',
          color: isDark ? '#f5f5f4' : '#1c1917',
        }}
      >
        {/* Status Pill Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-extrabold text-[10px] tracking-wider uppercase shrink-0 border ${
            isSuccess
              ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-600 dark:text-emerald-400'
              : isError
                ? 'bg-rose-500/15 border-rose-500/35 text-rose-600 dark:text-rose-400'
                : 'bg-[#e9762b]/15 border-[#e9762b]/35 text-[#e9762b]'
          }`}
        >
          {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
          {isError && <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />}
          {!isSuccess && !isError && <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />}
          <span>{isSuccess ? 'SUCCESS' : isError ? 'ALERT' : 'NOTICE'}</span>
        </span>

        {/* Message Text */}
        <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate max-w-[220px] sm:max-w-xs">
          {flashMessage.message}
        </span>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={clearFlashMessage}
          className="p-1 rounded-full text-stone-400 hover:text-black dark:text-stone-400 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0 cursor-pointer ml-0.5"
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
