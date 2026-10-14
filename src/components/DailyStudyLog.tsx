import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStudyStore, INITIAL_DAILY_LOGS } from '../store/useStudyStore';
import { DailyLogEntry, CustomColumn, CustomColumnType } from '../types';
import { ShinyButton } from './ui/shiny-button';
import {
  Plus,
  Check,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Edit3,
  FileText,
  ChevronRight,
  Trash2,
  Settings2,
  CheckSquare,
  Hash,
  Type,
  List,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export const DailyStudyLog: React.FC = () => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableSectionRef = useRef<HTMLDivElement>(null);
  const {
    dailyLogs: rawLogs,
    addOrUpdateDailyLog,
    updateDailyLogField,
    deleteDailyLog,
    customColumns: rawCustomCols,
    addCustomColumn,
    updateCustomColumn,
    deleteCustomColumn,
    reorderCustomColumns,
    updateDailyLogCustomField,
  } = useStudyStore();

  const dailyLogs = useMemo(
    () => (Array.isArray(rawLogs) && rawLogs.length > 0 ? rawLogs : INITIAL_DAILY_LOGS),
    [rawLogs]
  );

  const customColumns = useMemo(
    () => (Array.isArray(rawCustomCols) ? rawCustomCols : []),
    [rawCustomCols]
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // UI state
  const [enableTopForm, setEnableTopForm] = useState(false); // By-default disabled per user request!
  const [showForm, setShowForm] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.min(window.innerWidth - 32, 1200);
    }
    return 800;
  });

  // Keep track of the visible width of the table container so the accordion fits perfectly without clipping
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (tableContainerRef.current) {
        setContainerWidth(tableContainerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateWidth();
      });
      ro.observe(el);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (tableContainerRef.current) {
      setContainerWidth(tableContainerRef.current.clientWidth);
    }
  }, [expandedDate]);

  // Custom Columns UI state
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<CustomColumnType>('boolean');
  const [newColOptions, setNewColOptions] = useState('');

  const [editingColumn, setEditingColumn] = useState<{
    id: string;
    name: string;
    type: CustomColumnType;
    options: string;
    index: number;
  } | null>(null);

  // Month/Year navigation and Chunk loading state
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('all');
  const [visibleLimit, setVisibleLimit] = useState<number>(20);

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
  const [formCustomData, setFormCustomData] = useState<Record<string, any>>({});

  // Accordion editing state for "expand in place"
  const [accordionState, setAccordionState] = useState<{
    date: string;
    studyHours: number;
    attendedClass: boolean;
    pyqsSolved: number;
    revisionDone: boolean;
    mockTestTaken: boolean;
    sleepHours: number;
    focusRating: number;
    notes: string;
    customData: Record<string, any>;
  } | null>(null);

  // Helper to format Date: "Oct 09" with double digit padding
  const formatDateDisplay = (dateStr: string) => {
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [y, m, d] = dateStr.split('-').map(Number);
      return `${months[m - 1]} ${String(d).padStart(2, '0')}`;
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
      setFormCustomData({ ...(existing.customData || {}) });
    } else {
      setStudyHours(0);
      setAttendedClass(true);
      setPyqsSolved(0);
      setRevisionDone(false);
      setMockTestTaken(false);
      setSleepHours(7);
      setFocusRating(4);
      setNotes('');
      setFormCustomData({});
    }
    setShowForm(true);

    // Smooth scroll to form
    setTimeout(() => {
      document.getElementById('log-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // Smoothly scroll down so the full table is centered and fully visible on screen
  const scrollToCenterTable = () => {
    if (!tableSectionRef.current) return;
    const rect = tableSectionRef.current.getBoundingClientRect();
    const tableHeight = rect.height;
    const windowHeight = window.innerHeight;
    const targetY = rect.top + window.scrollY;

    // Center table vertically if it fits within screen height with padding, otherwise align to top
    if (tableHeight < windowHeight - 90) {
      const centerScrollY = targetY - (windowHeight - tableHeight) / 2;
      window.scrollTo({ top: Math.max(0, centerScrollY), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: Math.max(0, targetY - 80), behavior: 'smooth' });
    }
  };

  // Toggle expand in place for a specific entry
  const handleToggleExpand = (entry: DailyLogEntry) => {
    if (expandedDate === entry.date) {
      setExpandedDate(null);
      setAccordionState(null);
    } else {
      setExpandedDate(entry.date);
      setAccordionState({
        date: entry.date,
        studyHours: entry.studyHours,
        attendedClass: entry.attendedClass,
        pyqsSolved: entry.pyqsSolved,
        revisionDone: entry.revisionDone,
        mockTestTaken: entry.mockTestTaken,
        sleepHours: entry.sleepHours,
        focusRating: entry.focusRating,
        notes: entry.notes || '',
        customData: { ...(entry.customData || {}) },
      });
      if (tableContainerRef.current) {
        setContainerWidth(tableContainerRef.current.clientWidth);
        tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
      setTimeout(() => {
        scrollToCenterTable();
      }, 80);
    }
  };

  // Open and focus notes directly (in form on top, or in accordion if already expanded)
  const handleOpenNoteEdit = (entry: DailyLogEntry) => {
    if (expandedDate === entry.date) {
      setTimeout(() => {
        const el = document.getElementById(`accordion-notes-${entry.date}`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      handleSelectDayForForm(entry);
      setTimeout(() => {
        const el = document.getElementById('log-form-notes');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };

  // Month/Year navigation list
  const availableMonths = useMemo(() => {
    const map = new Map<string, number>();
    dailyLogs.forEach((l) => {
      const ym = l.date.substring(0, 7); // e.g. "2026-10"
      map.set(ym, (map.get(ym) || 0) + 1);
    });
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([ym, count]) => {
        const [y, m] = ym.split('-').map(Number);
        return {
          value: ym,
          label: `${months[m - 1]} ${y}`,
          count,
        };
      });
  }, [dailyLogs]);

  // Filter logs based on Month/Year selection
  const filteredDailyLogs = useMemo(() => {
    if (selectedMonthYear === 'all') return dailyLogs;
    return dailyLogs.filter((l) => l.date.startsWith(selectedMonthYear));
  }, [dailyLogs, selectedMonthYear]);

  // Paginated/Chunked visible logs
  const visibleLogs = filteredDailyLogs.slice(0, visibleLimit);

  // Row click dispatcher: opens the form on top ONLY if enableTopForm is true; otherwise toggles inline accordion
  const handleRowClick = (entry: DailyLogEntry) => {
    if (enableTopForm) {
      handleSelectDayForForm(entry);
    } else {
      handleToggleExpand(entry);
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
      customData: formCustomData,
    };
    addOrUpdateDailyLog(newEntry);
    setShowForm(false);
  };

  // Save accordion full day edits
  const handleSaveAccordion = (date: string) => {
    if (!accordionState) return;
    updateDailyLogField(date, 'studyHours', Number(accordionState.studyHours) || 0);
    updateDailyLogField(date, 'attendedClass', accordionState.attendedClass);
    updateDailyLogField(date, 'pyqsSolved', Number(accordionState.pyqsSolved) || 0);
    updateDailyLogField(date, 'revisionDone', accordionState.revisionDone);
    updateDailyLogField(date, 'mockTestTaken', accordionState.mockTestTaken);
    updateDailyLogField(date, 'sleepHours', Number(accordionState.sleepHours) || 0);
    updateDailyLogField(date, 'focusRating', accordionState.focusRating);
    updateDailyLogField(date, 'notes', accordionState.notes);
    if (accordionState.customData) {
      Object.entries(accordionState.customData).forEach(([colId, val]) => {
        updateDailyLogCustomField(date, colId, val);
      });
    }
    setExpandedDate(null);
    setAccordionState(null);
  };

  // Create new custom column
  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    const opts =
      newColType === 'select'
        ? newColOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    addCustomColumn({
      name: newColName.trim(),
      type: newColType,
      options: opts && opts.length > 0 ? opts : ['Good', 'Okay', 'Bad'],
    });

    setNewColName('');
    setNewColType('boolean');
    setNewColOptions('');
    setShowAddColumnModal(false);
  };

  // Save changes to existing custom column
  const handleSaveEditColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumn || !editingColumn.name.trim()) return;
    const opts =
      editingColumn.type === 'select'
        ? editingColumn.options
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    updateCustomColumn(editingColumn.id, {
      name: editingColumn.name.trim(),
      type: editingColumn.type,
      options: opts && opts.length > 0 ? opts : ['Good', 'Okay', 'Bad'],
    });
    setEditingColumn(null);
  };

  // Delete column
  const handleDeleteColumn = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" column and its tracked values?`)) {
      deleteCustomColumn(id);
      setEditingColumn(null);
    }
  };

  // Move column left or right
  const handleMoveColumn = (currentIndex: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= customColumns.length) return;
    reorderCustomColumns(currentIndex, targetIndex);
    if (editingColumn) {
      setEditingColumn({ ...editingColumn, index: targetIndex });
    }
  };

  // Delete day log entry
  const handleDeleteEntry = (date: string) => {
    if (window.confirm(`Delete log entry for ${formatDateDisplay(date)}?`)) {
      deleteDailyLog(date);
      setExpandedDate(null);
      setAccordionState(null);
    }
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
    <div className="w-full flex flex-col space-y-8 animate-fadeIn">
      {/* 1. Header Section */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-[#e9762b] font-bold block mb-1">
            STUDY TRACKER
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase font-mono">
            Daily Study Log
          </h1>
        </div>

        <ShinyButton
          onClick={() => {
            if (showForm && enableTopForm) {
              setShowForm(false);
            } else {
              setEnableTopForm(true);
              handleSelectDayForForm(undefined, todayStr);
            }
          }}
          label="LOG A DAY"
          cornerRadius={12}
          className="!px-5 sm:!px-6 !py-2.5 !text-xs sm:!text-sm !font-mono !font-extrabold !uppercase !tracking-wider !rounded-xl active:scale-95 transition shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>LOG A DAY</span>
        </ShinyButton>
      </div>

      {/* 2. Summary Stats Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Current Streak */}
        <div className="p-5 sm:p-6 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-h-[135px]">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
            CURRENT STREAK
          </span>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">{currentStreak}</span>
            <span className="text-xs sm:text-sm text-slate-400 font-mono font-medium">days</span>
          </div>
        </div>

        {/* Card 2: This Week */}
        <div className="p-5 sm:p-6 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-h-[135px]">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
            THIS WEEK
          </span>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">{thisWeekHours.toFixed(1)}</span>
            <span className="text-xs sm:text-sm text-slate-400 font-mono font-medium">hrs studied</span>
          </div>
        </div>

        {/* Card 3: Revision Rate */}
        <div className="p-5 sm:p-6 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-h-[135px]">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
            REVISION RATE
          </span>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">{revisionRate}</span>
            <span className="text-xs sm:text-sm text-slate-400 font-mono font-medium">% of days</span>
          </div>
        </div>

        {/* Card 4: Avg Focus (Highlighted Orange Glass Card) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#e9762b] to-[#ff5f00] text-black flex flex-col justify-between min-h-[135px] shadow-[0_10px_30px_rgba(233,118,43,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] border border-white/20 transition-all duration-300 hover:scale-[1.02]">
          <span className="text-xs font-mono uppercase tracking-widest text-black/80 font-bold">
            AVG. FOCUS
          </span>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-black font-mono">{avgFocus}</span>
            <span className="text-xs sm:text-sm text-black/80 font-mono font-bold">/ 5</span>
          </div>
        </div>
      </div>

      {/* 3. Log an Entry (Quick Add / Edit Form) - ONLY SHOWN WHEN ENABLED VIA TOGGLE */}
      {enableTopForm && showForm && (
        <div
          id="log-form-container"
          className="w-full p-6 sm:p-8 rounded-2xl glass-panel-glow shadow-2xl space-y-6 animate-fadeIn"
        >
          {/* Form Top Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white font-mono">
              Editing – {formatDateDisplay(formDate)}
            </h2>
          </div>

          <form onSubmit={handleSaveEntry} className="space-y-6">
            {/* Row 1: Date Picker */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="text-slate-400 uppercase tracking-widest font-bold">DATE</span>
              <button
                type="button"
                onClick={() => handleSelectDayForForm(undefined, todayStr)}
                className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider font-bold transition cursor-pointer ${
                  formDate === todayStr
                    ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/20'
                    : 'glass-pill text-slate-300 hover:text-white'
                }`}
              >
                TODAY
              </button>
              <button
                type="button"
                onClick={() => handleSelectDayForForm(undefined, yesterdayStr)}
                className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider font-bold transition cursor-pointer ${
                  formDate === yesterdayStr
                    ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/20'
                    : 'glass-pill text-slate-300 hover:text-white'
                }`}
              >
                YESTERDAY
              </button>
              <input
                type="date"
                value={formDate}
                onChange={(e) => handleSelectDayForForm(undefined, e.target.value)}
                className="glass-input rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
              />
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
                  className="w-full glass-input rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none"
                />
              </div>

              {/* Attended Class */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                  ATTENDED CLASS?
                </label>
                <div className="grid grid-cols-2 gap-1 glass-pill p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setAttendedClass(true)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center cursor-pointer ${
                      attendedClass ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendedClass(false)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center cursor-pointer ${
                      !attendedClass ? 'glass-pill text-white border-white/20' : 'text-slate-400 hover:text-white'
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
                  className="w-full glass-input rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none"
                />
              </div>

              {/* Revision Done */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                  REVISION DONE?
                </label>
                <div className="grid grid-cols-2 gap-1 glass-pill p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRevisionDone(true)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center cursor-pointer ${
                      revisionDone ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevisionDone(false)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center cursor-pointer ${
                      !revisionDone ? 'glass-pill text-white border-white/20' : 'text-slate-400 hover:text-white'
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
                <div className="grid grid-cols-2 gap-1 glass-pill p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setMockTestTaken(true)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center cursor-pointer ${
                      mockTestTaken ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/20' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockTestTaken(false)}
                    className={`py-1.5 rounded font-bold uppercase transition text-center cursor-pointer ${
                      !mockTestTaken ? 'glass-pill text-white border-white/20' : 'text-slate-400 hover:text-white'
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
                  className="w-full glass-input rounded-lg px-3 py-2 text-white font-mono text-center focus:outline-none"
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
                    className={`w-12 h-10 rounded-lg font-bold text-sm transition flex items-center justify-center cursor-pointer ${
                      focusRating === val
                        ? 'bg-[#e9762b] text-black shadow-lg shadow-orange-500/20 font-extrabold'
                        : 'glass-pill text-slate-400 hover:text-white'
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
                id="log-form-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything worth remembering about today..."
                className="w-full glass-input rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none"
              />
            </div>

            {/* Custom Trackers (if user has added custom columns) */}
            {customColumns.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-white/10 font-mono">
                <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  CUSTOM TRACKERS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customColumns.map((col) => (
                    <div key={col.id} className="space-y-1.5 glass-panel p-3 rounded-xl">
                      <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                        {col.name}
                      </label>
                      {col.type === 'boolean' && (
                        <div className="grid grid-cols-2 gap-1.5 glass-pill p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setFormCustomData({ ...formCustomData, [col.id]: true })}
                            className={`py-1.5 rounded-lg font-bold uppercase transition text-xs ${
                              formCustomData[col.id]
                                ? 'bg-[#10b981] text-black font-extrabold shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            YES
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormCustomData({ ...formCustomData, [col.id]: false })}
                            className={`py-1.5 rounded-lg font-bold uppercase transition text-xs ${
                              !formCustomData[col.id]
                                ? 'bg-white/10 text-white border border-white/20'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            NO
                          </button>
                        </div>
                      )}
                      {col.type === 'number' && (
                        <input
                          type="number"
                          step="any"
                          value={formCustomData[col.id] ?? ''}
                          onChange={(e) =>
                            setFormCustomData({
                              ...formCustomData,
                              [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                            })
                          }
                          placeholder="Enter number..."
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e9762b]"
                        />
                      )}
                      {col.type === 'text' && (
                        <input
                          type="text"
                          value={formCustomData[col.id] ?? ''}
                          onChange={(e) =>
                            setFormCustomData({ ...formCustomData, [col.id]: e.target.value })
                          }
                          placeholder="Enter text..."
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#e9762b]"
                        />
                      )}
                      {col.type === 'select' && (
                        <select
                          value={formCustomData[col.id] ?? ''}
                          onChange={(e) =>
                            setFormCustomData({ ...formCustomData, [col.id]: e.target.value })
                          }
                          className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#e9762b] cursor-pointer"
                        >
                          <option value="" className="bg-[#141413] text-slate-500">
                            -- Select --
                          </option>
                          {(col.options || []).map((opt) => (
                            <option key={opt} value={opt} className="bg-[#141413] text-white">
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-lg bg-[#141413] border border-white/10 text-slate-400 hover:text-white text-xs uppercase font-bold tracking-wider transition"
              >
                CANCEL
              </button>
              <ShinyButton
                type="submit"
                label="SAVE ENTRY"
                cornerRadius={10}
                className="!px-7 !py-2.5 !text-xs !font-mono !font-extrabold !uppercase !tracking-wider active:scale-95 transition"
              />
            </div>
          </form>
        </div>
      )}

      {/* 4. Study History Table Section */}
      <div className="space-y-4">
        {/* Table Top Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono pb-2">
          <div 
            onClick={scrollToCenterTable}
            className="cursor-pointer group/title select-none"
            title="Click to center table on screen"
          >
            <h2 className="text-xl sm:text-2xl font-extrabold text-white group-hover/title:text-[#e9762b] transition tracking-tight uppercase font-mono">
              Study History
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            {/* Toggle to enable/disable Top Edit Form */}
            <div className="flex items-center gap-2.5 glass-panel px-3.5 py-2 rounded-xl select-none">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold font-mono">
                EDIT FORM:
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={enableTopForm}
                onClick={() => {
                  const next = !enableTopForm;
                  setEnableTopForm(next);
                  if (next) {
                    setShowForm(true);
                    handleSelectDayForForm(undefined, formDate || todayStr);
                  } else {
                    setShowForm(false);
                  }
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                  enableTopForm ? 'bg-[#e9762b]' : 'bg-[#252524]'
                }`}
                title={enableTopForm ? 'Click to disable Top Edit Form' : 'Click to enable Top Edit Form'}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full transition-transform ${
                    enableTopForm ? 'translate-x-4 bg-black' : 'translate-x-1 bg-slate-400'
                  }`}
                />
              </button>
              <span className={`text-xs font-mono font-bold uppercase ${enableTopForm ? 'text-[#e9762b]' : 'text-slate-500'}`}>
                {enableTopForm ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Month / Year Filter Dropdown */}
            <div className="flex items-center gap-2 glass-panel px-3.5 py-2 rounded-xl">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                MONTH:
              </span>
              <select
                value={selectedMonthYear}
                onChange={(e) => {
                  setSelectedMonthYear(e.target.value);
                  setVisibleLimit(20);
                }}
                className="bg-transparent text-xs sm:text-sm text-white focus:outline-none font-bold uppercase cursor-pointer font-mono"
              >
                <option value="all" className="bg-[#141413]">ALL MONTHS ({dailyLogs.length})</option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value} className="bg-[#141413]">
                    {m.label.toUpperCase()} ({m.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Container with Sticky Horizontal & Vertical Scroll */}
        <div ref={tableSectionRef} className="w-full rounded-2xl glass-panel overflow-hidden font-mono shadow-2xl scroll-mt-24">
          <div ref={tableContainerRef} className="overflow-x-auto max-h-[80vh] overflow-y-auto relative scrollbar-thin scrollbar-thumb-white/20">
            <table className="w-full text-left text-xs sm:text-sm border-separate border-spacing-0">
              {/* Sticky Top Header */}
              <thead 
                onClick={scrollToCenterTable}
                className="sticky top-0 z-40 glass-table-header cursor-pointer select-none"
                title="Click table bar to center table on screen"
              >
                <tr className="text-xs text-slate-200 uppercase tracking-widest font-bold">
                  {/* Sticky Date Column Header */}
                  <th 
                    onClick={scrollToCenterTable}
                    className="py-3.5 px-3 sm:px-4 font-bold sticky left-0 top-0 z-50 glass-sticky-th border-r border-white/12 min-w-[110px] w-[110px] sm:min-w-[125px] sm:w-[125px] cursor-pointer"
                    title="Click date column to center table on screen"
                  >
                    DATE
                  </th>
                  <th className="py-3.5 px-3 sm:px-4 font-bold text-center sticky top-0 z-40 min-w-[78px] sm:min-w-[92px]">HOURS</th>
                  <th className="py-3.5 px-2.5 sm:px-3.5 font-bold text-center sticky top-0 z-40 min-w-[72px] sm:min-w-[84px]">CLASS</th>
                  <th className="py-3.5 px-2.5 sm:px-3.5 font-bold text-center sticky top-0 z-40 min-w-[74px] sm:min-w-[86px]">PYQS</th>
                  <th className="py-3.5 px-2.5 sm:px-3.5 font-bold text-center sticky top-0 z-40 min-w-[72px] sm:min-w-[84px]" title="Revision Done">REV</th>
                  <th className="py-3.5 px-2.5 sm:px-3.5 font-bold text-center sticky top-0 z-40 min-w-[72px] sm:min-w-[84px]" title="Mock Test Taken">MOCK</th>
                  <th className="py-3.5 px-2.5 sm:px-3.5 font-bold text-center sticky top-0 z-40 min-w-[74px] sm:min-w-[86px]">SLEEP</th>
                  <th className="py-3.5 px-2.5 sm:px-3.5 font-bold text-center sticky top-0 z-40 min-w-[72px] sm:min-w-[84px]">NOTES</th>
                  <th className="py-3.5 px-3 sm:px-4 font-bold text-center sticky top-0 z-40 min-w-[78px] sm:min-w-[92px]">FOCUS</th>

                  {/* Dynamic Custom Column Headers */}
                  {customColumns.map((col, idx) => (
                    <th
                      key={col.id}
                      className="py-3.5 px-3 sm:px-4 font-bold text-center whitespace-nowrap sticky top-0 z-40 min-w-[100px] sm:min-w-[120px] max-w-[160px]"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingColumn({
                            id: col.id,
                            name: col.name,
                            type: col.type,
                            options: (col.options || []).join(', '),
                            index: idx,
                          });
                        }}
                        className="text-xs uppercase tracking-wider font-bold text-slate-200 hover:text-[#e9762b] truncate max-w-[130px] cursor-pointer transition select-none font-mono"
                        title={`Click to edit "${col.name}" column`}
                      >
                        {col.name}
                      </button>
                    </th>
                  ))}

                  {/* Add Column Button at the end of the header row */}
                  <th className="py-3.5 px-3 font-bold whitespace-nowrap text-center sticky right-0 top-0 z-50 glass-sticky-th-right border-l border-white/12 min-w-[95px] w-[95px] sm:min-w-[110px] sm:w-[110px]">
                    <button
                      type="button"
                      onClick={() => setShowAddColumnModal(true)}
                      className="inline-flex items-center justify-center px-2 py-1.5 rounded-lg bg-white/5 hover:bg-[#e9762b] hover:text-black text-[11px] text-slate-200 font-bold uppercase tracking-wider transition border border-white/10 hover:border-[#e9762b] cursor-pointer shadow-sm w-full font-mono"
                      title="Add a custom column (e.g. Mood, Water, Exercise)"
                    >
                      + COLUMN
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleLogs.map((entry, idx) => {
                  const isExpanded = expandedDate === entry.date;
                  const hasNote = Boolean(entry.notes && entry.notes.trim().length > 0);
                  return (
                    <React.Fragment key={entry.date}>
                      <tr
                        onClick={() => {
                          if (idx === 0) {
                            scrollToCenterTable();
                          }
                        }}
                        className={`hover:bg-white/[0.04] transition group/row ${
                          isExpanded ? 'bg-white/[0.04]' : ''
                        } ${idx === 0 ? 'cursor-pointer' : ''}`}
                        title={idx === 0 ? 'Click first row to center table on screen' : undefined}
                      >
                        {/* Pinned / Sticky Date Column - The ONLY button that opens edit/details */}
                        <td
                          onClick={scrollToCenterTable}
                          className={`py-3 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap sticky left-0 z-20 glass-sticky-col-cell border-r border-white/10 min-w-[110px] w-[110px] sm:min-w-[125px] sm:w-[125px] cursor-pointer ${
                            isExpanded ? '!bg-[#1a1a18]' : ''
                          }`}
                          title="Click date column to center table on screen"
                        >
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpand(entry);
                              }}
                              className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none font-mono ${
                                isExpanded
                                  ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/20'
                                  : 'text-[#e9762b] bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50'
                              }`}
                              title="Click date to open details & edit"
                            >
                              <span>{formatDateDisplay(entry.date)}</span>
                            </button>
                          </div>
                        </td>

                        {/* Study Hours Column */}
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center min-w-[78px] sm:min-w-[92px]">
                          <span className="text-white font-mono font-bold text-xs sm:text-sm">{entry.studyHours}h</span>
                        </td>

                        {/* Class Attended Dot */}
                        <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[72px] sm:min-w-[84px]">
                          <span
                            className={`inline-block w-3.5 h-3.5 rounded-full transition-transform group-hover/row:scale-110 ${
                              entry.attendedClass ? 'bg-[#10b981] shadow-sm shadow-emerald-500/50' : 'bg-[#374151]'
                            }`}
                          />
                        </td>

                        {/* PYQs Solved */}
                        <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[74px] sm:min-w-[86px]">
                          <span className="text-white font-mono font-bold text-xs sm:text-sm">{entry.pyqsSolved}</span>
                        </td>

                        {/* Revision Done Dot */}
                        <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[72px] sm:min-w-[84px]">
                          <span
                            className={`inline-block w-3.5 h-3.5 rounded-full transition-transform group-hover/row:scale-110 ${
                              entry.revisionDone ? 'bg-[#10b981] shadow-sm shadow-emerald-500/50' : 'bg-[#374151]'
                            }`}
                          />
                        </td>

                        {/* Mock Test Taken Dot */}
                        <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[72px] sm:min-w-[84px]">
                          <span
                            className={`inline-block w-3.5 h-3.5 rounded-full transition-transform group-hover/row:scale-110 ${
                              entry.mockTestTaken ? 'bg-[#10b981] shadow-sm shadow-emerald-500/50' : 'bg-[#374151]'
                            }`}
                          />
                        </td>

                        {/* Sleep Hours */}
                        <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[74px] sm:min-w-[86px]">
                          <span className="text-white font-mono font-bold text-xs sm:text-sm">{entry.sleepHours}h</span>
                        </td>

                        {/* Notes Column with Rich Tooltip (no icon) */}
                        <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[72px] sm:min-w-[84px]">
                          {hasNote ? (
                            <div className="relative inline-flex items-center justify-center group/note">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-[#e9762b] bg-orange-500/15 border border-orange-500/30 select-none">
                                Note
                              </span>

                              {/* Hover Tooltip showing the note text */}
                              <div className="opacity-0 group-hover/note:opacity-100 pointer-events-none transition-opacity duration-200 absolute bottom-full mb-2 z-40 left-1/2 -translate-x-1/2 glass-modal text-xs px-3.5 py-2 rounded-xl shadow-2xl max-w-sm min-w-[200px] text-left whitespace-normal">
                                <span className="text-[10px] text-[#e9762b] uppercase font-bold tracking-wider block mb-1">
                                  {formatDateDisplay(entry.date)} Note:
                                </span>
                                <p className="text-slate-200 text-xs leading-relaxed break-words">
                                  {entry.notes}
                                </p>
                                <div className="w-2 h-2 glass-modal border-r border-b border-white/20 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-600 font-mono text-xs">-</span>
                          )}
                        </td>

                        {/* Focus Rating */}
                        <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center text-slate-200 font-mono font-bold text-xs sm:text-sm min-w-[78px] sm:min-w-[92px]">
                          {entry.focusRating}/5
                        </td>

                        {/* Dynamic Custom Column Cells */}
                        {customColumns.map((col) => {
                          const val = entry.customData?.[col.id];
                          return (
                            <td key={col.id} className="py-3 sm:py-3.5 px-3 sm:px-4 text-center whitespace-nowrap font-mono text-xs sm:text-sm min-w-[100px] sm:min-w-[120px] max-w-[160px]">
                              {col.type === 'boolean' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateDailyLogCustomField(entry.date, col.id, !val);
                                  }}
                                  className="inline-flex items-center justify-center p-1 rounded-lg hover:bg-white/10 cursor-pointer transition"
                                  title={`Click to toggle ${col.name}`}
                                >
                                  <span
                                    className={`inline-block w-3.5 h-3.5 rounded-full transition-all ${
                                      val ? 'bg-[#10b981] shadow-sm shadow-emerald-500/50 scale-110' : 'bg-[#374151]'
                                    }`}
                                  />
                                </button>
                              )}
                              {col.type === 'number' && (
                                <span className="text-white font-bold">
                                  {val !== undefined && val !== null && val !== '' ? (
                                    val
                                  ) : (
                                    <span className="text-slate-600">-</span>
                                  )}
                                </span>
                              )}
                              {col.type === 'text' && (
                                <span
                                  className="text-slate-200 text-xs sm:text-sm max-w-[130px] truncate inline-block"
                                  title={val || ''}
                                >
                                  {val || <span className="text-slate-600">-</span>}
                                </span>
                              )}
                              {col.type === 'select' && (
                                val ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">-</span>
                                )
                              )}
                            </td>
                          );
                        })}

                        {/* Blank cell under ADD COLUMN button */}
                        <td className="py-3 sm:py-3.5 px-3 sticky right-0 z-20 glass-sticky-col-cell-right border-l border-white/5 min-w-[95px] w-[95px] sm:min-w-[110px] sm:w-[110px]"></td>
                      </tr>

                      {/* Expand in place accordion sub-panel */}
                      {isExpanded && accordionState && (
                        <tr className="bg-white/[0.02] backdrop-blur-2xl border-b border-white/10" onClick={(e) => e.stopPropagation()}>
                          <td colSpan={10 + customColumns.length} className="p-0 border-b border-white/10">
                            <div 
                              className="sticky left-0 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-5 box-border overflow-hidden"
                              style={{
                                width: containerWidth ? `${containerWidth}px` : '100%',
                                maxWidth: containerWidth ? `${containerWidth}px` : '100%',
                              }}
                            >
                              {/* Accordion Top Header with Delete Button */}
                              <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#e9762b] font-bold shrink-0">
                                    DETAILS &amp; EDITING —
                                  </span>
                                  <span className="text-sm font-bold text-white font-mono truncate">
                                    {formatDateDisplay(entry.date)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEntry(entry.date)}
                                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-xs font-mono font-bold transition cursor-pointer"
                                  title="Delete this day's entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>DELETE DAY</span>
                                </button>
                              </div>

                              {/* Row 1: Numerical Fields (Study Hours, PYQs, Sleep Hours, Focus Rating) */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono">
                                {/* Study Hours */}
                                <div className="glass-panel p-3 rounded-xl space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                    STUDY HOURS
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max="24"
                                      value={accordionState.studyHours}
                                      onChange={(e) =>
                                        setAccordionState({
                                          ...accordionState,
                                          studyHours: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-white font-bold text-center focus:outline-none"
                                    />
                                    <span className="text-xs text-slate-400 font-bold">hrs</span>
                                  </div>
                                </div>

                                {/* PYQs Solved */}
                                <div className="glass-panel p-3 rounded-xl space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                    PYQS SOLVED
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      step="1"
                                      min="0"
                                      value={accordionState.pyqsSolved}
                                      onChange={(e) =>
                                        setAccordionState({
                                          ...accordionState,
                                          pyqsSolved: parseInt(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-white font-bold text-center focus:outline-none"
                                    />
                                    <span className="text-xs text-slate-400 font-bold">ques</span>
                                  </div>
                                </div>

                                {/* Sleep Hours */}
                                <div className="glass-panel p-3 rounded-xl space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                    SLEEP HOURS
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max="24"
                                      value={accordionState.sleepHours}
                                      onChange={(e) =>
                                        setAccordionState({
                                          ...accordionState,
                                          sleepHours: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-white font-bold text-center focus:outline-none"
                                    />
                                    <span className="text-xs text-slate-400 font-bold">hrs</span>
                                  </div>
                                </div>

                                {/* Focus Rating */}
                                <div className="glass-panel p-3 rounded-xl space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                                    FOCUS ({accordionState.focusRating}/5)
                                  </label>
                                  <div className="grid grid-cols-5 gap-1 pt-1 w-full min-w-0">
                                    {[1, 2, 3, 4, 5].map((val) => (
                                      <button
                                        key={val}
                                        type="button"
                                        onClick={() =>
                                          setAccordionState({ ...accordionState, focusRating: val })
                                        }
                                        className={`h-7 w-full min-w-0 rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center p-0 ${
                                          accordionState.focusRating === val
                                            ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/30'
                                            : 'glass-pill text-slate-400 hover:text-white'
                                        }`}
                                      >
                                        {val}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Row 2: Habit Indicators (Class, Revision, Mock) */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 font-mono text-xs">
                                {/* Attended Class? */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                    ATTENDED CLASS?
                                  </label>
                                  <div className="grid grid-cols-2 gap-1.5 glass-pill p-1 rounded-xl">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, attendedClass: true })
                                      }
                                      className={`py-1.5 rounded-lg font-bold uppercase transition text-xs cursor-pointer ${
                                        accordionState.attendedClass
                                          ? 'bg-[#10b981] text-black font-extrabold shadow-sm'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      YES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, attendedClass: false })
                                      }
                                      className={`py-1.5 rounded-lg font-bold uppercase transition text-xs cursor-pointer ${
                                        !accordionState.attendedClass
                                          ? 'glass-pill text-white border-white/20'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      NO
                                    </button>
                                  </div>
                                </div>

                                {/* Revision Done? */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                    REVISION DONE?
                                  </label>
                                  <div className="grid grid-cols-2 gap-1.5 glass-pill p-1 rounded-xl">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, revisionDone: true })
                                      }
                                      className={`py-1.5 rounded-lg font-bold uppercase transition text-xs cursor-pointer ${
                                        accordionState.revisionDone
                                          ? 'bg-[#10b981] text-black font-extrabold shadow-sm'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      YES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, revisionDone: false })
                                      }
                                      className={`py-1.5 rounded-lg font-bold uppercase transition text-xs cursor-pointer ${
                                        !accordionState.revisionDone
                                          ? 'glass-pill text-white border-white/20'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      NO
                                    </button>
                                  </div>
                                </div>

                                {/* Mock Test Taken? */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                    MOCK TEST?
                                  </label>
                                  <div className="grid grid-cols-2 gap-1.5 glass-pill p-1 rounded-xl">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, mockTestTaken: true })
                                      }
                                      className={`py-1.5 rounded-lg font-bold uppercase transition text-xs cursor-pointer ${
                                        accordionState.mockTestTaken
                                          ? 'bg-[#10b981] text-black font-extrabold shadow-sm'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      YES
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setAccordionState({ ...accordionState, mockTestTaken: false })
                                      }
                                      className={`py-1.5 rounded-lg font-bold uppercase transition text-xs cursor-pointer ${
                                        !accordionState.mockTestTaken
                                          ? 'glass-pill text-white border-white/20'
                                          : 'text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      NO
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Row 3: Notes Input in Accordion */}
                              <div className="space-y-1.5 font-mono">
                                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                  NOTES &amp; OBSERVATIONS
                                </label>
                                <input
                                  id={`accordion-notes-${entry.date}`}
                                  type="text"
                                  value={accordionState.notes}
                                  onChange={(e) =>
                                    setAccordionState({ ...accordionState, notes: e.target.value })
                                  }
                                  placeholder="Write any thoughts, chapters covered, roadblocks..."
                                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                                />
                              </div>

                              {/* Row 4: Custom Trackers & Metrics in Accordion */}
                              {customColumns.length > 0 && (
                                <div className="space-y-3 pt-3 border-t border-white/10 font-mono">
                                  <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                                    CUSTOM TRACKERS &amp; METRICS
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                    {customColumns.map((col) => (
                                      <div
                                        key={col.id}
                                        className="glass-panel p-3 rounded-xl space-y-1.5"
                                      >
                                        <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                                          {col.name}
                                        </label>
                                        {col.type === 'boolean' && (
                                          <div className="grid grid-cols-2 gap-1.5 glass-pill p-1 rounded-lg">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setAccordionState({
                                                  ...accordionState,
                                                  customData: {
                                                    ...accordionState.customData,
                                                    [col.id]: true,
                                                  },
                                                })
                                              }
                                              className={`py-1.5 rounded font-bold uppercase transition text-xs cursor-pointer ${
                                                accordionState.customData?.[col.id]
                                                  ? 'bg-[#10b981] text-black font-extrabold shadow-sm'
                                                  : 'text-slate-400 hover:text-white'
                                              }`}
                                            >
                                              YES
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setAccordionState({
                                                  ...accordionState,
                                                  customData: {
                                                    ...accordionState.customData,
                                                    [col.id]: false,
                                                  },
                                                })
                                              }
                                              className={`py-1.5 rounded font-bold uppercase transition text-xs cursor-pointer ${
                                                !accordionState.customData?.[col.id]
                                                  ? 'glass-pill text-white border-white/20'
                                                  : 'text-slate-400 hover:text-white'
                                              }`}
                                            >
                                              NO
                                            </button>
                                          </div>
                                        )}
                                        {col.type === 'number' && (
                                          <input
                                            type="number"
                                            step="any"
                                            value={accordionState.customData?.[col.id] ?? ''}
                                            onChange={(e) =>
                                              setAccordionState({
                                                ...accordionState,
                                                customData: {
                                                  ...accordionState.customData,
                                                  [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                                                },
                                              })
                                            }
                                            placeholder="Enter number..."
                                            className="w-full glass-input rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                                          />
                                        )}
                                        {col.type === 'text' && (
                                          <input
                                            type="text"
                                            value={accordionState.customData?.[col.id] ?? ''}
                                            onChange={(e) =>
                                              setAccordionState({
                                                ...accordionState,
                                                customData: {
                                                  ...accordionState.customData,
                                                  [col.id]: e.target.value,
                                                },
                                              })
                                            }
                                            placeholder="Enter text..."
                                            className="w-full glass-input rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                                          />
                                        )}
                                        {col.type === 'select' && (
                                          <select
                                            value={accordionState.customData?.[col.id] ?? ''}
                                            onChange={(e) =>
                                              setAccordionState({
                                                ...accordionState,
                                                customData: {
                                                  ...accordionState.customData,
                                                  [col.id]: e.target.value,
                                                },
                                              })
                                            }
                                            className="w-full glass-input rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                                          >
                                            <option value="" className="bg-[#141413] text-slate-500">
                                              -- Select --
                                            </option>
                                            {(col.options || []).map((opt) => (
                                              <option key={opt} value={opt} className="bg-[#141413] text-white">
                                                {opt}
                                              </option>
                                            ))}
                                          </select>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Accordion Action Buttons */}
                              <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedDate(null);
                                    setAccordionState(null);
                                  }}
                                  className="px-5 py-2 rounded-lg bg-[#1c1c1b] border border-white/10 text-slate-400 hover:text-white text-xs uppercase font-bold tracking-wider transition cursor-pointer"
                                >
                                  CLOSE
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveAccordion(entry.date)}
                                  className="px-6 py-2 rounded-lg bg-[#e9762b] text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20 shrink-0"
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

          {/* Bottom Table Navigation & Chunk Loading Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white/[0.03] backdrop-blur-xl border-t border-white/10 font-mono text-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-slate-400">
              Showing <span className="text-white font-bold">{visibleLogs.length}</span> of{' '}
              <span className="text-white font-bold">{filteredDailyLogs.length}</span> days recorded
            </span>

            <div className="flex items-center gap-2">
              {filteredDailyLogs.length > visibleLogs.length && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 10)}
                  className="px-4 py-1.5 rounded-lg glass-pill hover:border-orange-500/40 text-[#e9762b] font-bold uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Load More (+10)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}

              {visibleLimit > 10 && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit(10)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white uppercase font-bold text-[11px] transition cursor-pointer"
                >
                  Show Less
                </button>
              )}
            </div>
          </div>

          {/* Table Legend */}
          <div className="py-3 px-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-4 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                Done / Yes
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#374151]" />
                Missed / No
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Custom Column */}
      {showAddColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-modal rounded-2xl p-6 shadow-2xl font-mono space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  Add Custom Column
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Expand your table into a personalized tracker
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddColumnModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateColumn} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                  COLUMN NAME
                </label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Mood, Water intake, Exercise, Pages read"
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                  COLUMN TYPE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      type: 'boolean' as CustomColumnType,
                      label: 'Tick / Checkbox',
                      desc: 'Yes/No status dot',
                      icon: CheckSquare,
                      color: 'text-[#10b981]',
                    },
                    {
                      type: 'number' as CustomColumnType,
                      label: 'Number',
                      desc: 'Numeric value input',
                      icon: Hash,
                      color: 'text-sky-400',
                    },
                    {
                      type: 'text' as CustomColumnType,
                      label: 'Short Text',
                      desc: 'Free text entry',
                      icon: Type,
                      color: 'text-amber-400',
                    },
                    {
                      type: 'select' as CustomColumnType,
                      label: 'Dropdown / Select',
                      desc: 'Pick from custom options',
                      icon: List,
                      color: 'text-purple-400',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = newColType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setNewColType(item.type)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/10 border-[#e9762b] shadow-sm shadow-orange-500/20'
                            : 'glass-pill text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                          <span className="font-bold text-white text-[11px]">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {newColType === 'select' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                    DROPDOWN OPTIONS (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newColOptions}
                    onChange={(e) => setNewColOptions(e.target.value)}
                    placeholder="e.g. Good, Okay, Bad, Exhausted"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Default if empty: Good, Okay, Bad
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-4 py-2 glass-pill text-slate-400 hover:text-white uppercase font-bold text-xs transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#e9762b] text-black font-extrabold uppercase text-xs tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20"
                >
                  CREATE COLUMN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit / Configure Custom Column */}
      {editingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-modal rounded-2xl p-6 shadow-2xl font-mono space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">
                  Configure Column
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Rename, reorder, change type, or delete
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingColumn(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditColumn} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                  COLUMN NAME
                </label>
                <input
                  type="text"
                  required
                  value={editingColumn.name}
                  onChange={(e) =>
                    setEditingColumn({ ...editingColumn, name: e.target.value })
                  }
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                  COLUMN TYPE
                </label>
                <select
                  value={editingColumn.type}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      type: e.target.value as CustomColumnType,
                    })
                  }
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="boolean" className="bg-[#141413]">Tick / Checkbox (Yes/No dot)</option>
                  <option value="number" className="bg-[#141413]">Number (Numeric input)</option>
                  <option value="text" className="bg-[#141413]">Short Text (Free text)</option>
                  <option value="select" className="bg-[#141413]">Dropdown / Select (Option badge)</option>
                </select>
              </div>

              {editingColumn.type === 'select' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                    OPTIONS (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingColumn.options}
                    onChange={(e) =>
                      setEditingColumn({ ...editingColumn, options: e.target.value })
                    }
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
              )}

              {/* Column Reordering */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                  COLUMN POSITION
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={editingColumn.index === 0}
                    onClick={() => handleMoveColumn(editingColumn.index, 'left')}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-300 font-bold uppercase text-[11px] border border-white/10 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>MOVE LEFT</span>
                  </button>
                  <button
                    type="button"
                    disabled={editingColumn.index === customColumns.length - 1}
                    onClick={() => handleMoveColumn(editingColumn.index, 'right')}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-slate-300 font-bold uppercase text-[11px] border border-white/10 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>MOVE RIGHT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Column */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteColumn(editingColumn.id, editingColumn.name)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>DELETE THIS COLUMN</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingColumn(null)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white uppercase font-bold text-xs transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#e9762b] text-black font-extrabold uppercase text-xs tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20"
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyStudyLog;
