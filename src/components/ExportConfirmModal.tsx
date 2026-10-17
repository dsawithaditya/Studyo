import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStudyStore } from '../store/useStudyStore';
import { useAuthStore } from '../store/useAuthStore';
import { Download, X, AlertCircle, ArrowLeft, RotateCcw, FileJson } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ExportConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
}

export const ExportConfirmModal: React.FC<ExportConfirmModalProps> = ({
  isOpen,
  onClose,
  onBack,
}) => {
  const { user, dailyLogs, tasks, sessions, subjects, customTables } = useStudyStore();
  const { setFlashMessage } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [prettyPrint, setPrettyPrint] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Store last active element to restore focus on close & prevent body scroll
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
      setErrorMessage(null);
      setIsLoading(false);

      // Focus cancel button by default to prevent accidental trigger on Enter key
      const timer = setTimeout(() => {
        cancelBtnRef.current?.focus();
      }, 50);

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
  }, [isOpen]);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isLoading) onClose();
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
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleConfirmExport = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      // Brief animation delay for smooth visual feedback
      await new Promise((resolve) => setTimeout(resolve, 350));

      const exportPayload = {
        app: 'Studyo Focus Engine',
        version: '2.0',
        exportDate: new Date().toISOString(),
        user,
        dailyLogs: Array.isArray(dailyLogs) ? dailyLogs : [],
        tasks: Array.isArray(tasks) ? tasks : [],
        sessions: Array.isArray(sessions) ? sessions : [],
        subjects: Array.isArray(subjects) ? subjects : [],
        customTables: Array.isArray(customTables) ? customTables : [],
      };

      const jsonString = prettyPrint
        ? JSON.stringify(exportPayload, null, 2)
        : JSON.stringify(exportPayload);

      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split('T')[0];
      const filename = `studyo_backup_${today}.json`;

      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = filename;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Continue even if confetti is unavailable
      }

      setFlashMessage('success', 'Study data backup exported successfully!');
      setIsLoading(false);
      onClose();
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to export study data.');
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-dialog-title"
      aria-describedby="export-dialog-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto font-mono"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md my-auto rounded-3xl p-6 sm:p-8 glass-modal shadow-2xl space-y-5 font-mono text-stone-900 dark:text-stone-100 border border-orange-500/20 animate-in zoom-in-95 duration-200"
      >
        {/* Header matching LogoutConfirmModal & Studyo design */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (onBack) onBack();
                else onClose();
              }}
              disabled={isLoading}
              className="p-1.5 -ml-1 rounded-lg text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 transition cursor-pointer shrink-0 active:scale-95 disabled:opacity-40"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#e9762b]">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 id="export-dialog-title" className="text-sm font-extrabold tracking-wider uppercase text-stone-900 dark:text-white">
                Export Data?
              </h2>
              <span className="text-[10px] text-stone-500 dark:text-slate-400">
                Studyo Backup & Recovery
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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
            <span>Confirm Data Export</span>
          </div>
          <p id="export-dialog-desc" className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed font-mono">
            Are you sure you want to export your study data? A complete, offline-ready JSON backup containing your logs, streak records, timer sessions, and syllabus map will be generated.
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

        {/* Backup Summary Breakdown */}
        <div className="p-3.5 rounded-2xl bg-stone-100/80 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] uppercase font-bold text-stone-500 dark:text-slate-400 tracking-wider">
            <span className="flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-[#e9762b]" />
              <span>Backup Summary</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Ready to Export</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="p-2 rounded-xl bg-stone-200/60 dark:bg-white/5 border border-stone-300/60 dark:border-white/5">
              <span className="text-[9px] uppercase font-bold text-stone-500 dark:text-slate-400 block">Logs</span>
              <span className="text-sm font-extrabold text-stone-900 dark:text-white font-mono-numbers">
                {(dailyLogs || []).length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-stone-200/60 dark:bg-white/5 border border-stone-300/60 dark:border-white/5">
              <span className="text-[9px] uppercase font-bold text-stone-500 dark:text-slate-400 block">Sessions</span>
              <span className="text-sm font-extrabold text-stone-900 dark:text-white font-mono-numbers">
                {(sessions || []).length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-stone-200/60 dark:bg-white/5 border border-stone-300/60 dark:border-white/5">
              <span className="text-[9px] uppercase font-bold text-stone-500 dark:text-slate-400 block">Tasks</span>
              <span className="text-sm font-extrabold text-stone-900 dark:text-white font-mono-numbers">
                {(tasks || []).length}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-stone-200/60 dark:bg-white/5 border border-stone-300/60 dark:border-white/5">
              <span className="text-[9px] uppercase font-bold text-stone-500 dark:text-slate-400 block">Tables</span>
              <span className="text-sm font-extrabold text-stone-900 dark:text-white font-mono-numbers">
                {(customTables || []).length}
              </span>
            </div>
          </div>
        </div>

        {/* Format Option Checkbox */}
        <label className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-stone-100/80 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 cursor-pointer select-none hover:border-orange-500/30 transition text-xs font-mono">
          <input
            type="checkbox"
            checked={prettyPrint}
            onChange={(e) => setPrettyPrint(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded border-stone-300 text-[#e9762b] focus:ring-[#e9762b] accent-[#e9762b] cursor-pointer"
          />
          <span className="text-stone-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
            Format JSON for readability (Pretty Print)
          </span>
        </label>

        {/* Action Buttons matching LogoutConfirmModal */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-white/15 text-stone-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmExport}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff5f00] to-[#e9762b] hover:brightness-110 active:scale-[0.98] text-black font-extrabold text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(233,118,43,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 font-mono"
          >
            {isLoading ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-black" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-black" />
                <span>Confirm & Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
