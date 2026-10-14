import React, { useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
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
  const { dailyLogs } = useStudyStore();
  const [timeframe, setTimeframe] = useState<'week' | 'month'>('week');

  // Sort logs ascending by date for chronological trend calculations
  const sortedLogs = [...dailyLogs].sort((a, b) => a.date.localeCompare(b.date));

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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 font-mono text-[#e9e4da]">
      {/* Top Section Header */}
      <div className="mb-8">
        <span className="text-xs uppercase tracking-widest text-[#e9762b] font-bold block mb-1">
          STUDY TRACKER
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
          Log Analysis
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Analytical trends, habit completion, and predictive correlations derived exclusively from your Daily Study Log.
        </p>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {/* Consistency Streak */}
        <div className="bg-[#141413] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <Flame className="w-4 h-4 text-[#e9762b]" />
            Streak
          </span>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-white">
              {streak} <span className="text-sm font-normal text-slate-400">days</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Consecutive days logged
            </span>
          </div>
        </div>

        {/* Avg Hours / Day */}
        <div className="bg-[#141413] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <TrendingUp className="w-4 h-4 text-[#e9762b]" />
            Avg Hours
          </span>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-white">
              {avgPeriodHours} <span className="text-sm font-normal text-slate-400">hrs/day</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Over last {daysCount} days
            </span>
          </div>
        </div>

        {/* Total PYQs */}
        <div className="bg-[#141413] border border-white/10 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
            <BookOpen className="w-4 h-4 text-[#e9762b]" />
            Total PYQs
          </span>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black text-white">
              {totalPyqs} <span className="text-sm font-normal text-slate-400">solved</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Across all logged days
            </span>
          </div>
        </div>

        {/* Avg Focus Rating (Highlight Orange) */}
        <div className="bg-[#e9762b] text-black border border-orange-400/30 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-lg shadow-orange-500/20">
          <span className="text-[11px] sm:text-xs uppercase tracking-widest font-extrabold flex items-center gap-1.5 text-black/80">
            <Sparkles className="w-4 h-4 text-black" />
            Avg Focus
          </span>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-black">
              {last7AvgFocus} <span className="text-sm font-bold text-black/70">/ 5</span>
            </div>
            <span className="text-[11px] font-semibold text-black/70 block mt-1">
              Self-rated concentration
            </span>
          </div>
        </div>
      </div>

      {/* Study Hours Trend Chart */}
      <div className="bg-[#141413] border border-white/10 rounded-xl p-5 sm:p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#e9762b]" />
              Study Hours Trend
            </h2>
            <span className="text-xs text-slate-400 block mt-0.5">
              Daily study distribution over the selected period
            </span>
          </div>

          {/* Timeframe Toggle */}
          <div className="flex items-center gap-1 bg-[#1e1e1d] p-1 rounded-lg border border-white/10 text-xs">
            <button
              onClick={() => setTimeframe('week')}
              className={`px-3 py-1.5 rounded-md font-bold uppercase transition ${
                timeframe === 'week'
                  ? 'bg-[#e9762b] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-md font-bold uppercase transition ${
                timeframe === 'month'
                  ? 'bg-[#e9762b] text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Past 30 Days
            </button>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="h-48 sm:h-56 flex items-end gap-1.5 sm:gap-2.5 pt-8 pb-4 border-b border-white/10">
          {chartDays.map((d, idx) => {
            const heightPercent = Math.min(100, Math.round((d.hours / maxHours) * 100));
            return (
              <div 
                key={idx} 
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition absolute -top-12 z-20 bg-[#242422] border border-white/20 text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded shadow-xl whitespace-nowrap">
                  <div className="font-bold text-[#e9762b]">{d.date}</div>
                  <div>{d.hours} hrs · {d.pyqs} PYQs · Focus {d.focus || '-'}/5</div>
                </div>

                {/* Number above bar */}
                <span className="text-[10px] text-slate-500 mb-1 group-hover:text-white transition font-mono">
                  {d.hours > 0 ? `${d.hours}h` : ''}
                </span>

                {/* The Bar */}
                <div 
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    d.hours > 0 
                      ? 'bg-gradient-to-t from-[#e9762b]/80 to-[#e9762b] group-hover:from-[#e9762b] group-hover:to-orange-400' 
                      : 'bg-white/5 h-1.5'
                  }`}
                  style={{ height: d.hours > 0 ? `${Math.max(6, heightPercent)}%` : '6px' }}
                />

                {/* Day label below */}
                <span className="text-[9px] sm:text-[10px] text-slate-500 mt-2 truncate w-full text-center">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Habit Completion % Grid */}
      <div className="mb-8">
        <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          Habit Completion Rate
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* PYQ Practice */}
          <div className="bg-[#141413] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase font-bold">PYQ Practice</span>
              <span className="text-white font-bold">{pyqPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-[#e9762b] rounded-full transition-all duration-500" 
                style={{ width: `${pyqPct}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 block">
              PYQs solved on {daysPyqsSolved} of {totalDaysWithEntries} logged days
            </span>
          </div>

          {/* Revision */}
          <div className="bg-[#141413] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase font-bold">Revision Done</span>
              <span className="text-white font-bold">{revisionPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-[#10b981] rounded-full transition-all duration-500" 
                style={{ width: `${revisionPct}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 block">
              Revision on {daysRevision} of {totalDaysWithEntries} logged days
            </span>
          </div>

          {/* Class Attendance */}
          <div className="bg-[#141413] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase font-bold">Class Attended</span>
              <span className="text-white font-bold">{classPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${classPct}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 block">
              Attended class on {daysAttendedClass} of {totalDaysWithEntries} days
            </span>
          </div>

          {/* Mock Tests */}
          <div className="bg-[#141413] border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="uppercase font-bold">Mock Tests</span>
              <span className="text-white font-bold">{mockPct}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                style={{ width: `${mockPct}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500 block">
              Mock tests on {daysMockTest} of {totalDaysWithEntries} days
            </span>
          </div>
        </div>
      </div>

      {/* Correlation Callouts & Weekly Summary Recap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Correlation Callouts */}
        <div className="bg-[#141413] border border-white/10 rounded-xl p-5 sm:p-6">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#e9762b]" />
            Correlation Callouts
          </h2>

          <div className="space-y-4">
            <div className="bg-[#1b1b1a] border border-white/5 rounded-lg p-3.5 flex items-start gap-3">
              <div className="p-2 rounded bg-orange-500/10 text-[#e9762b] mt-0.5">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase block">
                  Class Days vs. Self-Study Days
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  You average <span className="text-white font-bold">{avgClassHours}h</span> on class days vs <span className="text-[#e9762b] font-bold">{avgNonClassHours}h</span> on days without classes.
                </p>
              </div>
            </div>

            <div className="bg-[#1b1b1a] border border-white/5 rounded-lg p-3.5 flex items-start gap-3">
              <div className="p-2 rounded bg-purple-500/10 text-purple-400 mt-0.5">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase block">
                  Sleep & High Focus Correlation
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  On days with top focus (4–5 stars), you averaged <span className="text-white font-bold">{avgSleepHighFocus} hours</span> of sleep.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Summary Recap */}
        <div className="bg-[#141413] border border-white/10 rounded-xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#10b981]" />
              Weekly Summary Recap
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <div className="bg-[#1b1b1a] p-3 rounded-lg border border-white/5">
                <span className="text-slate-500 uppercase tracking-wider block text-[10px]">
                  7-Day Study Total
                </span>
                <span className="text-xl font-bold text-white mt-1 block">
                  {last7Hours} hrs
                </span>
              </div>
              <div className="bg-[#1b1b1a] p-3 rounded-lg border border-white/5">
                <span className="text-slate-500 uppercase tracking-wider block text-[10px]">
                  PYQs Solved
                </span>
                <span className="text-xl font-bold text-[#e9762b] mt-1 block">
                  {last7Pyqs}
                </span>
              </div>
              <div className="bg-[#1b1b1a] p-3 rounded-lg border border-white/5">
                <span className="text-slate-500 uppercase tracking-wider block text-[10px]">
                  Revision Days
                </span>
                <span className="text-xl font-bold text-[#10b981] mt-1 block">
                  {last7RevisionDays} / 7
                </span>
              </div>
              <div className="bg-[#1b1b1a] p-3 rounded-lg border border-white/5">
                <span className="text-slate-500 uppercase tracking-wider block text-[10px]">
                  Avg Daily Focus
                </span>
                <span className="text-xl font-bold text-amber-400 mt-1 block">
                  {last7AvgFocus} / 5
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 border-t border-white/10 pt-3">
            Consistent logging yields accurate insights. Keep checking in daily to sharpen your habits.
          </p>
        </div>
      </div>
    </div>
  );
};
