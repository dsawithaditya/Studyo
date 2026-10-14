import React, { useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { DailyLogEntry } from '../types';
import { Plus, Check, X, Calendar, ChevronDown, ChevronUp, Sparkles, Edit3 } from 'lucide-react';

export const DailyStudyLog: React.FC = () => {
  const { dailyLogs, addOrUpdateDailyLog, updateDailyLogField } = useStudyStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // UI state
  const [showForm, setShowForm] = useState(false);
  const [clickRowAction, setClickRowAction] = useState<'form' | 'expand'>('form');
  const [inlineEditing, setInlineEditing] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(todayStr);
  const [studyHours, setStudyHours] = useState<number>(0);
  const [attendedClass, setAttendedClass] = useState<boolean>(true);
  const [pyqsSolved, setPyqsSolved] = useState<number>(0);
  const [revisionDone, setRevisionDone] = useState<boolean>(false);
  const [mockTestTaken, setMockTestTaken] = useState<boolean>(false);
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [focusRating, setFocusRating] = useState<number>(4);
  const [notes, setNotes] = useState<string>('');

  // Accordion editing state for "expand in place"
  const [accordionState, setAccordionState] = useState<{
    date: string;
    attendedClass: boolean;
    revisionDone: boolean;
    mockTestTaken: boolean;
    notes: string;
  } | null>(null);

  // Helper to format Date: "Oct 13"
  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Populate form with a given day's data
  const handleSelectDayForForm = (entry?: DailyLogEntry, targetDate?: string) => {
    const d = entry ? entry.date : targetDate || todayStr;
    const existing = entry || dailyLogs.find((l) => l.date === d);

    setFormDate(d);
    if (existing) {
      setStudyHours(existing.studyHours);
      setAttendedClass(existing.attendedClass);
      setPyqsSolved(existing.pyqsSolved);
      setRevisionDone(existing.revisionDone);
      setMockTestTaken(existing.mockTestTaken);
      setSleepHours(existing.sleepHours);
      setFocusRating(existing.focusRating);
      setNotes(existing.notes || '');
    } else {
      setStudyHours(0);
      setAttendedClass(true);
      setPyqsSolved(0);
      setRevisionDone(false);
      setMockTestTaken(false);
      setSleepHours(7);
      setFocusRating(4);
      setNotes('');
    }
    setShowForm(true);

    // Smooth scroll to form
    setTimeout(() => {
      document.getElementById('log-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // Row click dispatcher
  const handleRowClick = (entry: DailyLogEntry) => {
    if (clickRowAction === 'form') {
      handleSelectDayForForm(entry);
    } else {
      if (expandedDate === entry.date) {
        setExpandedDate(null);
        setAccordionState(null);
      } else {
        setExpandedDate(entry.date);
        setAccordionState({
          date: entry.date,
          attendedClass: entry.attendedClass,
          revisionDone: entry.revisionDone,
          mockTestTaken: entry.mockTestTaken,
          notes: entry.notes || '',
        });
      }
    }
  };

  // Save form
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: DailyLogEntry = {
      date: formDate,
      studyHours: Number(studyHours) || 0,
      attendedClass,
      pyqsSolved: Number(pyqsSolved) || 0,
      revisionDone,
      mockTestTaken,
      sleepHours: Number(sleepHours) || 0,
      focusRating,
      notes: notes.trim(),
    };
    addOrUpdateDailyLog(newEntry);
    setShowForm(false);
  };

  // Save accordion inline edits
  const handleSaveAccordion = (date: string) => {
    if (!accordionState) return;
    updateDailyLogField(date, 'attendedClass', accordionState.attendedClass);
    updateDailyLogField(date, 'revisionDone', accordionState.revisionDone);
    updateDailyLogField(date, 'mockTestTaken', accordionState.mockTestTaken);
    updateDailyLogField(date, 'notes', accordionState.notes);
    setExpandedDate(null);
    setAccordionState(null);
  };

  // Summary Metrics calculations
  // 1. Current streak: consecutive days logged ending today or yesterday
  const sortedDates = [...new Set(dailyLogs.map((l) => l.date))].sort().reverse();
  let currentStreak = 0;
  if (sortedDates.length > 0) {
    const d = new Date();
    const today = d.toISOString().split('T')[0];
    d.setDate(d.getDate() - 1);
    const yest = d.toISOString().split('T')[0];

    let checkDate = sortedDates.includes(today) ? new Date() : sortedDates.includes(yest) ? d : null;
    if (checkDate) {
      while (true) {
        const ds = checkDate.toISOString().split('T')[0];
        if (sortedDates.includes(ds)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  // 2. This week: study hours in last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const thisWeekLogs = dailyLogs.filter((l) => l.date >= sevenDaysAgoStr);
  const thisWeekHours = thisWeekLogs.reduce((acc, l) => acc + (l.studyHours || 0), 0);

  // 3. Revision rate: % of logged days revision was done
  const revisionCount = dailyLogs.filter((l) => l.revisionDone).length;
  const revisionRate = dailyLogs.length > 0 ? Math.round((revisionCount / dailyLogs.length) * 100) : 0;

  // 4. Avg focus rating
  const totalFocus = dailyLogs.reduce((acc, l) => acc + (l.focusRating || 0), 0);
  const avgFocus = dailyLogs.length > 0 ? (totalFocus / dailyLogs.length).toFixed(1) : '0.0';

  return (
    <div className="w-full flex flex-col space-y-10 animate-fadeIn">
      {/* 1. Header Section */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-[#e9762b] font-bold block mb-1">
            STUDY TRACKER
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Daily Study Log
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-mono">
            A quick daily check-in — no subjects, no chapters. Just how the day actually went.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) {
              setShowForm(false);
            } else {
              handleSelectDayForForm(undefined, todayStr);
            }
          }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#e9762b] text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>LOG A DAY</span>
        </button>
      </div>

      {/* 2. Summary Stats Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Current Streak */}
        <div className="p-6 rounded-2xl bg-[#141413] border border-white/10 flex flex-col justify-between h-36">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            CURRENT STREAK
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white font-mono">{currentStreak}</span>
            <span className="text-xs text-slate-400 font-mono">days</span>
          </div>
        </div>

        {/* Card 2: This Week */}
        <div className="p-6 rounded-2xl bg-[#141413] border border-white/10 flex flex-col justify-between h-36">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            THIS WEEK
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white font-mono">{thisWeekHours.toFixed(1)}</span>
            <span className="text-xs text-slate-400 font-mono">hrs studied</span>
          </div>
        </div>

        {/* Card 3: Revision Rate */}
        <div className="p-6 rounded-2xl bg-[#141413] border border-white/10 flex flex-col justify-between h-36">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            REVISION RATE
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white font-mono">{revisionRate}</span>
            <span className="text-xs text-slate-400 font-mono">% of days</span>
          </div>
        </div>

        {/* Card 4: Avg Focus (Highlighted Orange Card) */}
        <div className="p-6 rounded-2xl bg-[#e9762b] text-black flex flex-col justify-between h-36 shadow-lg shadow-orange-500/20">
          <span className="text-[10px] font-mono uppercase tracking-widest text-black/75 font-bold">
            AVG. FOCUS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-black font-mono">{avgFocus}</span>
            <span className="text-xs text-black/75 font-mono font-bold">/ 5</span>
          </div>
        </div>
      </div>

      {/* 3. Log an Entry (Quick Add / Edit Form) */}
      {showForm && (
        <div
          id="log-form-container"
          className="w-full p-6 sm:p-8 rounded-2xl bg-[#0c0c0b] border-2 border-[#e9762b] shadow-2xl space-y-6 animate-fadeIn"
        >
          {/* Form Top Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white font-mono">
              Editing – {formatDateDisplay(formDate)}
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Edit any past day too — not just today
            </span>
          </div>

          <form onSubmit={handleSaveEntry} className="space-y-6">
            {/* Row 1: Date Picker */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="text-slate-400 uppercase tracking-widest font-bold">DATE</span>
              <button
                type="button"
                onClick={() => handleSelectDayForForm(undefined, todayStr)}
                className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider font-bold transition ${
                  formDate === todayStr
                    ? 'bg-[#e9762b] text-black'
                    : 'bg-[#141413] text-slate-300 border border-white/10 hover:text-white'
                }`}
              >
                TODAY
              </button>
              <button
                type="button"
                onClick={() => handleSelectDayForForm(undefined, yesterdayStr)}
                className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider font-bold transition ${
                  formDate === yesterdayStr
                    ? 'bg-[#e9762b] text-black'
                    : 'bg-[#141413] text-slate-300 border border-white/10 hover:text-white'
                }`}
              >
                YESTERDAY
              </button>
              <input
                type="date"
                value={formDate}
                onChange={(e) => handleSelectDayForForm(undefined, e.target.value)}
                className="bg-[#141413] border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e9762b]"
              />
              <span className="text-[11px] text-slate-500 hidden md:inline ml-2">
                Pick any date — entries for past days overwrite what&apos;s already saved for that date.
              </span>
            </div>

            {/* Row 2: Grid of Inputs (Study Hours, Class, PYQs, Revision, Mock, Sleep) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-mono">
              {/* Study Hours */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                  STUDY HOURS
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={studyHours}
                  onChange={(e) => setStudyHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#141413] border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-[#e9762b]"
                />
              </div>

              {/* Attended Class */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                  ATTENDED CLASS?
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[#141413] p-1 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setAttendedClass(true)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center ${
                      attendedClass ? 'bg-[#e9762b] text-black font-extrabold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendedClass(false)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center ${
                      !attendedClass ? 'bg-[#1c1c1b] text-white border border-white/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    NO
                  </button>
                </div>
              </div>

              {/* PYQs Solved */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                  PYQS SOLVED
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={pyqsSolved}
                  onChange={(e) => setPyqsSolved(parseInt(e.target.value) || 0)}
                  className="w-full bg-[#141413] border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-[#e9762b]"
                />
              </div>

              {/* Revision Done */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                  REVISION DONE?
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[#141413] p-1 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setRevisionDone(true)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center ${
                      revisionDone ? 'bg-[#e9762b] text-black font-extrabold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevisionDone(false)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center ${
                      !revisionDone ? 'bg-[#1c1c1b] text-white border border-white/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    NO
                  </button>
                </div>
              </div>

              {/* Mock Test Taken */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                  MOCK TEST TAKEN?
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[#141413] p-1 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setMockTestTaken(true)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center ${
                      mockTestTaken ? 'bg-[#e9762b] text-black font-extrabold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockTestTaken(false)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center ${
                      !mockTestTaken ? 'bg-[#e9762b] text-black font-extrabold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    NO
                  </button>
                </div>
              </div>

              {/* Sleep Hours */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                  SLEEP HOURS
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#141413] border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none focus:border-[#e9762b]"
                />
              </div>
            </div>

            {/* Row 3: Focus Rating */}
            <div className="space-y-2 font-mono">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                FOCUS RATING
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setFocusRating(val)}
                    className={`w-12 h-10 rounded-lg font-bold text-sm transition flex items-center justify-center ${
                      focusRating === val
                        ? 'bg-[#e9762b] text-black shadow-lg shadow-orange-500/20'
                        : 'bg-[#141413] text-slate-400 border border-white/10 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 4: Notes */}
            <div className="space-y-2 font-mono">
              <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                NOTES <span className="opacity-60">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything worth remembering about today..."
                className="w-full bg-[#141413] border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-lg bg-[#141413] border border-white/10 text-slate-400 hover:text-white text-xs uppercase font-bold tracking-wider transition"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-7 py-2.5 rounded-lg bg-white text-black font-extrabold text-xs uppercase tracking-wider hover:bg-slate-200 active:scale-95 transition"
              >
                SAVE ENTRY
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Recent Days Table Section */}
      <div className="space-y-4">
        {/* Table Top Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
          <h2 className="text-xl font-bold text-white tracking-tight">Recent Days</h2>

          <div className="flex flex-wrap items-center gap-6 text-xs">
            {/* Click row to switch */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                CLICK ROW TO:
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-[#141413] border border-white/10 text-[11px] font-bold">
                <button
                  onClick={() => setClickRowAction('form')}
                  className={`px-3 py-1 rounded transition uppercase ${
                    clickRowAction === 'form' ? 'bg-[#e9762b] text-black font-extrabold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EDIT IN FORM
                </button>
                <button
                  onClick={() => setClickRowAction('expand')}
                  className={`px-3 py-1 rounded transition uppercase ${
                    clickRowAction === 'expand' ? 'bg-[#e9762b] text-black font-extrabold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  EXPAND IN PLACE
                </button>
              </div>
            </div>

            {/* Inline editing switch */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                INLINE EDITING:
              </span>
              <button
                type="button"
                onClick={() => setInlineEditing(!inlineEditing)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none p-0.5 ${
                  inlineEditing ? 'bg-[#e9762b]' : 'bg-[#141413] border border-white/20'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    inlineEditing ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="w-full rounded-2xl bg-[#0c0c0b] border border-white/10 overflow-hidden font-mono">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-4 font-normal">DATE</th>
                  <th className="py-3 px-4 font-normal">HOURS</th>
                  <th className="py-3 px-4 font-normal text-center">CLASS</th>
                  <th className="py-3 px-4 font-normal text-center">PYQS</th>
                  <th className="py-3 px-4 font-normal text-center">REVISION</th>
                  <th className="py-3 px-4 font-normal text-center">MOCK</th>
                  <th className="py-3 px-4 font-normal text-center">SLEEP</th>
                  <th className="py-3 px-4 font-normal text-right">FOCUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dailyLogs.map((entry) => {
                  const isExpanded = expandedDate === entry.date;
                  return (
                    <React.Fragment key={entry.date}>
                      <tr
                        onClick={() => handleRowClick(entry)}
                        className={`hover:bg-white/[0.03] transition cursor-pointer ${
                          isExpanded ? 'bg-white/[0.04]' : ''
                        }`}
                      >
                        {/* Date Column */}
                        <td className="py-3 px-4 text-white font-bold whitespace-nowrap">
                          {formatDateDisplay(entry.date)}
                          {isExpanded && (
                            <span className="text-[10px] text-[#e9762b] uppercase font-bold ml-2">
                              • EDITING
                            </span>
                          )}
                        </td>

                        {/* Study Hours Column */}
                        <td className="py-3 px-4">
                          {inlineEditing ? (
                            <div className="inline-flex items-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={entry.studyHours}
                                onChange={(e) =>
                                  updateDailyLogField(entry.date, 'studyHours', parseFloat(e.target.value) || 0)
                                }
                                className="w-16 bg-[#141413] border border-white/20 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-[#e9762b]"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-200">{entry.studyHours}h</span>
                          )}
                        </td>

                        {/* Class Attended Dot */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              entry.attendedClass ? 'bg-[#10b981]' : 'bg-[#374151]'
                            }`}
                          />
                        </td>

                        {/* PYQs Solved */}
                        <td className="py-3 px-4 text-center">
                          {inlineEditing ? (
                            <div className="inline-flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={entry.pyqsSolved}
                                onChange={(e) =>
                                  updateDailyLogField(entry.date, 'pyqsSolved', parseInt(e.target.value) || 0)
                                }
                                className="w-16 bg-[#141413] border border-white/20 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-[#e9762b]"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-200">{entry.pyqsSolved}</span>
                          )}
                        </td>

                        {/* Revision Done Dot */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              entry.revisionDone ? 'bg-[#10b981]' : 'bg-[#374151]'
                            }`}
                          />
                        </td>

                        {/* Mock Test Taken Dot */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              entry.mockTestTaken ? 'bg-[#10b981]' : 'bg-[#374151]'
                            }`}
                          />
                        </td>

                        {/* Sleep Hours */}
                        <td className="py-3 px-4 text-center">
                          {inlineEditing ? (
                            <div className="inline-flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={entry.sleepHours}
                                onChange={(e) =>
                                  updateDailyLogField(entry.date, 'sleepHours', parseFloat(e.target.value) || 0)
                                }
                                className="w-16 bg-[#141413] border border-white/20 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-[#e9762b]"
                              />
                            </div>
                          ) : (
                            <span className="text-slate-200">{entry.sleepHours}h</span>
                          )}
                        </td>

                        {/* Focus Rating */}
                        <td className="py-3 px-4 text-right text-slate-300 font-mono">
                          {entry.focusRating} / 5
                        </td>
                      </tr>

                      {/* Expand in place accordion sub-panel (Exact Screenshot 4) */}
                      {isExpanded && accordionState && (
                        <tr className="bg-[#121211] border-b border-white/10" onClick={(e) => e.stopPropagation()}>
                          <td colSpan={8} className="p-6">
                            <div className="space-y-5">
                              {/* Accordion Controls Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-mono">
                                {/* Attended Class? */}
                                <div className="space-y-2">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                    ATTENDED CLASS?
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, attendedClass: true })
                                      }
                                      className={`px-5 py-1.5 rounded-lg font-bold uppercase transition ${
                                        accordionState.attendedClass
                                          ? 'bg-[#10b981] text-black font-extrabold'
                                          : 'bg-[#1c1c1b] text-slate-400 hover:text-white border border-white/10'
                                      }`}
                                    >
                                      YES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, attendedClass: false })
                                      }
                                      className={`px-5 py-1.5 rounded-lg font-bold uppercase transition ${
                                        !accordionState.attendedClass
                                          ? 'bg-[#1c1c1b] text-white border border-white/20'
                                          : 'bg-[#1c1c1b] text-slate-400 hover:text-white border border-white/10'
                                      }`}
                                    >
                                      NO
                                    </button>
                                  </div>
                                </div>

                                {/* Revision Done? */}
                                <div className="space-y-2">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                    REVISION DONE?
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, revisionDone: true })
                                      }
                                      className={`px-5 py-1.5 rounded-lg font-bold uppercase transition ${
                                        accordionState.revisionDone
                                          ? 'bg-[#10b981] text-black font-extrabold'
                                          : 'bg-[#1c1c1b] text-slate-400 hover:text-white border border-white/10'
                                      }`}
                                    >
                                      YES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, revisionDone: false })
                                      }
                                      className={`px-5 py-1.5 rounded-lg font-bold uppercase transition ${
                                        !accordionState.revisionDone
                                          ? 'bg-[#1c1c1b] text-white border border-white/20'
                                          : 'bg-[#1c1c1b] text-slate-400 hover:text-white border border-white/10'
                                      }`}
                                    >
                                      NO
                                    </button>
                                  </div>
                                </div>

                                {/* Mock Test? */}
                                <div className="space-y-2">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                    MOCK TEST?
                                  </label>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, mockTestTaken: true })
                                      }
                                      className={`px-5 py-1.5 rounded-lg font-bold uppercase transition ${
                                        accordionState.mockTestTaken
                                          ? 'bg-[#10b981] text-black font-extrabold'
                                          : 'bg-[#1c1c1b] text-slate-400 hover:text-white border border-white/10'
                                      }`}
                                    >
                                      YES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, mockTestTaken: false })
                                      }
                                      className={`px-5 py-1.5 rounded-lg font-bold uppercase transition ${
                                        !accordionState.mockTestTaken
                                          ? 'bg-[#1c1c1b] text-white border border-white/20'
                                          : 'bg-[#1c1c1b] text-slate-400 hover:text-white border border-white/10'
                                      }`}
                                    >
                                      NO
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Notes Input */}
                              <div className="space-y-2 font-mono">
                                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                  NOTES
                                </label>
                                <input
                                  type="text"
                                  value={accordionState.notes}
                                  onChange={(e) =>
                                    setAccordionState({ ...accordionState, notes: e.target.value })
                                  }
                                  placeholder="Nothing noted for this day"
                                  className="w-full bg-[#1c1c1b] border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                                />
                              </div>

                              {/* Accordion Action Buttons */}
                              <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedDate(null);
                                    setAccordionState(null);
                                  }}
                                  className="px-5 py-2 rounded-lg bg-[#1c1c1b] border border-white/10 text-slate-400 hover:text-white text-xs uppercase font-bold tracking-wider transition"
                                >
                                  CLOSE
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveAccordion(entry.date)}
                                  className="px-6 py-2 rounded-lg bg-[#e9762b] text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition"
                                >
                                  SAVE CHANGES
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Legend */}
          <div className="py-3 px-4 border-t border-white/10 flex items-center gap-6 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              Done
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#374151]" />
              Missed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyStudyLog;
