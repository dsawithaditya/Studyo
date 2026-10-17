import React, { useState, useMemo } from 'react';
import { useStudyStore, INITIAL_DAILY_LOGS } from '../store/useStudyStore';
import { 
  TrendingUp, 
  Flame, 
  CheckCircle2, 
  BarChart2, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const StudyLogAnalysis: React.FC = () => {
  const { 
    dailyLogs: rawLogs,
    customColumns = [],
    customTables = [],
    activeTableId = 'main'
  } = useStudyStore();

  const dailyLogs = useMemo(
    () => (Array.isArray(rawLogs) && rawLogs.length > 0 ? rawLogs : INITIAL_DAILY_LOGS),
    [rawLogs]
  );
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  // 1. Available Tables
  const availableTables = useMemo(() => {
    const list: Array<{ id: string; title: string }> = [
      { id: 'main', title: 'Main Log' },
    ];
    if (Array.isArray(customTables)) {
      customTables.forEach((tbl) => {
        list.push({ id: tbl.id, title: tbl.title });
      });
    }
    return list;
  }, [customTables]);

  const [selectedTableId, setSelectedTableId] = useState<string>(() => {
    if (activeTableId && activeTableId !== 'main') {
      const found = customTables?.find((t) => t.id === activeTableId);
      if (found) return found.id;
    }
    return 'main';
  });

  // 2. Available Columns for the selected table
  interface ColumnMetric {
    id: string;
    label: string;
    unit: string;
    defaultMax: number;
    getValue: (dateStr: string, entry?: (typeof dailyLogs)[0]) => number;
  }

  const availableColumns = useMemo<ColumnMetric[]>(() => {
    if (selectedTableId === 'main') {
      const list: ColumnMetric[] = [
        {
          id: 'studyHours',
          label: 'Study Hours',
          unit: 'h',
          defaultMax: 8,
          getValue: (_, entry) => (entry && entry.studyHours != null ? entry.studyHours : 0),
        },
        {
          id: 'pyqsSolved',
          label: 'PYQs Solved',
          unit: ' Qs',
          defaultMax: 20,
          getValue: (_, entry) => (entry && entry.pyqsSolved != null ? entry.pyqsSolved : 0),
        },
        {
          id: 'sleepHours',
          label: 'Sleep Hours',
          unit: 'h',
          defaultMax: 8,
          getValue: (_, entry) => (entry && entry.sleepHours != null ? entry.sleepHours : 0),
        },
        {
          id: 'focusRating',
          label: 'Focus Rating',
          unit: '/5',
          defaultMax: 5,
          getValue: (_, entry) => (entry && entry.focusRating != null ? entry.focusRating : 0),
        },
      ];

      if (Array.isArray(customColumns)) {
        customColumns.forEach((col) => {
          const cleanName = col.name.length > 20 ? col.name.slice(0, 18) + '…' : col.name;
          list.push({
            id: `custom_${col.id}`,
            label: cleanName,
            unit: '',
            defaultMax: 10,
            getValue: (_, entry) => {
              const val = entry?.customData?.[col.id];
              if (typeof val === 'number') return val;
              if (typeof val === 'boolean') return val ? 1 : 0;
              const parsed = parseFloat(String(val));
              return isNaN(parsed) ? 0 : parsed;
            },
          });
        });
      }
      return list;
    } else {
      const tbl = customTables?.find((t) => t.id === selectedTableId);
      if (!tbl || !Array.isArray(tbl.columns) || tbl.columns.length === 0) {
        return [];
      }
      return tbl.columns.map((col) => {
        const cleanName = col.name.length > 20 ? col.name.slice(0, 18) + '…' : col.name;
        return {
          id: col.id,
          label: cleanName,
          unit: col.unit ? ` ${col.unit}` : '',
          defaultMax: col.type === 'rating' ? 5 : 10,
          getValue: (dateStr: string) => {
            const row = tbl.rows?.find((r) => r.date === dateStr);
            if (!row) return 0;
            const val = row.values?.[col.id];
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 1 : 0;
            const parsed = parseFloat(String(val));
            return isNaN(parsed) ? 0 : parsed;
          },
        };
      });
    }
  }, [selectedTableId, customColumns, customTables, dailyLogs]);

  const [selectedColumnId, setSelectedColumnId] = useState<string>('studyHours');

  // Handle table change: automatically reset column to the first column of the selected table
  const handleTableChange = (newTableId: string) => {
    setSelectedTableId(newTableId);
    if (newTableId === 'main') {
      setSelectedColumnId('studyHours');
    } else {
      const tbl = customTables?.find((t) => t.id === newTableId);
      if (tbl && tbl.columns && tbl.columns.length > 0) {
        setSelectedColumnId(tbl.columns[0].id);
      } else {
        setSelectedColumnId('');
      }
    }
  };

  const currentMetric = useMemo(() => {
    const found = availableColumns.find((c) => c.id === selectedColumnId);
    if (found) return found;
    if (availableColumns.length > 0) return availableColumns[0];
    return {
      id: 'empty',
      label: 'No Column',
      unit: '',
      defaultMax: 5,
      getValue: () => 0,
    };
  }, [availableColumns, selectedColumnId]);

  const selectedTableTitle = useMemo(() => {
    return availableTables.find((t) => t.id === selectedTableId)?.title || 'Main Log';
  }, [availableTables, selectedTableId]);

  // Sort logs ascending by date for chronological trend calculations
  const sortedLogs = useMemo(() => [...dailyLogs].sort((a, b) => a.date.localeCompare(b.date)), [dailyLogs]);

  // 1. Consistency streak calculation (consecutive days logged ending today or yesterday)
  const calculateStreak = () => {
    if (sortedLogs.length === 0) return 0;
    const sortedDates = [...new Set(sortedLogs.map((l) => l.date))].sort().reverse();
    if (sortedDates.length === 0) return 0;

    const d = new Date();
    const today = d.toISOString().split('T')[0];
    d.setDate(d.getDate() - 1);
    const yest = d.toISOString().split('T')[0];

    let checkDate = sortedDates.includes(today) ? new Date() : sortedDates.includes(yest) ? d : null;
    if (!checkDate) return 0;

    let currentStreak = 0;
    while (true) {
      const ds = checkDate.toISOString().split('T')[0];
      if (sortedDates.includes(ds)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return currentStreak;
  };

  const streak = calculateStreak();

  // 2. Trend chart (week = last 7 days, month = last 30 days)
  const daysCount = timeframe === 'week' ? 7 : 30;
  const now = new Date();
  const chartDays = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (daysCount - 1 - i));
    const ds = d.toISOString().split('T')[0];
    const entry = sortedLogs.find((l) => l.date === ds);
    
    // Bottom day label: strictly only date number (not month) for month timeframe, matching user image
    const dayLabel = timeframe === 'month'
      ? String(d.getDate())
      : `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`;

    const val = currentMetric.getValue(ds, entry);

    return {
      date: ds,
      label: dayLabel,
      value: val,
      hours: entry && entry.studyHours != null ? entry.studyHours : 0,
      hasEntry: !!entry,
      focus: entry?.focusRating || 0,
      pyqs: entry?.pyqsSolved || 0,
    };
  });

  const maxValue = Math.max(currentMetric.defaultMax, ...chartDays.map((d) => d.value));
  const totalPeriodValue = chartDays.reduce((acc, d) => acc + d.value, 0);

  // 3. Habit Completion %
  const totalDaysWithEntries = sortedLogs.length;
  const daysAttendedClass = sortedLogs.filter((l) => l.attendedClass).length;
  const daysRevision = sortedLogs.filter((l) => l.revisionDone).length;
  const daysMockTest = sortedLogs.filter((l) => l.mockTestTaken).length;
  const daysPyqsSolved = sortedLogs.filter((l) => (l.pyqsSolved ?? 0) > 0).length;

  const classPct = totalDaysWithEntries ? Math.round((daysAttendedClass / totalDaysWithEntries) * 100) : 0;
  const revisionPct = totalDaysWithEntries ? Math.round((daysRevision / totalDaysWithEntries) * 100) : 0;
  const mockPct = totalDaysWithEntries ? Math.round((daysMockTest / totalDaysWithEntries) * 100) : 0;
  const pyqPct = totalDaysWithEntries ? Math.round((daysPyqsSolved / totalDaysWithEntries) * 100) : 0;

  const loggedPeriodEntries = chartDays.filter((d) => d.hasEntry && d.focus > 0);
  const periodAvgFocus = loggedPeriodEntries.length 
    ? (loggedPeriodEntries.reduce((acc, d) => acc + d.focus, 0) / loggedPeriodEntries.length).toFixed(1)
    : (sortedLogs.length ? (sortedLogs.reduce((acc, l) => acc + (l.focusRating || 0), 0) / sortedLogs.length).toFixed(1) : '0.0');

  return (
    <div className="w-full flex flex-col space-y-6 animate-fadeIn font-mono text-stone-900 dark:text-[#e9e4da]">
      {/* 1. Header Section */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-orange-950/10 dark:border-white/10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight uppercase font-mono">
            Analysis
          </h1>
        </div>

        {/* Timeframe Toggle (Capsule Bar matching Border Magic theme) */}
        <div className="flex items-center gap-1.5 border-magic-bar p-1.5 rounded-full text-xs">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-4 py-1.5 rounded-full font-bold uppercase transition cursor-pointer ${
              timeframe === 'week'
                ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_15px_rgba(233,118,43,0.35)]'
                : 'text-stone-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-1.5 rounded-full font-bold uppercase transition cursor-pointer ${
              timeframe === 'month'
                ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_15px_rgba(233,118,43,0.35)]'
                : 'text-stone-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics - Minimal Compact Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Streak */}
        <div className="p-3.5 sm:p-4 rounded-xl glass-panel glass-panel-interactive flex flex-col justify-between min-h-[80px]">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-slate-400 font-bold flex items-center gap-1.5 truncate">
            <Flame className="w-3.5 h-3.5 text-[#e9762b] shrink-0" />
            STREAK
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-mono">{streak}</span>
            <span className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">days</span>
          </div>
        </div>

        {/* Card 2: Period Total for Selected Metric */}
        <div className="p-3.5 sm:p-4 rounded-xl glass-panel glass-panel-interactive flex flex-col justify-between min-h-[80px]">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-slate-400 font-bold flex items-center gap-1.5 truncate">
            <TrendingUp className="w-3.5 h-3.5 text-[#e9762b] shrink-0" />
            {timeframe === 'week' ? '7 DAYS' : '30 DAYS'}
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-mono truncate">
              {Number.isInteger(totalPeriodValue) ? totalPeriodValue : totalPeriodValue.toFixed(1)}
            </span>
            <span className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">
              {currentMetric.unit ? currentMetric.unit.trim() : 'total'}
            </span>
          </div>
        </div>

        {/* Card 3: Revision */}
        <div className="p-3.5 sm:p-4 rounded-xl glass-panel glass-panel-interactive flex flex-col justify-between min-h-[80px]">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-stone-600 dark:text-slate-400 font-bold flex items-center gap-1.5 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
            REVISION
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-mono">{revisionPct}%</span>
            <span className="text-[11px] text-stone-500 dark:text-slate-400 font-mono">rate</span>
          </div>
        </div>

        {/* Card 4: Focus */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-[#e9762b] to-[#ff5f00] text-black flex flex-col justify-between min-h-[80px] shadow-[0_6px_20px_rgba(233,118,43,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] border border-white/20 transition-all duration-300 hover:scale-[1.02]">
          <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-black/80 font-extrabold flex items-center gap-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-black shrink-0" />
            FOCUS
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl sm:text-2xl font-black text-black font-mono">{periodAvgFocus}</span>
            <span className="text-[11px] text-black/80 font-mono font-bold">/ 5</span>
          </div>
        </div>
      </div>

      {/* Trend Chart with Two Selectors: Table + Column */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <BarChart2 className="w-4 h-4 text-[#e9762b] shrink-0" />
            <h2 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white tracking-tight uppercase font-mono truncate">
              {currentMetric.label}
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-[#e9762b] border border-orange-500/20 font-bold shrink-0 truncate max-w-[140px]">
              {selectedTableTitle}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Table Selector */}
            <div className="relative flex items-center">
              <span className="text-[10px] font-mono text-stone-500 dark:text-slate-400 font-bold uppercase mr-1 hidden md:inline">
                Table:
              </span>
              <div className="relative">
                <select
                  value={selectedTableId}
                  onChange={(e) => handleTableChange(e.target.value)}
                  className="text-xs font-mono font-bold appearance-none bg-stone-100 dark:bg-[#181817] border border-stone-300 dark:border-white/10 text-stone-900 dark:text-white pl-2.5 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-[#e9762b] cursor-pointer transition shadow-sm max-w-[130px] sm:max-w-[160px] truncate"
                  aria-label="Select table to analyze"
                >
                  {availableTables.map((t) => (
                    <option key={t.id} value={t.id} className="text-stone-900 dark:text-white bg-white dark:bg-[#1c1c1b]">
                      {t.title.length > 20 ? t.title.slice(0, 18) + '…' : t.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#e9762b] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
              </div>
            </div>

            {/* Column Selector */}
            <div className="relative flex items-center">
              <span className="text-[10px] font-mono text-stone-500 dark:text-slate-400 font-bold uppercase mr-1 hidden md:inline">
                Column:
              </span>
              <div className="relative">
                <select
                  value={selectedColumnId}
                  onChange={(e) => setSelectedColumnId(e.target.value)}
                  disabled={availableColumns.length === 0}
                  className="text-xs font-mono font-bold appearance-none bg-stone-100 dark:bg-[#181817] border border-stone-300 dark:border-white/10 text-stone-900 dark:text-white pl-2.5 pr-7 py-1.5 rounded-lg focus:outline-none focus:border-[#e9762b] cursor-pointer transition shadow-sm max-w-[130px] sm:max-w-[160px] truncate disabled:opacity-50"
                  aria-label="Select column to analyze"
                >
                  {availableColumns.map((c) => (
                    <option key={c.id} value={c.id} className="text-stone-900 dark:text-white bg-white dark:bg-[#1c1c1b]">
                      {c.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#e9762b] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
              </div>
            </div>

            <span className="text-xs font-mono text-stone-500 dark:text-slate-400 font-bold hidden lg:inline ml-1">
              {timeframe === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
            </span>
          </div>
        </div>

        {/* Bar Visualizer with Horizontal Scroll Container */}
        <div className="w-full overflow-x-auto custom-scrollbar pb-2 sm:pb-3">
          <div className={`h-64 sm:h-76 flex items-end pt-16 sm:pt-20 pb-4 sm:pb-5 border-b border-orange-950/10 dark:border-white/10 ${
            timeframe === 'month' ? 'min-w-[680px] sm:min-w-0 gap-1 sm:gap-1.5' : 'w-full gap-2 sm:gap-3.5'
          }`}>
            {chartDays.map((d, idx) => {
              const heightPercent = Math.min(100, Math.round((d.value / maxValue) * 100));
              const tooltipAlign = idx < 2 ? 'left-0' : idx > chartDays.length - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2';

              return (
                <div 
                  key={idx} 
                  className="flex-1 min-w-0 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                >
                  {/* Tooltip on hover — Safe inside container, edge-aware, high-contrast */}
                  <div 
                    style={{ color: '#ffffff', backgroundColor: '#141413' }}
                    className={`opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 absolute -top-13 sm:-top-14 z-30 border border-orange-950/30 dark:border-white/20 text-xs px-3 py-1.5 rounded-xl shadow-2xl whitespace-nowrap font-mono ${tooltipAlign}`}
                  >
                    <div className="font-extrabold text-[#e9762b] text-[11px] leading-tight">{d.date}</div>
                    <div className="text-white text-[11px] font-semibold mt-0.5 flex items-center gap-1.5" style={{ color: '#ffffff' }}>
                      <span className="text-[#e9762b] font-bold">
                        {currentMetric.label}: {Number.isInteger(d.value) ? d.value : d.value.toFixed(1)}{currentMetric.unit}
                      </span>
                      {currentMetric.id !== 'studyHours' && d.hours > 0 && (
                        <>
                          <span className="text-stone-400">·</span>
                          <span className="text-stone-300">{d.hours}h</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Number above bar */}
                  <span className="text-[10px] sm:text-xs font-bold text-stone-700 dark:text-slate-400 mb-1 group-hover:text-black dark:group-hover:text-white transition font-mono whitespace-nowrap select-none">
                    {d.value > 0 ? `${Number.isInteger(d.value) ? d.value : d.value.toFixed(1)}${currentMetric.unit}` : ''}
                  </span>

                  {/* The Bar */}
                  <div 
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      d.value > 0 
                        ? 'bg-gradient-to-t from-[#e9762b]/80 to-[#e9762b] group-hover:from-[#e9762b] group-hover:to-orange-400 shadow-md' 
                        : 'bg-orange-950/5 dark:bg-white/5 h-2'
                    }`}
                    style={{ height: d.value > 0 ? `${Math.max(6, heightPercent)}%` : '8px' }}
                  />

                  {/* Day label below */}
                  <span className="text-[9px] sm:text-[11px] text-stone-600 dark:text-slate-400 mt-2 font-mono truncate w-full text-center font-semibold leading-tight pb-0.5 select-none">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Habit Completion Grid — Circular Radial Arcs matching Image 3 style */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-extrabold text-stone-900 dark:text-white tracking-tight uppercase font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          Habits
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              id: 'pyqs',
              label: 'PYQs',
              pct: pyqPct,
              days: daysPyqsSolved,
              color: '#e9762b', // Focus Orange
              glow: 'rgba(233, 118, 43, 0.25)',
            },
            {
              id: 'revision',
              label: 'Revision',
              pct: revisionPct,
              days: daysRevision,
              color: '#10b981', // Emerald Green
              glow: 'rgba(16, 185, 129, 0.25)',
            },
            {
              id: 'class',
              label: 'Class',
              pct: classPct,
              days: daysAttendedClass,
              color: '#3b82f6', // Vibrant Blue
              glow: 'rgba(59, 130, 246, 0.25)',
            },
            {
              id: 'mocks',
              label: 'Mock Tests',
              pct: mockPct,
              days: daysMockTest,
              color: '#a855f7', // Purple / Magenta (matching Image 3)
              glow: 'rgba(168, 85, 247, 0.25)',
            },
          ].map((habit) => {
            const radius = 38;
            const strokeWidth = 10;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, habit.pct))) / 100;

            return (
              <div
                key={habit.id}
                className="glass-panel glass-panel-interactive rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between text-center relative overflow-hidden group shadow-lg"
              >
                {/* Header label */}
                <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
                  <span className="uppercase font-bold tracking-wider text-[11px] sm:text-xs text-stone-600 dark:text-slate-400 group-hover:text-stone-900 dark:group-hover:text-white transition-colors">
                    {habit.label}
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-slate-500 font-mono">
                    {habit.days}/{totalDaysWithEntries}d
                  </span>
                </div>

                {/* Circular Radial Arc Gauge matching Image 3 style */}
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center my-1">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth={strokeWidth}
                      fill="none"
                      className="text-stone-300/40 dark:text-white/10"
                    />
                    {/* Active Progress Arc */}
                    <circle
                      cx="50"
                      cy="50"
                      r={radius}
                      stroke={habit.color}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      fill="none"
                      style={{
                        filter: `drop-shadow(0 0 6px ${habit.glow})`,
                        transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </svg>

                  {/* Percentage in Center */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                    <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-white font-mono tracking-tight slashed-zero-num">
                      {habit.pct}%
                    </span>
                  </div>
                </div>

                {/* Completion status tag */}
                <div className="mt-2 text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase">
                  {habit.pct >= 80 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Excellent</span>
                  ) : habit.pct >= 50 ? (
                    <span className="text-[#e9762b]">On Track</span>
                  ) : (
                    <span className="text-stone-400 dark:text-slate-500">Needs Focus</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
