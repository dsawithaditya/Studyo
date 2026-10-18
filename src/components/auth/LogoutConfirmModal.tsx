import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, X, RotateCcw, AlertCircle } from 'lucide-react';

export const LogoutConfirmModal: React.FC = () => {
  const { isLogoutModalOpen, closeLogoutModal, logout } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [logoutAllDevices, setLogoutAllDevices] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store last active element to restore focus on close & prevent body scroll
  useEffect(() => {
    if (isLogoutModalOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setErrorMessage(null);
      setIsLoading(false);

      // Focus cancel button by default to prevent accidental logout on Enter key
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

      // Prevent background scrolling while modal is open
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = prevOverflow;
        if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [isLogoutModalOpen]);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!isLogoutModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isLoading) closeLogoutModal();
        return;
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogoutModalOpen, isLoading, closeLogoutModal]);

  if (!isLogoutModalOpen) return null;

  const handleConfirmLogout = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Simulated network/token cleanup delay
      await new Promise((resolve) => setTimeout(resolve, 350));

      logout({ logoutAllDevices });
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred during logout.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      aria-describedby="logout-dialog-desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          closeLogoutModal();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md my-auto rounded-3xl p-6 sm:p-8 glass-modal shadow-2xl space-y-5 font-mono text-stone-900 dark:text-stone-100 border border-orange-500/20 animate-in zoom-in-95 duration-200"
      >
        {/* Header matching AuthModal and AccountProfileModal */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#e9762b]">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h2 id="logout-dialog-title" className="text-sm font-extrabold tracking-wider uppercase text-stone-900 dark:text-white">
                Log Out?
              </h2>
              <span className="text-[10px] text-stone-500 dark:text-slate-400">
                Studyo Focus Engine
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeLogoutModal}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-stone-400 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/10 transition cursor-pointer disabled:opacity-40"
            title="Close dialog (Esc)"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Callout Notice Panel matching Studyo design system */}
        <div className="p-4 rounded-2xl bg-orange-500/10 dark:bg-white/[0.03] border border-orange-500/20 dark:border-white/10 space-y-1.5">
          <div className="flex items-center gap-2 text-[#e9762b] font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Confirm Sign Out</span>
          </div>
          <p id="logout-dialog-desc" className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed font-mono">
            Are you sure you want to log out of your account? Your local study stats, streaks, and syllabus data remain securely preserved on this device.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 leading-snug"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Optional Extra: All Devices Checkbox */}
        <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-stone-100/80 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 cursor-pointer select-none hover:border-orange-500/30 transition text-xs font-mono">
          <input
            type="checkbox"
            checked={logoutAllDevices}
            onChange={(e) => setLogoutAllDevices(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded border-stone-300 text-[#e9762b] focus:ring-[#e9762b] accent-[#e9762b] cursor-pointer"
          />
          <span className="text-stone-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
            Log out from all devices
          </span>
        </label>

        {/* Modal Action Buttons matching Studyo's signature buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={closeLogoutModal}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-white/15 text-stone-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmLogout}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5f00] to-[#e9762b] hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(233,118,43,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-mono"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-black" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 text-black" />
                <span>Log Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
