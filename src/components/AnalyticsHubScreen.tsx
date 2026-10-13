import React, { useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { translations } from '../i18n/translations';
import { StudySession } from '../types';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  Sun, 
  Sunset, 
  Moon, 
  AlertTriangle, 
  Download, 
  Sparkles, 
  Star, 
  TrendingUp, 
  BookOpen, 
  X,
  Printer
} from 'lucide-react';

interface DaySessionModalData {
  dateStr: string;
  sessions: StudySession[];
}

export const AnalyticsHubScreen: React.FC = () => {
  const { language, sessions, subjects, user, setActiveSubject, startTimer } = useStudyStore();
  const t = translations[language];

  // Filters: '7d' | '30d' | 'all'
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | 'all'>('30d');

  // Heatmap day details modal
  const [dayDetails, setDayDetails] = useState<DaySessionModalData | null>(null);

  // Summary Export modal
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter sessions by date filter
  const now = new Date();
  const filteredSessions = sessions.filter((s) => {
    if (dateFilter === 'all') return true;
    const sessionDate = new Date(s.timestamp);
    const daysDiff = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
    if (dateFilter === '7d') return daysDiff <= 7;
    if (dateFilter === '30d') return daysDiff <= 30;
    return true;
  });

  // Total Focus Minutes
  const totalMinutes = filteredSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Average Focus Rating
  const avgRating = filteredSessions.length > 0
    ? (filteredSessions.reduce((acc, s) => acc + s.focusRating, 0) / filteredSessions.length).toFixed(1)
    : '5.0';

  // Subject Time Breakdown
  const subjectTimeMap: Record<string, number> = {};
  filteredSessions.forEach((s) => {
    subjectTimeMap[s.subjectId] = (subjectTimeMap[s.subjectId] || 0) + s.durationMinutes;
  });

  const subjectStats = subjects.map((subj) => {
    const mins = subjectTimeMap[subj.id] || 0;
    const pct = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;
    return {
      ...subj,
      minutes: mins,
      hours: (mins / 60).toFixed(1),
      percentage: pct,
    };
  }).sort((a, b) => b.minutes - a.minutes);

  // Peak Productivity Hours Breakdown
  // Morning: 5 - 12 (7 hours)
  // Afternoon: 12 - 18 (6 hours)
  // Night: 18 - 4 (10 hours)
  let morningMins = 0;
  let afternoonMins = 0;
  let nightMins = 0;

  filteredSessions.forEach((s) => {
    const hr = s.hour;
    if (hr >= 5 && hr < 12) {
      morningMins += s.durationMinutes;
    } else if (hr >= 12 && hr < 18) {
      afternoonMins += s.durationMinutes;
    } else {
      nightMins += s.durationMinutes;
    }
  });

  const peakTotal = morningMins + afternoonMins + nightMins || 1;
  const morningPct = Math.round((morningMins / peakTotal) * 100);
  const afternoonPct = Math.round((afternoonMins / peakTotal) * 100);
  const nightPct = Math.round((nightMins / peakTotal) * 100);

  // Weekly comparative trends (Last 7 days vs Previous 7 days)
  const last7DaysMins = sessions
    .filter((s) => {
      const daysAgo = (now.getTime() - new Date(s.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    })
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const prev7DaysMins = sessions
    .filter((s) => {
      const daysAgo = (now.getTime() - new Date(s.timestamp).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo > 7 && daysAgo <= 14;
    })
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  const weeklyTrendPct = prev7DaysMins > 0 
    ? Math.round(((last7DaysMins - prev7DaysMins) / prev7DaysMins) * 100) 
    : 100;

  // Neglected Subject Alert
  const neglectedList: { subject: typeof subjects[0]; daysSince: number }[] = [];
  subjects.forEach((subj) => {
    const subjSessions = sessions.filter((s) => s.subjectId === subj.id);
    if (subjSessions.length === 0) {
      neglectedList.push({ subject: subj, daysSince: 5 });
    } else {
      const latest = subjSessions.reduce((max, cur) => 
        new Date(cur.timestamp) > new Date(max.timestamp) ? cur : max
      );
      const diffMs = Date.now() - new Date(latest.timestamp).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 3) {
        neglectedList.push({ subject: subj, daysSince: diffDays });
      }
    }
  });

  // ========================================================
  // 365-DAY GITHUB-STYLE HEATMAP GENERATION
  // 52 weeks x 7 days grid
  // ========================================================
  const sessionMinutesByDate: Record<string, number> = {};
  sessions.forEach((s) => {
    sessionMinutesByDate[s.dateString] = (sessionMinutesByDate[s.dateString] || 0) + s.durationMinutes;
  });

  // Build array of last 364 days (52 weeks * 7)
  const heatmapDays: { dateStr: string; minutes: number; dayOfWeek: number }[] = [];
  const startDay = new Date(now);
  startDay.setDate(startDay.getDate() - (52 * 7 - 1));

  for (let i = 0; i < 52 * 7; i++) {
    const curDate = new Date(startDay);
    curDate.setDate(curDate.getDate() + i);
    const dateStr = curDate.toISOString().split('T')[0];
    heatmapDays.push({
      dateStr,
      minutes: sessionMinutesByDate[dateStr] || 0,
      dayOfWeek: curDate.getDay(),
    });
  }

  // Helper for heatmap cell color
  const getCellColor = (minutes: number) => {
    if (minutes === 0) return 'bg-slate-900 border-white/5';
    if (minutes < 60) return 'bg-indigo-950/80 border-indigo-800/40';
    if (minutes < 120) return 'bg-indigo-700/90 border-indigo-500/50';
    if (minutes < 240) return 'bg-indigo-500 border-indigo-400';
    return 'bg-cyan-400 border-cyan-300'; // > 4 hours high productivity
  };

  // Group into columns of 7 days
  const heatmapWeeks: (typeof heatmapDays)[] = [];
  for (let w = 0; w < 52; w++) {
    heatmapWeeks.push(heatmapDays.slice(w * 7, (w + 1) * 7));
  }

  // Handle cell tap
  const handleCellClick = (dateStr: string) => {
    const daysSessions = sessions.filter((s) => s.dateString === dateStr);
    setDayDetails({ dateStr, sessions: daysSessions });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fadeIn">
      {/* ======================================================== */}
      {/* 1. ANALYTICS HEADER & CONTROLS                           */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.analyticsHub.title}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {t.analyticsHub.subtitle}
          </h1>
          <p className="text-xs text-slate-400">
            {totalHours} {t.common.hours} analyzed • {avgRating}/5.0 {t.analyticsHub.avgFocusQuality}
          </p>
        </div>

        {/* Filter Pills & Export Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Pills */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-white/10 shadow-inner">
            {(['7d', '30d', 'all'] as const).map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setDateFilter(filterKey)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  dateFilter === filterKey
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filterKey === '7d' ? t.analyticsHub.filter7D : filterKey === '30d' ? t.analyticsHub.filter30D : t.analyticsHub.filterAllTime}
              </button>
            ))}
          </div>

          {/* Export Report Card Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.analyticsHub.exportSummary}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. NEGLECTED SUBJECT WARNING (if any)                     */}
      {/* ======================================================== */}
      {neglectedList.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Study Distribution Alert
              </p>
              <p className="text-sm font-semibold text-amber-100">
                {t.analyticsHub.neglectedAlert(neglectedList[0].subject.name, neglectedList[0].daysSince)}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveSubject(neglectedList[0].subject.id);
              startTimer();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition"
          >
            {t.analyticsHub.studyNow}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. 365-DAY GITHUB-STYLE ACTIVITY HEATMAP                  */}
      {/* ======================================================== */}
      <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>{t.analyticsHub.heatmapTitle}</span>
            </h2>
            <p className="text-xs text-slate-400">
              {t.analyticsHub.heatmapSubtitle}
            </p>
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded bg-slate-900 border border-white/5" />
            <div className="w-2.5 h-2.5 rounded bg-indigo-950/80 border border-indigo-800/40" />
            <div className="w-2.5 h-2.5 rounded bg-indigo-700/90 border border-indigo-500/50" />
            <div className="w-2.5 h-2.5 rounded bg-indigo-500 border border-indigo-400" />
            <div className="w-2.5 h-2.5 rounded bg-cyan-400 border border-cyan-300" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid (Horizontal Scrollable on mobile) */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-1.5 min-w-[780px]">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day) => {
                  const hrs = (day.minutes / 60).toFixed(1);
                  return (
                    <button
                      key={day.dateStr}
                      onClick={() => handleCellClick(day.dateStr)}
                      className={`w-3.5 h-3.5 rounded-sm border heatmap-cell cursor-pointer ${getCellColor(day.minutes)}`}
                      title={`${day.dateStr}: ${hrs} hours (${day.minutes} mins)`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. SUBJECT TIME DISTRIBUTION (DONUT / BARS)              */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Time Distribution Bars */}
        <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>{t.analyticsHub.timeDistribution}</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono-numbers">
              {totalHours}h Total
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {subjectStats.map((subj) => (
              <div key={subj.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subj.color }} />
                    {subj.name}
                  </span>
                  <span className="font-mono-numbers text-slate-400">
                    <span className="text-white font-bold">{subj.hours}h</span> ({subj.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${subj.percentage}%`, backgroundColor: subj.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Productivity Hours (Morning / Afternoon / Night) */}
        <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{t.analyticsHub.peakHoursTitle}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Circadian rhythm & temporal focus split
            </p>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {/* Morning */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-center space-y-1">
                <Sun className="w-5 h-5 text-amber-400 mx-auto" />
                <div className="text-lg font-mono-numbers font-extrabold text-white">
                  {morningPct}%
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Morning
                </div>
                <div className="text-[11px] text-slate-500 font-mono-numbers">
                  {(morningMins / 60).toFixed(1)}h
                </div>
              </div>

              {/* Afternoon */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-center space-y-1">
                <Sunset className="w-5 h-5 text-orange-400 mx-auto" />
                <div className="text-lg font-mono-numbers font-extrabold text-white">
                  {afternoonPct}%
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Afternoon
                </div>
                <div className="text-[11px] text-slate-500 font-mono-numbers">
                  {(afternoonMins / 60).toFixed(1)}h
                </div>
              </div>

              {/* Night */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/5 text-center space-y-1">
                <Moon className="w-5 h-5 text-indigo-400 mx-auto" />
                <div className="text-lg font-mono-numbers font-extrabold text-white">
                  {nightPct}%
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Night
                </div>
                <div className="text-[11px] text-slate-500 font-mono-numbers">
                  {(nightMins / 60).toFixed(1)}h
                </div>
              </div>
            </div>
          </div>

          {/* Weekly vs Monthly Trends Card */}
          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">Weekly Pace Trend: </span>
              <span className={`font-bold font-mono-numbers ${weeklyTrendPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {weeklyTrendPct >= 0 ? `+${weeklyTrendPct}%` : `${weeklyTrendPct}%`} vs prev week
              </span>
            </div>
            <span className="text-slate-400 font-mono-numbers">
              {(last7DaysMins / 7 / 60).toFixed(1)}h / day
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. DAY DETAILS POPUP MODAL (ON CLICKING ANY HEATMAP CELL) */}
      {/* ======================================================== */}
      {dayDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl p-6 bg-[#0c0c0b] border border-indigo-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">
                  {t.analyticsHub.sessionsOnDay} {dayDetails.dateStr}
                </h3>
              </div>
              <button
                onClick={() => setDayDetails(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {dayDetails.sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                {t.analyticsHub.noSessionsDay}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {dayDetails.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-white/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-white font-bold">{sess.subjectName}</span>
                      <span className="text-cyan-300 font-mono-numbers">{sess.durationMinutes} mins</span>
                    </div>
                    {sess.chapterTitle && (
                      <p className="text-[11px] text-slate-400">
                        {sess.chapterTitle}
                      </p>
                    )}
                    {sess.notes && (
                      <p className="text-[11px] text-slate-300 italic bg-white/[0.02] p-2 rounded-lg border border-white/5">
                        "{sess.notes}"
                      </p>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>Time: {new Date(sess.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400" />
                        <span>{sess.focusRating}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setDayDetails(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. ONE-CLICK STUDY SUMMARY EXPORT MODAL                  */}
      {/* ======================================================== */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl p-6 sm:p-8 bg-[#0c0c0b] border border-cyan-500/30 shadow-2xl space-y-6">
            {/* Report Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-extrabold text-white">
                    Studyo Official Analytics Card
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified Performance Summary for {user.name} • {new Date().toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="space-y-4 p-5 rounded-2xl bg-slate-900/90 border border-white/5 font-mono text-xs">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <span className="text-slate-400">STUDENT PROFILE</span>
                <span className="text-white font-bold">{user.name} ({user.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ACTIVE STREAK</span>
                <span className="text-amber-400 font-bold">{user.streakDays} Consecutive Days 🔥</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TOTAL RECORDED FOCUS</span>
                <span className="text-cyan-300 font-bold">{totalHours} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">AVERAGE FOCUS QUALITY</span>
                <span className="text-emerald-400 font-bold">{avgRating} / 5.0 Rating</span>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  TOP SUBJECT BREAKDOWN:
                </span>
                {subjectStats.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex justify-between text-[11px]">
                    <span className="text-slate-300">{s.name}</span>
                    <span className="text-white">{s.hours}h ({s.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Print / Download Trigger Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                {t.common.close}
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg transition"
              >
                <Printer className="w-4 h-4" />
                <span>{t.analyticsHub.exportPdf}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
