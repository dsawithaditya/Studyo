import React, { useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { translations } from '../i18n/translations';
import { ScreenTab } from './Navigation';
import {
  Play,
  Flame,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Target,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw
} from 'lucide-react';

interface DashboardScreenProps {
  onNavigate: (tab: ScreenTab) => void;
}

const MOTIVATIONAL_TIPS = {
  en: [
    { quote: "Success doesn't come from what you do occasionally, it comes from what you do consistently.", author: "Marie Forleo" },
    { quote: "Focus on progress, not perfection. One deep work session at a time.", author: "James Clear" },
    { quote: "The secret to getting ahead is getting started.", author: "Mark Twain" },
    { quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  ],
  hinglish: [
    { quote: "Consistent raho, rank apne aap aayegi. Roz ka 4-5 ghanta deep focus game badal dega.", author: "Topper Mindset" },
    { quote: "Agar aaj padhne ka mann nahi hai, bas 10 minute baitho. Momentum khud banta hai.", author: "Focus Strategy" },
    { quote: "Revision hi asli superpower hai. Jo padha hai use pakka karo pehle.", author: "Study Rule" },
  ],
  hi: [
    { quote: "सफलता का रहस्य निरंतर प्रयास में छिपा है। हर दिन अपने लक्ष्य की ओर एक कदम बढ़ाएं।", author: "स्वामी विवेकानंद" },
    { quote: "कठिन परिश्रम का कोई विकल्प नहीं होता। एकाग्रता से अध्ययन ही सबसे बड़ी शक्ति है।", author: "अध्ययन सूत्र" },
    { quote: "जो आज समय का सदुपयोग करता है, कल का समय उसका सम्मान करता है।", author: "चाणक्य नीति" },
  ],
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const {
    language,
    user,
    subjects,
    sessions,
    tasks,
    toggleTask,
    setActiveSubject,
    startTimer
  } = useStudyStore();
  const t = translations[language];

  const [quoteIdx, setQuoteIdx] = useState(0);

  // Quotes for current language
  const quotes = MOTIVATIONAL_TIPS[language] || MOTIVATIONAL_TIPS.en;
  const currentQuote = quotes[quoteIdx % quotes.length];

  // Today's studied duration
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.dateString === todayStr);
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const targetMinutes = user.dailyTargetMinutes || 300;
  const progressPercent = Math.min(100, Math.round((todayMinutes / targetMinutes) * 100));

  // Week calculation (past 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSessions = sessions.filter((s) => new Date(s.timestamp) >= weekAgo);
  const weekMinutes = weekSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  // Overall syllabus completion
  let totalTopics = 0;
  let completedTopics = 0;
  subjects.forEach((subj) => {
    subj.chapters.forEach((chap) => {
      chap.topics.forEach((top) => {
        totalTopics++;
        if (top.status === 'completed') completedTopics++;
      });
    });
  });
  const syllabusPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Last active subject
  const lastActiveSubject = subjects.find((s) => s.id === user.lastActiveSubjectId) || subjects[0];

  // Neglected subject detection (not studied in >= 3 days)
  const neglectedList: { subject: typeof subjects[0]; daysSince: number }[] = [];
  subjects.forEach((subj) => {
    const subjSessions = sessions.filter((s) => s.subjectId === subj.id);
    if (subjSessions.length === 0) {
      neglectedList.push({ subject: subj, daysSince: 5 });
    } else {
      const latestSession = subjSessions.reduce((latest, current) =>
        new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
      );
      const diffMs = Date.now() - new Date(latestSession.timestamp).getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 3) {
        neglectedList.push({ subject: subj, daysSince: diffDays });
      }
    }
  });

  const primaryNeglected = neglectedList[0];

  // Top 3 priority tasks for today
  const pendingTasks = tasks.filter((task) => !task.completed);
  const topPriorityTasks = [...pendingTasks]
    .sort((a, b) => {
      const pMap = { high: 0, med: 1, low: 2 };
      return pMap[a.priority] - pMap[b.priority];
    })
    .slice(0, 3);

  // 1-Click Launch into last active subject
  const handleContinueStudying = (subjectId?: string) => {
    const targetSubjId = subjectId || lastActiveSubject?.id || subjects[0]?.id;
    if (targetSubjId) {
      const subj = subjects.find((s) => s.id === targetSubjId);
      const firstChap = subj?.chapters[0]?.id;
      setActiveSubject(targetSubjId, firstChap);
      startTimer();
      onNavigate('studyRoom');
    }
  };

  // SVG Radial Ring calculation
  const radius = 64;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fadeIn">
      {/* ======================================================== */}
      {/* 1. GREETING BANNER & QUICK LAUNCH HERO                   */}
      {/* ======================================================== */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-950/70 via-slate-900/90 to-[#000000] border border-indigo-500/30 shadow-2xl shadow-indigo-950/50">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user.name}'s Focus Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              {t.dashboard.greeting}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              {t.dashboard.subGreeting}
            </p>
          </div>

          {/* Quick Continue Studying 1-Click Launch Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={() => handleContinueStudying()}
              className="group relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-base shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-white text-white ml-0.5" />
              </div>
              <div className="text-left">
                <div className="text-xs text-indigo-100 font-medium">
                  {t.dashboard.resumeSubject}: <span className="font-bold text-white">{lastActiveSubject?.name}</span>
                </div>
                <div className="text-sm font-extrabold tracking-wide">
                  {t.dashboard.continueStudying}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 ml-1 text-white/70 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Motivational Quote pill inside hero */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <span className="text-indigo-400 font-bold mt-0.5">💡</span>
            <div>
              <span className="italic">"{currentQuote.quote}"</span>
              <span className="text-slate-400 ml-2 font-medium">— {currentQuote.author}</span>
            </div>
          </div>
          <button
            onClick={() => setQuoteIdx((prev) => prev + 1)}
            className="self-end sm:self-auto flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition"
            title="Next Motivation Tip"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Next Tip</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. NEGLECTED SUBJECT ALERT BANNER (If Applicable)        */}
      {/* ======================================================== */}
      {primaryNeglected && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg text-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {t.dashboard.neglectedWarning}
              </p>
              <p className="text-sm font-semibold text-amber-100">
                {t.analyticsHub.neglectedAlert(primaryNeglected.subject.name, primaryNeglected.daysSince)}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleContinueStudying(primaryNeglected.subject.id)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition shrink-0 ml-2"
          >
            {t.analyticsHub.studyNow}
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. PROGRESS RING & STREAK SECTION                        */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Daily Target Progress Ring Card */}
        <div className="md:col-span-2 rounded-3xl p-6 glass-panel border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-3 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t.dashboard.dailyTarget}</span>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono-numbers">
                {(todayMinutes / 60).toFixed(1)}{' '}
                <span className="text-slate-400 text-lg font-normal">/ {(targetMinutes / 60).toFixed(1)} hrs</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {todayMinutes >= targetMinutes
                  ? '🎉 Daily goal accomplished! Outstanding effort.'
                  : `${((targetMinutes - todayMinutes) / 60).toFixed(1)} hours remaining to reach today's target.`}
              </p>
            </div>

            {/* Micro stats under progress */}
            <div className="flex items-center gap-4 pt-2">
              <div className="text-xs">
                <span className="text-slate-400">Sessions Today: </span>
                <span className="font-bold text-white">{todaySessions.length}</span>
              </div>
              <div className="text-xs">
                <span className="text-slate-400">Status: </span>
                <span className="font-bold text-emerald-400">{progressPercent}% complete</span>
              </div>
            </div>
          </div>

          {/* Radial SVG Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
              {/* Background track circle */}
              <circle
                stroke="rgba(255, 255, 255, 0.08)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              {/* Animated Progress circle */}
              <circle
                stroke="url(#progressGradient)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e9762b" />
                  <stop offset="50%" stopColor="#f2c48c" />
                  <stop offset="100%" stopColor="#e9e4da" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-extrabold text-white font-mono-numbers">
                {progressPercent}%
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Target
              </span>
            </div>
          </div>
        </div>

        {/* Streak Counter Card */}
        <div className="rounded-3xl p-6 glass-panel border border-amber-500/20 flex flex-col justify-between shadow-xl relative overflow-hidden bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{t.dashboard.streakCounter}</span>
            </div>
            <span className="text-xs text-slate-400">Best: {user.longestStreak}d</span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-amber-200 font-mono-numbers">
                {user.streakDays}
              </span>
              <span className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                {t.dashboard.streakDays}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Active fire! Study session logged today maintains streak integrity.
            </p>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span>Streak Safeguard</span>
            <span className="text-emerald-400 font-semibold">Active Protected</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. TODAY'S TOP 3 PRIORITY TASKS                          */}
      {/* ======================================================== */}
      <div className="rounded-3xl p-6 glass-panel border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t.dashboard.topTasks}
              </h2>
              <p className="text-xs text-slate-400">
                1-tap check-off directly from the dashboard
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('taskPlanner')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topPriorityTasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 bg-white/[0.02] rounded-2xl border border-white/5">
            <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            {t.dashboard.noTasksToday}
          </div>
        ) : (
          <div className="space-y-2.5">
            {topPriorityTasks.map((task) => {
              const subj = subjects.find((s) => s.id === task.subjectId);
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-white/15 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="text-slate-400 hover:text-emerald-400 transition transform hover:scale-110 shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {subj && (
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${subj.color}20`, color: subj.color }}
                          >
                            {subj.name}
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase ${task.priority === 'high'
                            ? 'bg-rose-500/20 text-rose-300'
                            : task.priority === 'med'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Launch Timer for this task */}
                  <button
                    onClick={() => {
                      if (subj) setActiveSubject(subj.id);
                      startTimer();
                      onNavigate('studyRoom');
                    }}
                    className="opacity-80 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition shrink-0 ml-2"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span className="hidden sm:inline">Start Timer</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. QUICK STATS 4-GRID                                     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Today */}
        <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.dashboard.statsTotalToday}</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono-numbers">
            {(todayMinutes / 60).toFixed(1)}h
          </div>
          <p className="text-[11px] text-emerald-400 font-medium">
            {todaySessions.length} logged sessions
          </p>
        </div>

        {/* This Week */}
        <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.dashboard.statsWeekTotal}</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono-numbers">
            {(weekMinutes / 60).toFixed(1)}h
          </div>
          <p className="text-[11px] text-slate-400">
            Avg: {(weekMinutes / 7 / 60).toFixed(1)}h / day
          </p>
        </div>

        {/* Tasks Finished */}
        <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.dashboard.statsTasksDone}</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono-numbers">
            {tasks.filter((t) => t.completed).length}
          </div>
          <p className="text-[11px] text-slate-400">
            {tasks.filter((t) => !t.completed).length} remaining
          </p>
        </div>

        {/* Syllabus Covered */}
        <div className="p-4 rounded-2xl glass-panel border border-white/5 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">{t.dashboard.statsSyllabusProgress}</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-white font-mono-numbers">
            {syllabusPercent}%
          </div>
          <p className="text-[11px] text-emerald-400">
            {completedTopics}/{totalTopics} topics mastered
          </p>
        </div>
      </div>
    </div>
  );
};
