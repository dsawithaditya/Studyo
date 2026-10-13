import React, { useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseClient';
import { 
  Database, 
  ShieldCheck, 
  Zap, 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  RefreshCw, 
  Server, 
  Key, 
  Cloud 
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const { 
    supabaseUrl, 
    supabaseAnonKey, 
    isCloudSynced, 
    setSupabaseConfig, 
    resetToDefaults 
  } = useStudyStore();

  const [urlInput, setUrlInput] = useState(supabaseUrl);
  const [keyInput, setKeyInput] = useState(supabaseAnonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConfig(urlInput.trim(), keyInput.trim());
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all sample subjects, tasks, and 365-day heatmap history to clean demo defaults?')) {
      resetToDefaults();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-[#0c0c0b] border border-indigo-500/30 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">
                Supabase Cloud Sync & Architecture
              </h2>
              <p className="text-xs text-slate-400">
                100% Free Tier • PostgreSQL + Auth + RLS Security
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Badge */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isCloudSynced ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <div>
              <p className="text-xs font-bold text-white">
                Current Engine Status: {isCloudSynced ? 'Supabase Cloud Connected' : 'Optimistic Offline-First (LocalStorage/IndexedDB)'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isCloudSynced 
                  ? 'All study sessions and syllabus progress sync to PostgreSQL in background.' 
                  : 'Zero perceived latency (0ms). All data stored securely in browser.'}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-white/5 text-indigo-300 border border-white/10 shrink-0 self-start sm:self-auto">
            Zero-Lag Mode
          </span>
        </div>

        {/* Architectural Pillars Info from Page 2 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-1">
            <span className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Optimistic UI & Offline Queue
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              State updates locally in memory immediately when ticking off tasks or starting a timer before server confirmation.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
            <span className="font-bold text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              RLS Security Policies & Indexing
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Composite indices on (user_id, created_at) ensure aggregating months of study heatmap logs runs in &lt; 15ms.
            </p>
          </div>
        </div>

        {/* Connect Your Own Supabase Credentials Form */}
        <form onSubmit={handleSaveConfig} className="space-y-4 pt-2 border-t border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-cyan-400" />
            <span>Connect Custom Supabase Project</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Project URL:
              </label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Anon Public API Key:
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {saveSuccess ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Credentials Saved!
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">
                Leave blank to keep 100% offline local storage mode.
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition"
            >
              Save Credentials
            </button>
          </div>
        </form>

        {/* Copy SQL Schema Script */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">
              PostgreSQL DDL Migration Script
            </span>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Schema'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Paste into your Supabase SQL Editor to generate the schema with composite indexes and RLS policies.
          </p>
        </div>

        {/* Demo Data Reset Button */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Default Sample Data</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
