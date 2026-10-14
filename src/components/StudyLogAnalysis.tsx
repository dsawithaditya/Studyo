import React, { useState, useMemo } from 'react';
import { useStudyStore, INITIAL_DAILY_LOGS } from '../store/useStudyStore';
import { 
  TrendingUp, 
  Flame, 
  Calendar, 
  CheckCircle2, 
  Award, 
  BarChart2, 
  Brain, 
  Moon, 
  BookOpen, 
  GraduationCap, 
  FileCheck2,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export const StudyLogAnalysis: React.FC = () => {
  const { dailyLogs: rawLogs } = useStudyStore();
  const dailyLogs = useMemo(
    () => (Array.isArray(rawLogs) && rawLogs.length > 0 ? rawLogs : INITIAL_DAILY_LOGS),
    [rawLogs]
  );
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  // Sort logs ascending by date for chronological trend calculations
  const sortedLogs = useMemo(() => [...dailyLogs].sort((a, b) => a.date.localeCompare(b.date)), [dailyLogs]);

  // 1. Consistency streak calculation (consecutive days logged without gaps up to latest/today)
  const calculateStreak = () => {
    if (sortedLogs.length === 0) return 0;
    const uniqueDates = Array.from(new Set(sortedLogs.map((l) => l.date))).sort();
    let currentStreak = 1;
    let maxStreak = 1;

    for (let i = uniqueDates.length - 1; i > 0; i--) {
      const curr = new Date(uniqueDates[i]);
      const prev = new Date(uniqueDates[i - 1]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  };

  const streak = calculateStreak();

  // 2. Study hours trend chart (week = last 7 days, month = last 30 days)
  const daysCount = timeframe === 'week' ? 7 : 30;
  const now = new Date();
  const chartDays = Array.from({ length: daysCount }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (daysCount - 1 - i));
    const ds = d.toISOString().split('T')[0];
    const entry = sortedLogs.find((l) => l.date === ds);
    const dayLabel = d.toLocaleDateString('en-US', { 
      weekday: timeframe === 'week' ? 'short' : undefined,
      month: 'numeric',
      day: 'numeric' 
    });
    return {
      date: ds,
      label: dayLabel,
      hours: entry ? entry.studyHours : 0,
      hasEntry: !!entry,
      focus: entry?.focusRating || 0,
      pyqs: entry?.pyqsSolved || 0,
    };
  });

  const maxHours = Math.max(8, ...chartDays.map((d) => d.hours));
  const totalPeriodHours = chartDays.reduce((acc, d) => acc + d.hours, 0);
  const avgPeriodHours = (totalPeriodHours / daysCount).toFixed(1);

  // 3. Habit Completion %
  const totalDaysWithEntries = sortedLogs.length;
  const daysAttendedClass = sortedLogs.filter((l) => l.attendedClass).length;
  const daysRevision = sortedLogs.filter((l) => l.revisionDone).length;
  const daysMockTest = sortedLogs.filter((l) => l.mockTestTaken).length;
  const daysPyqsSolved = sortedLogs.filter((l) => l.pyqsSolved > 0).length;
  const totalPyqs = sortedLogs.reduce((acc, l) => acc + (l.pyqsSolved || 0), 0);

  const classPct = totalDaysWithEntries ? Math.round((daysAttendedClass / totalDaysWithEntries) * 100) : 0;
  const revisionPct = totalDaysWithEntries ? Math.round((daysRevision / totalDaysWithEntries) * 100) : 0;
  const mockPct = totalDaysWithEntries ? Math.round((daysMockTest / totalDaysWithEntries) * 100) : 0;
  const pyqPct = totalDaysWithEntries ? Math.round((daysPyqsSolved / totalDaysWithEntries) * 100) : 0;

  // 4. Correlation Callouts (average study hours on class days vs non-class days, sleep vs focus)
  const classDaysLogs = sortedLogs.filter((l) => l.attendedClass);
  const nonClassDaysLogs = sortedLogs.filter((l) => !l.attendedClass);

  const avgClassHours = classDaysLogs.length 
    ? (classDaysLogs.reduce((acc, l) => acc + l.studyHours, 0) / classDaysLogs.length).toFixed(1)
    : '0.0';
  const avgNonClassHours = nonClassDaysLogs.length 
    ? (nonClassDaysLogs.reduce((acc, l) => acc + l.studyHours, 0) / nonClassDaysLogs.length).toFixed(1)
    : '0.0';

  // Sleep vs Focus correlation
  const highFocusLogs = sortedLogs.filter((l) => l.focusRating >= 4);
  const avgSleepHighFocus = highFocusLogs.length
    ? (highFocusLogs.reduce((acc, l) => acc + l.sleepHours, 0) / highFocusLogs.length).toFixed(1)
    : '7.0';

  // 5. Weekly summary recap (last 7 days aggregate)
  const last7Logs = sortedLogs.slice(-7);
  const last7Hours = last7Logs.reduce((acc, l) => acc + l.studyHours, 0);
  const last7Pyqs = last7Logs.reduce((acc, l) => acc + l.pyqsSolved, 0);
  const last7AvgFocus = last7Logs.length 
    ? (last7Logs.reduce((acc, l) => acc + l.focusRating, 0) / last7Logs.length).toFixed(1)
    : '0.0';
  const last7RevisionDays = last7Logs.filter((l) => l.revisionDone).length;

  return (
    <div className="w-full flex flex-col space-y-8 animate-fadeIn font-mono text-[#e9e4da]">
      {/* 1. Header Section */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-[#e9762b] font-bold block mb-1">
            STUDY TRACKER
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight uppercase font-mono">
            Log Analysis
          </h1>
        </div>

        {/* Timeframe Toggle on right side of header */}
        <div className="flex items-center gap-1.5 glass-panel p-1.5 rounded-xl text-xs">
          <button
            onClick={() => setTimeframe('week')}
            className={`px-3.5 py-1.5 rounded-lg font-bold uppercase transition ${
              timeframe === 'week'
                ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_15px_rgba(233,118,43,0.35)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-3.5 py-1.5 rounded-lg font-bold uppercase transition ${
              timeframe === 'month'
                ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_15px_rgba(233,118,43,0.35)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Past 30 Days
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Consistency Streak */}
        <div className="p-5 sm:p-6 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-h-[135px]">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#e9762b]" />
            CURRENT STREAK
          </span>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">{streak}</span>
            <span className="text-xs sm:text-sm text-slate-400 font-mono font-medium">days</span>
          </div>
        </div>

        {/* Avg Hours / Day */}
        <div className="p-5 sm:p-6 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-h-[135px]">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#e9762b]" />
            AVG HOURS
          </span>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">{avgPeriodHours}</span>
            <span className="text-xs sm:text-sm text-slate-400 font-mono font-medium">hrs/day</span>
          </div>
        </div>

        {/* Total PYQs */}
        <div className="p-5 sm:p-6 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between min-h-[135px]">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#e9762b]" />
            TOTAL PYQS
          </span>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-white font-mono">{totalPyqs}</span>
            <span className="text-xs sm:text-sm text-slate-400 font-mono font-medium">solved</span>
          </div>
        </div>

        {/* Avg Focus Rating (Highlight Orange Glass Card) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#e9762b] to-[#ff5f00] text-black flex flex-col justify-between min-h-[135px] shadow-[0_10px_30px_rgba(233,118,43,0.35),inset_0_1px_0_rgba(255,255,255,0.4)] border border-white/20 transition-all duration-300 hover:scale-[1.02]">
          <span className="text-xs font-mono uppercase tracking-widest text-black/80 font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-black" />
            AVG. FOCUS
          </span>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl sm:text-4xl font-black text-black font-mono">{last7AvgFocus}</span>
            <span className="text-xs sm:text-sm text-black/80 font-mono font-bold">/ 5</span>
          </div>
        </div>
      </div>

      {/* Study Hours Trend Chart */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase font-mono flex items-center gap-2.5">
              <BarChart2 className="w-5 h-5 text-[#e9762b]" />
              Study Hours Trend
            </h2>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="h-64 sm:h-80 flex items-end gap-2 sm:gap-3.5 pt-10 pb-5 border-b border-white/10">
          {chartDays.map((d, idx) => {
            const heightPercent = Math.min(100, Math.round((d.hours / maxHours) * 100));
            return (
              <div 
                key={idx} 
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute -top-14 z-20 bg-[#242422] border border-white/20 text-white text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-2xl whitespace-nowrap">
                  <div className="font-bold text-[#e9762b]">{d.date}</div>
                  <div>{d.hours} hrs · {d.pyqs} PYQs · Focus {d.focus || '-'}/5</div>
                </div>

                {/* Number above bar */}
                <span className="text-xs sm:text-sm font-bold text-slate-400 mb-1.5 group-hover:text-white transition font-mono">
                  {d.hours > 0 ? `${d.hours}h` : ''}
                </span>

                {/* The Bar */}
                <div 
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    d.hours > 0 
                      ? 'bg-gradient-to-t from-[#e9762b]/80 to-[#e9762b] group-hover:from-[#e9762b] group-hover:to-orange-400 shadow-md' 
                      : 'bg-white/5 h-2'
                  }`}
                  style={{ height: d.hours > 0 ? `${Math.max(6, heightPercent)}%` : '8px' }}
                />

                {/* Day label below */}
                <span className="text-xs sm:text-sm text-slate-400 mt-2.5 font-mono truncate w-full text-center font-semibold">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit Completion % Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase font-mono flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
            Habit Completion Rate
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* PYQ Practice */}
          <div className="glass-panel glass-panel-interactive rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300 font-mono">
              <span className="uppercase font-bold tracking-wider">PYQ Practice</span>
              <span className="text-white font-black text-lg sm:text-xl">{pyqPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#e9762b] rounded-full transition-all duration-500 shadow-sm" 
                style={{ width: `${pyqPct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 block font-mono">
              PYQs solved on {daysPyqsSolved} of {totalDaysWithEntries} logged days
            </span>
          </div>

          {/* Revision */}
          <div className="glass-panel glass-panel-interactive rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300 font-mono">
              <span className="uppercase font-bold tracking-wider">Revision Done</span>
              <span className="text-white font-black text-lg sm:text-xl">{revisionPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#10b981] rounded-full transition-all duration-500 shadow-sm" 
                style={{ width: `${revisionPct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 block font-mono">
              Revision on {daysRevision} of {totalDaysWithEntries} logged days
            </span>
          </div>

          {/* Class Attendance */}
          <div className="glass-panel glass-panel-interactive rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300 font-mono">
              <span className="uppercase font-bold tracking-wider">Class Attended</span>
              <span className="text-white font-black text-lg sm:text-xl">{classPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500 shadow-sm" 
                style={{ width: `${classPct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 block font-mono">
              Attended class on {daysAttendedClass} of {totalDaysWithEntries} days
            </span>
          </div>

          {/* Mock Tests */}
          <div className="glass-panel glass-panel-interactive rounded-2xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-300 font-mono">
              <span className="uppercase font-bold tracking-wider">Mock Tests</span>
              <span className="text-white font-black text-lg sm:text-xl">{mockPct}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500 shadow-sm" 
                style={{ width: `${mockPct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400 block font-mono">
              Mock tests on {daysMockTest} of {totalDaysWithEntries} days
            </span>
          </div>
        </div>
      </div>

      {/* Correlation Callouts & Weekly Summary Recap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Correlation Callouts */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase font-mono flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-[#e9762b]" />
            Correlation Callouts
          </h2>

          <div className="space-y-3">
            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10 text-[#e9762b] mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-white uppercase block font-mono">
                  Class Days vs. Self-Study Days
                </span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed font-mono">
                  You average <span className="text-white font-bold">{avgClassHours}h</span> on class days vs <span className="text-[#e9762b] font-bold">{avgNonClassHours}h</span> on days without classes.
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-bold text-white uppercase block font-mono">
                  Sleep & High Focus Correlation
                </span>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed font-mono">
                  On days with top focus (4–5 stars), you averaged <span className="text-white font-bold">{avgSleepHighFocus} hours</span> of sleep.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Summary Recap */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight uppercase font-mono mb-4 flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-[#10b981]" />
              Weekly Summary Recap
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm mb-3">
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5">
                <span className="text-slate-400 uppercase tracking-wider block text-xs font-bold font-mono">
                  7-Day Study Total
                </span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1 block font-mono">
                  {last7Hours} hrs
                </span>
              </div>
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5">
                <span className="text-slate-400 uppercase tracking-wider block text-xs font-bold font-mono">
                  PYQs Solved
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#e9762b] mt-1 block font-mono">
                  {last7Pyqs}
                </span>
              </div>
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5">
                <span className="text-slate-400 uppercase tracking-wider block text-xs font-bold font-mono">
                  Revision Days
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#10b981] mt-1 block font-mono">
                  {last7RevisionDays} / 7
                </span>
              </div>
              <div className="bg-black/40 p-3.5 rounded-xl border border-white/5">
                <span className="text-slate-400 uppercase tracking-wider block text-xs font-bold font-mono">
                  Avg Daily Focus
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 mt-1 block font-mono">
                  {last7AvgFocus} / 5
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
