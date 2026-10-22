import React, { useEffect, useRef, useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Upload, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  FileJson, 
  Database, 
  Calendar, 
  CheckSquare, 
  Table, 
  BookOpen, 
  Clock, 
  RefreshCw 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BackupPreview {
  dailyLogsCount: number;
  tasksCount: number;
  customTablesCount: number;
  subjectsCount: number;
  sessionsCount: number;
  examCountdownsCount: number;
  userName?: string;
  exportDate?: string;
  rawPayload: any;
}

export const ImportBackupModal: React.FC<ImportBackupModalProps> = ({ isOpen, onClose }) => {
  const { importUserData } = useStudyStore();
  const { setFlashMessage } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [fileName, setFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setPreview(null);
      setFileName(null);
      setIsLoading(false);

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validate basic backup shape
        const hasLogs = Array.isArray(parsed.dailyLogs);
        const hasTasks = Array.isArray(parsed.tasks);
        const hasTables = Array.isArray(parsed.customTables);
        const hasSubjects = Array.isArray(parsed.subjects);
        const hasSessions = Array.isArray(parsed.sessions);

        if (!hasLogs && !hasTasks && !hasTables && !hasSubjects && !hasSessions) {
          throw new Error('This JSON file does not appear to be a valid Studyo data backup.');
        }

        setPreview({
          dailyLogsCount: Array.isArray(parsed.dailyLogs) ? parsed.dailyLogs.length : 0,
          tasksCount: Array.isArray(parsed.tasks) ? parsed.tasks.length : 0,
          customTablesCount: Array.isArray(parsed.customTables) ? parsed.customTables.length : 0,
          subjectsCount: Array.isArray(parsed.subjects) ? parsed.subjects.length : 0,
          sessionsCount: Array.isArray(parsed.sessions) ? parsed.sessions.length : 0,
          examCountdownsCount: Array.isArray(parsed.examCountdowns) ? parsed.examCountdowns.length : 0,
          userName: parsed.user?.name,
          exportDate: parsed.exportDate,
          rawPayload: parsed,
        });
      } catch (err: any) {
        setPreview(null);
        setErrorMessage(err?.message || 'Failed to read or parse the JSON backup file.');
      }
    };

    reader.onerror = () => {
      setPreview(null);
      setErrorMessage('Could not read the selected file.');
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!preview?.rawPayload) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await importUserData(preview.rawPayload, importMode);

      if (!result.success) {
        throw new Error(result.message);
      }

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback
      }

      setFlashMessage('success', result.message || 'Data imported successfully!');
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Failed to import backup data.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg glass-modal rounded-2xl p-5 sm:p-6 shadow-2xl font-mono space-y-5 border border-orange-950/20 dark:border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-orange-950/10 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 border border-[#e9762b]/30 text-[#e9762b]">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 id="import-modal-title" className="text-base sm:text-lg font-bold text-stone-900 dark:text-white uppercase tracking-tight">
                Import Data Backup
              </h3>
              <p className="text-[11px] text-stone-500 dark:text-slate-400">
                Restore study tables, task planner & syllabus data from a JSON file
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* File Select Area */}
        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 dark:border-white/20 hover:border-[#e9762b] dark:hover:border-[#e9762b] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-stone-100/50 dark:bg-white/[0.02] hover:bg-orange-500/[0.03]"
          >
            <FileJson className="w-10 h-10 text-[#e9762b] mb-3 opacity-90 animate-pulse" />
            <span className="text-sm font-bold text-stone-900 dark:text-white uppercase">
              Click to select JSON backup file
            </span>
            <span className="text-xs text-stone-500 dark:text-slate-400 mt-1">
              Supports .json files exported from Studyo
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info pill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/10 border border-[#e9762b]/30 text-xs">
              <div className="flex items-center gap-2 truncate">
                <FileJson className="w-4 h-4 text-[#e9762b] shrink-0" />
                <span className="font-bold text-stone-900 dark:text-white truncate">
                  {fileName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setFileName(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white text-[11px] font-bold uppercase underline cursor-pointer shrink-0 ml-2"
              >
                Change
              </button>
            </div>

            {/* Found Data Summary */}
            <div className="p-3.5 rounded-xl bg-stone-100/70 dark:bg-white/[0.04] border border-stone-200 dark:border-white/10 space-y-2">
              <span className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                Found in this Backup
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-200/50 dark:bg-white/5">
                  <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="truncate">
                    <strong>{preview.dailyLogsCount}</strong> Logs
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-200/50 dark:bg-white/5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    <strong>{preview.tasksCount}</strong> Tasks
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-200/50 dark:bg-white/5">
                  <Table className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    <strong>{preview.customTablesCount}</strong> Tables
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-200/50 dark:bg-white/5">
                  <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate">
                    <strong>{preview.subjectsCount}</strong> Subjects
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-200/50 dark:bg-white/5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    <strong>{preview.sessionsCount}</strong> Sessions
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-stone-200/50 dark:bg-white/5">
                  <Database className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span className="truncate">
                    <strong>{preview.examCountdownsCount}</strong> Exams
                  </span>
                </div>
              </div>
              {preview.exportDate && (
                <div className="text-[10px] text-stone-500 dark:text-slate-400 pt-1">
                  Exported on: {new Date(preview.exportDate).toLocaleDateString()} {new Date(preview.exportDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Import Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                IMPORT STRATEGY
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    importMode === 'merge'
                      ? 'bg-orange-500/10 border-[#e9762b] shadow-sm shadow-orange-500/20'
                      : 'glass-pill text-stone-700 dark:text-slate-300 hover:border-stone-400 dark:hover:border-white/20'
                  }`}
                >
                  <span className="font-bold text-stone-900 dark:text-white text-xs mb-0.5">
                    Merge (Safe)
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400">
                    Combines backup data with existing records without deleting current entries.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                    importMode === 'replace'
                      ? 'bg-red-500/10 border-red-500 shadow-sm shadow-red-500/20'
                      : 'glass-pill text-stone-700 dark:text-slate-300 hover:border-stone-400 dark:hover:border-white/20'
                  }`}
                >
                  <span className="font-bold text-red-500 dark:text-red-400 text-xs mb-0.5">
                    Replace All
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400">
                    Overwrites your local database with this backup file completely.
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-orange-950/10 dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 glass-pill text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white uppercase font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!preview || isLoading}
            onClick={handleConfirmImport}
            className={`px-6 py-2.5 rounded-lg bg-[#e9762b] text-black font-extrabold uppercase text-xs tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20 flex items-center gap-2 ${
              !preview || isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Restoring...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm & Restore</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
