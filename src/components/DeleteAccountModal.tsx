import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStudyStore } from '../store/useStudyStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  RefreshCw, 
  ShieldAlert 
} from 'lucide-react';

export interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { deleteUserAccount } = useStudyStore();
  const { currentUser, setFlashMessage } = useAuthStore();

  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setErrorMessage(null);
      setIsLoading(false);

      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

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

  const isConfirmed = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed || isLoading) return;

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const result = await deleteUserAccount();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account. Please try again.');
      }

      setFlashMessage('success', 'Your account and all associated database records were permanently deleted.');
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Failed to delete account.');
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-account-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md my-auto glass-modal rounded-3xl p-6 sm:p-7 shadow-2xl font-mono space-y-5 border border-red-500/30 bg-stone-900/95 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-account-title" className="text-base sm:text-lg font-bold text-red-500 uppercase tracking-tight">
                Delete Account
              </h3>
              <p className="text-[11px] text-stone-400">
                Permanent deletion of account & database
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning text */}
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-stone-300 space-y-2">
          <div className="flex items-start gap-2 font-bold text-red-400 uppercase text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Danger: This action cannot be undone</span>
          </div>
          <p className="leading-relaxed text-[11px] text-stone-300">
            Deleting this account will permanently erase all data associated with{' '}
            <strong className="text-white">{currentUser?.email || 'this user'}</strong> from all cloud database tables:
          </p>
          <ul className="list-disc list-inside text-[10px] text-stone-400 space-y-0.5 pl-1">
            <li>Daily Study Logs & Custom Tables</li>
            <li>Task Planner & Exam Countdowns</li>
            <li>Subject Syllabi, Chapters & Focus Sessions</li>
            <li>User Profile & Social Friend Connections</li>
          </ul>
        </div>

        {/* Confirmation Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold block">
            Type <span className="text-red-400 underline font-extrabold">DELETE</span> to confirm:
          </label>
          <input
            ref={inputRef}
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            disabled={isLoading}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-red-500 border border-red-500/30"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-red-500/20">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 glass-pill text-stone-400 hover:text-white uppercase font-bold text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isConfirmed || isLoading}
            onClick={handleDelete}
            className={`px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-extrabold uppercase text-xs tracking-wider active:scale-95 transition cursor-pointer shadow-md shadow-red-600/30 flex items-center gap-2 ${
              !isConfirmed || isLoading ? 'opacity-40 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Account Forever</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
