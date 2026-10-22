import React, { useState, useRef, useEffect } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { useAuthStore } from '../store/useAuthStore';
import { translations } from '../i18n/translations';
import { TaskPriority } from '../types';
import { 
  CheckSquare, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Play, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  ArrowUpDown, 
  X,
  Target,
  RefreshCw,
  Check,
} from 'lucide-react';

interface TaskPlannerProps {
  onLaunchTimerForSubject: (subjectId: string) => void;
}

export const TaskPlannerScreen: React.FC<TaskPlannerProps> = ({ onLaunchTimerForSubject }) => {
  const { 
    language, 
    tasks, 
    subjects, 
    examCountdowns, 
    addTask, 
    toggleTask, 
    deleteTask, 
    addExamCountdown, 
    deleteExamCountdown,
    syncUserData,
    isSyncing,
    syncError,
    isCloudSynced,
  } = useStudyStore();
  const t = translations[language];

  const [justSynced, setJustSynced] = useState(false);
  const prevSyncingRef = useRef(isSyncing);

  useEffect(() => {
    if (prevSyncingRef.current && !isSyncing && !syncError) {
      setJustSynced(true);
      const timer = setTimeout(() => setJustSynced(false), 2400);
      return () => clearTimeout(timer);
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing, syncError]);

  // Tab: 'today' | 'upcoming' | 'completed'
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'completed'>('today');

  // Sorting: 'priority' | 'date'
  const [sortBy, setSortBy] = useState<'priority' | 'date'>('priority');

  // Modals
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddExamModal, setShowAddExamModal] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubjectId, setTaskSubjectId] = useState(subjects[0]?.id || '');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('high');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskPomodoros, setTaskPomodoros] = useState(2);
  const [taskNotes, setTaskNotes] = useState('');

  // New exam form state
  const [examTitle, setExamTitle] = useState('');
  const [examSubjectId, setExamSubjectId] = useState(subjects[0]?.id || '');
  const [examDate, setExamDate] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks according to active tab
  const filteredTasks = tasks.filter((task) => {
    if (activeTab === 'completed') return task.completed;
    if (task.completed) return false;
    if (activeTab === 'today') return task.dueDate <= todayStr;
    if (activeTab === 'upcoming') return task.dueDate > todayStr;
    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      const pMap = { high: 0, med: 1, low: 2 };
      return pMap[a.priority] - pMap[b.priority];
    }
    return a.dueDate.localeCompare(b.dueDate);
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim()) {
      addTask({
        title: taskTitle.trim(),
        subjectId: taskSubjectId || subjects[0]?.id || 'sub-general',
        priority: taskPriority,
        dueDate: taskDueDate,
        estimatedPomodoros: taskPomodoros,
        notes: taskNotes.trim() || undefined,
      });
      setTaskTitle('');
      setTaskNotes('');
      setShowAddTaskModal(false);
    }
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (examTitle.trim() && examDate) {
      addExamCountdown(examTitle.trim(), examSubjectId || subjects[0]?.id, examDate);
      setExamTitle('');
      setExamDate('');
      setShowAddExamModal(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fadeIn">
      {/* ======================================================== */}
      {/* 1. HEADER & ACTION CONTROLS                              */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-stone-200 dark:border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>{t.taskPlanner.title}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-white">
            {t.taskPlanner.subtitle}
          </h1>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            {tasks.filter((t) => !t.completed).length} pending priorities across your courses
          </p>
        </div>

        {/* Action Controls: Cloud Sync, Add Exam, Add Task */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Cloud Sync Button */}
          <button
            type="button"
            onClick={() => {
              const u = useAuthStore.getState().currentUser;
              if (u?.id) syncUserData(u.id, true);
            }}
            disabled={isSyncing}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition border cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
              isSyncing
                ? 'opacity-70 animate-pulse text-[#e9762b] border-[#e9762b]/50 bg-orange-500/10'
                : syncError
                ? 'text-red-400 border-red-500/50 bg-red-500/10'
                : justSynced
                ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10'
                : isCloudSynced
                ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500'
                : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white border-stone-300/80 dark:border-white/10 hover:border-[#e9762b] bg-stone-100 dark:bg-white/5'
            }`}
            title={syncError || 'Sync tasks and deadlines with cloud'}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-[#e9762b] animate-spin" />
                <span>Syncing...</span>
              </>
            ) : syncError ? (
              <>
                <X className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400">Sync Retry</span>
              </>
            ) : justSynced ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Synced</span>
              </>
            ) : isCloudSynced ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Synced</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                <span>Sync Cloud</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowAddExamModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-800/80 hover:bg-stone-200 dark:hover:bg-slate-700/80 border border-stone-200 dark:border-white/10 text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white text-xs font-bold transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>{t.taskPlanner.addExamCountdown}</span>
          </button>

          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.taskPlanner.addTask}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. EXAM & ASSIGNMENT COUNTDOWN CARDS                     */}
      {/* ======================================================== */}
      {examCountdowns.length > 0 && (
        <div className="space-y-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-slate-400 px-1 flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>{t.taskPlanner.countdownTitle}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {examCountdowns.map((exam) => {
              const subj = subjects.find((s) => s.id === exam.subjectId);
              const daysLeft = Math.ceil((new Date(exam.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 14;

              return (
                <div
                  key={exam.id}
                  className="p-4 rounded-2xl glass-panel border border-stone-200 dark:border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between group"
                  style={{ borderLeftColor: subj?.color || '#e9762b', borderLeftWidth: '4px' }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">
                        {exam.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {subj && (
                          <span 
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${subj.color}20`, color: subj.color }}
                          >
                            {subj.name}
                          </span>
                        )}
                        <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono-numbers">
                          {exam.examDate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteExamCountdown(exam.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition cursor-pointer"
                      title="Remove Countdown"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200 dark:border-white/5 flex items-center justify-between">
                    <span className="text-xs text-stone-500 dark:text-slate-400">Time Remaining:</span>
                    <span className={`text-xs font-mono-numbers font-extrabold px-2 py-0.5 rounded-full ${
                      isUrgent 
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {daysLeft > 0 ? `${daysLeft} days left` : 'Today!'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. TABS & SORT CONTROLS                                  */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Category Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-white/10 shadow-inner">
          <button
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'today'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            {t.taskPlanner.tabToday} ({tasks.filter((t) => !t.completed && t.dueDate <= todayStr).length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            {t.taskPlanner.tabUpcoming} ({tasks.filter((t) => !t.completed && t.dueDate > todayStr).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            {t.taskPlanner.tabCompleted} ({tasks.filter((t) => t.completed).length})
          </button>
        </div>

        {/* Sort Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy(sortBy === 'priority' ? 'date' : 'priority')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800/80 hover:bg-stone-200 dark:hover:bg-slate-700/80 border border-stone-200 dark:border-white/10 text-xs font-semibold text-stone-700 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Sort by: {sortBy === 'priority' ? 'Priority' : 'Due Date'}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. TASK ITEMS LIST                                       */}
      {/* ======================================================== */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl glass-panel border border-stone-200 dark:border-white/10 space-y-2">
            <CheckSquare className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mx-auto opacity-60" />
            <p className="text-sm font-semibold text-stone-700 dark:text-slate-300">
              {t.taskPlanner.noTasks}
            </p>
            <p className="text-xs text-stone-500 dark:text-slate-500">
              {activeTab === 'completed'
                ? 'Check off tasks to see your completed archive here.'
                : 'Add a new target using the button above to stay on track.'}
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const subj = subjects.find((s) => s.id === task.subjectId);

            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-stone-200 dark:border-white/10 hover:border-stone-300 dark:hover:border-white/20 transition-all shadow-md group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-3">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="text-stone-400 hover:text-emerald-500 dark:text-slate-400 dark:hover:text-emerald-400 transition transform hover:scale-110 shrink-0 cursor-pointer"
                    title={t.taskPlanner.markDone}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 fill-emerald-500/20" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${task.completed ? 'line-through text-stone-400 dark:text-slate-500' : 'text-stone-900 dark:text-slate-100'}`}>
                      {task.title}
                    </p>
                    {task.notes && (
                      <p className="text-xs text-stone-500 dark:text-slate-400 truncate mt-0.5">
                        {task.notes}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {subj && (
                        <span 
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${subj.color}20`, color: subj.color }}
                        >
                          {subj.name}
                        </span>
                      )}

                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                        task.priority === 'high' 
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 dark:border-rose-500/40' 
                          : task.priority === 'med'
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40'
                          : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 dark:border-emerald-500/40'
                      }`}>
                        {task.priority === 'high' ? t.taskPlanner.priorityHigh : task.priority === 'med' ? t.taskPlanner.priorityMed : t.taskPlanner.priorityLow}
                      </span>

                      <span className="text-[10px] text-stone-500 dark:text-slate-400 flex items-center gap-1 font-mono-numbers">
                        <Calendar className="w-3 h-3 text-stone-400 dark:text-slate-500" />
                        {task.dueDate}
                      </span>

                      <span className="text-[10px] text-indigo-700 dark:text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded-full font-mono-numbers">
                        🍅 {task.estimatedPomodoros} {task.estimatedPomodoros === 1 ? 'session' : 'sessions'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Start Timer for this task */}
                  {!task.completed && (
                    <button
                      onClick={() => onLaunchTimerForSubject(task.subjectId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white text-xs font-semibold transition cursor-pointer"
                      title={t.taskPlanner.startPomodoroForTask}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span className="hidden sm:inline">Focus</span>
                    </button>
                  )}

                  {/* Delete Task */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 dark:text-slate-500 dark:hover:text-rose-400 transition cursor-pointer"
                    title={t.taskPlanner.deleteTask}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. ADD TASK MODAL                                        */}
      {/* ======================================================== */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleCreateTask} className="w-full max-w-md rounded-3xl p-6 glass-modal shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-white/10">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {t.taskPlanner.addTask}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                {t.taskPlanner.taskTitle}:
              </label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Master Integration by Substitution"
                className="w-full bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  {t.taskPlanner.subject}:
                </label>
                <select
                  value={taskSubjectId}
                  onChange={(e) => setTaskSubjectId(e.target.value)}
                  className="w-full bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  {t.taskPlanner.priority}:
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="high">{t.taskPlanner.priorityHigh}</option>
                  <option value="med">{t.taskPlanner.priorityMed}</option>
                  <option value="low">{t.taskPlanner.priorityLow}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  {t.taskPlanner.dueDate}:
                </label>
                <input
                  type="date"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  Estimated Pomodoros:
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={taskPomodoros}
                  onChange={(e) => setTaskPomodoros(parseInt(e.target.value) || 1)}
                  className="w-full bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono-numbers"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Notes (Optional):
              </label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Key concepts or pages to review..."
                rows={2}
                className="w-full bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs font-bold hover:bg-stone-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {t.taskPlanner.addTask}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. ADD EXAM COUNTDOWN MODAL                              */}
      {/* ======================================================== */}
      {showAddExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleCreateExam} className="w-full max-w-md rounded-3xl p-6 glass-modal shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-white/10">
              <h3 className="text-base font-bold text-stone-900 dark:text-white">
                {t.taskPlanner.addExamCountdown}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddExamModal(false)}
                className="text-stone-400 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                Exam / Milestone Name:
              </label>
              <input
                type="text"
                required
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="e.g. Physics Midterms, JEE Mock, NEET Practice"
                className="w-full bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  Subject:
                </label>
                <select
                  value={examSubjectId}
                  onChange={(e) => setExamSubjectId(e.target.value)}
                  className="w-full bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">
                  Exam Date:
                </label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-stone-100 dark:bg-slate-900 border border-stone-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddExamModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs font-bold hover:bg-stone-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Save Exam Deadline
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
