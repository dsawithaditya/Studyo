import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import confetti from 'canvas-confetti';
import { 
  Language, 
  Subject, 
  StudySession, 
  Task, 
  ExamCountdown, 
  DistractionNote, 
  UserProfile, 
  RevisionConfidence, 
  TopicStatus,
  TimerMode,
  DailyLogEntry,
  StopwatchLap,
  CustomColumn,
  FriendProfile,
  FriendComment,
  CustomStudyTable,
  CustomTableColumn,
  CustomTableRow,
  CustomTableColumnType,
  ThemeMode
} from '../types';
import { SoundType, soundSynth } from '../services/soundSynth';

interface TimerState {
  mode: TimerMode;
  timeLeft: number; // in seconds
  initialDuration: number; // in seconds
  isRunning: boolean;
  activeSubjectId: string;
  activeChapterId?: string;
  sessionStartedAt?: number;
}

interface StudyState {
  theme: ThemeMode;
  language: Language;
  user: UserProfile;
  subjects: Subject[];
  sessions: StudySession[];
  tasks: Task[];
  examCountdowns: ExamCountdown[];
  distractionNotes: DistractionNote[];
  timer: TimerState;
  zenMode: boolean;
  ambientSound: SoundType;
  ambientVolume: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isCloudSynced: boolean;

  // Daily Study Log Module
  dailyLogs: DailyLogEntry[];
  ensureTodayDailyLog: () => void;
  addOrUpdateDailyLog: (entry: DailyLogEntry) => void;
  updateDailyLogField: <K extends keyof DailyLogEntry>(date: string, field: K, value: DailyLogEntry[K]) => void;
  deleteDailyLog: (date: string) => void;

  // Custom Columns Module (for main daily study log)
  customColumns: CustomColumn[];
  addCustomColumn: (col: Omit<CustomColumn, 'id'>) => void;
  updateCustomColumn: (id: string, updates: Partial<CustomColumn>) => void;
  deleteCustomColumn: (id: string) => void;
  reorderCustomColumns: (fromIndex: number, toIndex: number) => void;
  updateDailyLogCustomField: (date: string, columnId: string, value: any) => void;

  // Customizable Study Tables Module (Multiple user-defined tables)
  customTables: CustomStudyTable[];
  activeTableId: string;
  setActiveTableId: (id: string) => void;
  addCustomTable: (table: { title: string; description?: string; columns?: Omit<CustomTableColumn, 'id'>[] }) => string;
  updateCustomTable: (tableId: string, updates: Partial<Omit<CustomStudyTable, 'id' | 'rows' | 'createdAt'>>) => void;
  deleteCustomTable: (tableId: string) => void;
  addCustomTableRow: (tableId: string, date: string, values?: Record<string, any>, notes?: string) => void;
  updateCustomTableCell: (tableId: string, rowId: string, columnId: string, value: any) => void;
  updateCustomTableRowNotes: (tableId: string, rowId: string, notes: string) => void;
  deleteCustomTableRow: (tableId: string, rowId: string) => void;
  addCustomTableColumn: (tableId: string, col: Omit<CustomTableColumn, 'id'>) => void;
  updateCustomTableColumn: (tableId: string, columnId: string, updates: Partial<CustomTableColumn>) => void;
  deleteCustomTableColumn: (tableId: string, columnId: string) => void;
  reorderCustomTableColumns: (tableId: string, fromIndex: number, toIndex: number) => void;

  // Timer Settings & Stopwatch Module
  autoStartNextRound: boolean;
  soundAlertOnFinish: boolean;
  enableQuickScratchpad: boolean;
  showFinishButton: boolean;
  stopwatchTime: number; // in seconds
  stopwatchRunning: boolean;
  stopwatchLaps: StopwatchLap[];
  setAutoStartNextRound: (val: boolean) => void;
  setSoundAlertOnFinish: (val: boolean) => void;
  setEnableQuickScratchpad: (val: boolean) => void;
  setShowFinishButton: (val: boolean) => void;
  startStopwatch: () => void;
  pauseStopwatch: () => void;
  resetStopwatch: () => void;
  lapStopwatch: () => void;

  // Actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setUserTarget: (minutes: number) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  setZenMode: (zen: boolean) => void;
  setAmbientSound: (sound: SoundType) => void;
  setAmbientVolume: (vol: number) => void;
  
  // Timer Actions
  setTimerMode: (mode: TimerMode, durationMinutes?: number) => void;
  setTimerDuration: (seconds: number) => void;
  adjustTimerSeconds: (delta: number) => void;
  setActiveSubject: (subjectId: string, chapterId?: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tickTimer: () => void;

  // Session Logging
  logSession: (rating: number, notes?: string) => void;

  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;

  // Syllabus Map Actions
  addSubject: (name: string, color: string, icon: string, examDate?: string) => void;
  addChapter: (subjectId: string, title: string) => void;
  addTopic: (subjectId: string, chapterId: string, name: string) => void;
  toggleTopicStatus: (subjectId: string, chapterId: string, topicId: string) => void;
  setTopicConfidence: (subjectId: string, chapterId: string, topicId: string, conf: RevisionConfidence) => void;
  updateChapterNotes: (subjectId: string, chapterId: string, notes: string, formulas?: string) => void;

  // Distraction Scratchpad
  addDistraction: (text: string) => void;
  deleteDistraction: (id: string) => void;
  convertDistractionToTask: (distractionId: string, subjectId?: string) => void;

  // Exam Countdowns
  addExamCountdown: (title: string, subjectId: string, examDate: string) => void;
  deleteExamCountdown: (id: string) => void;

  // Cloud Config
  setSupabaseConfig: (url: string, key: string) => void;
  resetToDefaults: () => void;
  loadDemoData: () => void;

  // Friends & Social Study Circle Module
  friends: FriendProfile[];
  sendFriendRequest: (code: string) => { success: boolean; message: string; friend?: FriendProfile };
  acceptFriendRequest: (code: string) => void;
  declineFriendRequest: (code: string) => void;
  cancelFriendRequest: (code: string) => void;
  removeFriend: (code: string) => void;
  addFriendComment: (friendCode: string, text: string) => void;
  deleteFriendComment: (friendCode: string, commentId: string) => void;
  generateNewFriendCode: () => string;
  updateProfileMetricSlot: (slotIndex: 0 | 1 | 2, metricKey: string) => void;
  setCustomWordmarkText: (text: string) => void;
}

// Generate realistic 365-day seed history
function generateSeedSessions(): StudySession[] {
  const sessions: StudySession[] = [];
  const subjectIds = ['sub-math', 'sub-phys', 'sub-chem', 'sub-cs'];
  const subjectNames: Record<string, string> = {
    'sub-math': 'Mathematics',
    'sub-phys': 'Physics',
    'sub-chem': 'Organic Chemistry',
    'sub-cs': 'Computer Science',
  };

  const today = new Date();
  
  // Generate active sessions for today (~210 mins = 3.5 hrs)
  const todayStr = today.toISOString().split('T')[0];
  sessions.push(
    {
      id: 'sess-today-1',
      subjectId: 'sub-phys',
      subjectName: 'Physics',
      chapterId: 'ch-phys-1',
      chapterTitle: 'Electromagnetism',
      durationMinutes: 90,
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
      dateString: todayStr,
      hour: 9,
      focusRating: 5,
      notes: 'Solved Gauss law numericals and flux integration',
      mode: 'pomodoro',
    },
    {
      id: 'sess-today-2',
      subjectId: 'sub-chem',
      subjectName: 'Organic Chemistry',
      chapterId: 'ch-chem-1',
      chapterTitle: 'Reaction Mechanisms',
      durationMinutes: 75,
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 15).toISOString(),
      dateString: todayStr,
      hour: 14,
      focusRating: 4,
      notes: 'SN1 vs SN2 nucleophilic substitutions',
      mode: 'pomodoro',
    },
    {
      id: 'sess-today-3',
      subjectId: 'sub-cs',
      subjectName: 'Computer Science',
      chapterId: 'ch-cs-1',
      chapterTitle: 'Data Structures & Trees',
      durationMinutes: 45,
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString(),
      dateString: todayStr,
      hour: 17,
      focusRating: 5,
      notes: 'Implemented AVL balancing rotation in TS',
      mode: 'stopwatch',
    }
  );

  // Generate historical data over past 300 days
  // Ensure 'sub-math' was NOT studied for the last 4 days (to trigger neglected alert!)
  for (let i = 1; i <= 180; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Skip some days randomly (e.g. 20% rest days)
    if (i % 6 === 0) continue;

    // Pick 1-3 study sessions for this day
    const sessionCount = (i % 3) + 1;
    for (let s = 0; s < sessionCount; s++) {
      let subjId = subjectIds[(i + s) % subjectIds.length];
      
      // If within last 4 days, do not pick math
      if (i <= 4 && subjId === 'sub-math') {
        subjId = 'sub-phys';
      }

      const hours = [8, 10, 14, 16, 20, 22];
      const hr = hours[(i + s) % hours.length];
      const durations = [25, 45, 50, 60, 90];
      const dur = durations[(i * 3 + s) % durations.length];

      sessions.push({
        id: `sess-hist-${i}-${s}`,
        subjectId: subjId,
        subjectName: subjectNames[subjId],
        durationMinutes: dur,
        timestamp: new Date(d.getFullYear(), d.getMonth(), d.getDate(), hr, 0).toISOString(),
        dateString: dateStr,
        hour: hr,
        focusRating: ((i + s) % 3) + 3,
        notes: `Focus review session on ${subjectNames[subjId]}`,
        mode: s % 2 === 0 ? 'pomodoro' : 'stopwatch',
      });
    }
  }

  return sessions;
}

const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-math',
    name: 'Mathematics',
    icon: 'Sigma',
    color: '#6366f1', // Indigo
    examDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
    chapters: [
      {
        id: 'ch-math-1',
        subjectId: 'sub-math',
        title: 'Integral & Differential Calculus',
        notes: 'Integration by parts: ∫u dv = uv - ∫v du. LIATE rule for choosing u.',
        formulas: 'd/dx[sin x] = cos x | ∫sec²x dx = tan x + C',
        topics: [
          { id: 'top-m1', name: 'Limits and Continuity', status: 'completed', confidence: 'strong' },
          { id: 'top-m2', name: 'Definite Integrals & Properties', status: 'in_progress', confidence: 'medium' },
          { id: 'top-m3', name: 'Differential Equations', status: 'pending', confidence: 'weak' },
        ],
      },
      {
        id: 'ch-math-2',
        subjectId: 'sub-math',
        title: 'Linear Algebra & Matrices',
        notes: 'Matrix eigenvalues: det(A - λI) = 0. Cayley-Hamilton theorem.',
        formulas: 'Rank-Nullity: dim(V) = rank(T) + nullity(T)',
        topics: [
          { id: 'top-m4', name: 'Determinants and Inverses', status: 'completed', confidence: 'strong' },
          { id: 'top-m5', name: 'Eigenvalues & Diagonalization', status: 'pending', confidence: 'weak' },
        ],
      },
    ],
  },
  {
    id: 'sub-phys',
    name: 'Physics',
    icon: 'Zap',
    color: '#06b6d4', // Cyan
    examDate: new Date(Date.now() + 24 * 86400000).toISOString().split('T')[0],
    chapters: [
      {
        id: 'ch-phys-1',
        subjectId: 'sub-phys',
        title: 'Electromagnetism & Optics',
        notes: 'Gauss Law: ∮E·dA = Q_enclosed / ε₀. Faraday law: emf = -dΦ/dt.',
        formulas: 'Maxwell: ∇·B = 0, ∇×E = -∂B/∂t',
        topics: [
          { id: 'top-p1', name: 'Electric Field & Gauss Theorem', status: 'completed', confidence: 'strong' },
          { id: 'top-p2', name: 'Electromagnetic Induction', status: 'completed', confidence: 'strong' },
          { id: 'top-p3', name: 'Wave Optics & Interference', status: 'in_progress', confidence: 'medium' },
        ],
      },
      {
        id: 'ch-phys-2',
        subjectId: 'sub-phys',
        title: 'Quantum & Modern Physics',
        notes: 'De Broglie wavelength: λ = h / p. Photoelectric: E = hν - Φ.',
        formulas: 'Δx·Δp ≥ ℏ/2 (Heisenberg Uncertainty)',
        topics: [
          { id: 'top-p4', name: 'Photoelectric Effect', status: 'completed', confidence: 'strong' },
          { id: 'top-p5', name: 'Atomic Spectra & Bohr Model', status: 'pending', confidence: 'medium' },
        ],
      },
    ],
  },
  {
    id: 'sub-chem',
    name: 'Organic Chemistry',
    icon: 'FlaskConical',
    color: '#10b981', // Emerald
    examDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
    chapters: [
      {
        id: 'ch-chem-1',
        subjectId: 'sub-chem',
        title: 'Reaction Mechanisms',
        notes: 'Carbocation stability: 3° > 2° > 1°. Anti-Markovnikov with peroxides.',
        formulas: 'Rate = k[substrate][nucleophile] for SN2',
        topics: [
          { id: 'top-c1', name: 'Nucleophilic Substitution (SN1 vs SN2)', status: 'completed', confidence: 'strong' },
          { id: 'top-c2', name: 'Electrophilic Aromatic Substitution', status: 'in_progress', confidence: 'medium' },
          { id: 'top-c3', name: 'Aldol Condensation & Cannizzaro', status: 'pending', confidence: 'weak' },
        ],
      },
    ],
  },
  {
    id: 'sub-cs',
    name: 'Computer Science',
    icon: 'Code2',
    color: '#8b5cf6', // Violet
    examDate: new Date(Date.now() + 32 * 86400000).toISOString().split('T')[0],
    chapters: [
      {
        id: 'ch-cs-1',
        subjectId: 'sub-cs',
        title: 'Data Structures & Algorithms',
        notes: 'Time complexity: QuickSort average O(N log N), worst O(N²). Dijkstra for shortest path.',
        formulas: 'Master Theorem: T(n) = aT(n/b) + f(n)',
        topics: [
          { id: 'top-cs1', name: 'Binary Trees & Balanced AVL', status: 'completed', confidence: 'strong' },
          { id: 'top-cs2', name: 'Graph Traversals (BFS & DFS)', status: 'completed', confidence: 'strong' },
          { id: 'top-cs3', name: 'Dynamic Programming (Knapsack & LCS)', status: 'in_progress', confidence: 'medium' },
        ],
      },
    ],
  },
];

export const INITIAL_CUSTOM_COLUMNS: CustomColumn[] = [
  {
    id: 'col-water',
    name: 'Water (L)',
    type: 'number',
  },
  {
    id: 'col-energy',
    name: 'Energy Level',
    type: 'select',
    options: ['High', 'Normal', 'Low'],
  },
  {
    id: 'col-workout',
    name: 'Workout',
    type: 'boolean',
  },
];

export const INITIAL_CUSTOM_TABLES: CustomStudyTable[] = [
  {
    id: 'tbl-mock-tests',
    title: 'Mock Tests & Practice Papers',
    description: 'Track exam practice papers, scores, accuracy percentage, and analysis notes.',
    createdAt: '2026-10-01',
    columns: [
      { id: 'col-paper', name: 'PAPER', type: 'text' },
      { id: 'col-score', name: 'SCORE', type: 'number' },
      { id: 'col-total', name: 'TOTAL', type: 'number' },
      { id: 'col-accuracy', name: 'ACCURACY', type: 'number', unit: '%' },
      { id: 'col-difficulty', name: 'DIFFICULTY', type: 'select', options: ['High', 'Normal', 'Low'] },
      { id: 'col-analyzed', name: 'ANALYZED', type: 'boolean' },
    ],
    rows: [
      {
        id: 'row-1',
        date: '2026-10-16',
        values: {
          'col-paper': 'Full Mock #04',
          'col-score': 248,
          'col-total': 300,
          'col-accuracy': 88,
          'col-difficulty': 'Normal',
          'col-analyzed': true,
        },
        notes: 'Made 3 silly calculation errors in section B. Revise thermodynamics formulas.',
        createdAt: '2026-10-16T18:00:00Z',
      },
      {
        id: 'row-2',
        date: '2026-10-14',
        values: {
          'col-paper': 'Adv Physics Drill',
          'col-score': 82,
          'col-total': 100,
          'col-accuracy': 84,
          'col-difficulty': 'High',
          'col-analyzed': true,
        },
        notes: 'Rotational dynamics problems took longer than expected.',
        createdAt: '2026-10-14T19:30:00Z',
      },
      {
        id: 'row-3',
        date: '2026-10-11',
        values: {
          'col-paper': 'Calculus Finals',
          'col-score': 94,
          'col-total': 100,
          'col-accuracy': 96,
          'col-difficulty': 'Low',
          'col-analyzed': true,
        },
        notes: 'Great pacing, finished 15 mins ahead of time.',
        createdAt: '2026-10-11T17:00:00Z',
      },
    ],
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Solve 15 integration problem sets (LIATE rule practice)',
    subjectId: 'sub-math',
    priority: 'high',
    dueDate: '2026-10-14',
    completed: false,
    estimatedPomodoros: 2,
    notes: 'Focus on trigonometric substitution and partial fractions',
  },
  {
    id: 'task-2',
    title: 'Revise Gauss Law & Lenz Law formula sheet',
    subjectId: 'sub-phys',
    priority: 'high',
    dueDate: '2026-10-14',
    completed: false,
    estimatedPomodoros: 1,
    notes: 'Draw diagrams for induced currents',
  },
  {
    id: 'task-3',
    title: 'Code Dijkstra and Topological Sort implementations',
    subjectId: 'sub-cs',
    priority: 'med',
    dueDate: '2026-10-14',
    completed: false,
    estimatedPomodoros: 2,
    notes: 'Verify edge cases with disconnected graphs',
  },
  {
    id: 'task-4',
    title: 'Complete Aldol condensation reaction chart',
    subjectId: 'sub-chem',
    priority: 'high',
    dueDate: '2026-10-15',
    completed: false,
    estimatedPomodoros: 2,
    notes: 'Cross-aldol products and dehydration step mechanisms',
  },
  {
    id: 'task-5',
    title: 'Review Organic Isomerism & Stereochemistry',
    subjectId: 'sub-chem',
    priority: 'med',
    dueDate: '2026-10-16',
    completed: false,
    estimatedPomodoros: 2,
  },
  {
    id: 'task-6',
    title: 'Past 5-year paper solving: Electromagnetism',
    subjectId: 'sub-phys',
    priority: 'low',
    dueDate: '2026-10-14',
    completed: true,
    completedAt: '2026-10-14T15:30:00.000Z',
    estimatedPomodoros: 3,
  },
  {
    id: 'task-7',
    title: 'Calculus limits & continuity practice test',
    subjectId: 'sub-math',
    priority: 'med',
    dueDate: '2026-10-13',
    completed: true,
    completedAt: '2026-10-13T17:45:00.000Z',
    estimatedPomodoros: 2,
  },
];

export const getLocalTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const createDefaultDailyLog = (date: string): DailyLogEntry => ({
  date,
  studyHours: null,
  attendedClass: false,
  pyqsSolved: null,
  revisionDone: false,
  mockTestTaken: false,
  sleepHours: null,
  focusRating: null,
  notes: '',
  customData: {},
});

/**
 * Ensures today's log exists date-wise, and guarantees no future dates exist.
 * For today it generates today. For tomorrow it will only generate when tomorrow arrives.
 */
export const ensureDailyLogsDateWise = (logs: DailyLogEntry[]): DailyLogEntry[] => {
  const todayStr = getLocalTodayDateString();
  const map = new Map<string, DailyLogEntry>();

  // Only include logs up to today (never generate tomorrow today)
  if (Array.isArray(logs)) {
    for (const log of logs) {
      if (log && log.date && log.date <= todayStr) {
        map.set(log.date, log);
      }
    }
  }

  // Ensure today's entry is generated
  if (!map.has(todayStr)) {
    map.set(todayStr, createDefaultDailyLog(todayStr));
  } else {
    // If today was previously auto-generated with default zeroes and has no user study notes or actions, clean to unentered state
    const todayLog = map.get(todayStr)!;
    if (
      (todayLog.studyHours === 0 || todayLog.studyHours == null) &&
      (todayLog.pyqsSolved === 0 || todayLog.pyqsSolved == null) &&
      (todayLog.sleepHours === 0 || todayLog.sleepHours == null) &&
      (todayLog.focusRating === 5 || todayLog.focusRating == null) &&
      !todayLog.notes &&
      !todayLog.attendedClass &&
      !todayLog.revisionDone &&
      !todayLog.mockTestTaken &&
      (!todayLog.customData || Object.keys(todayLog.customData).length === 0)
    ) {
      map.set(todayStr, createDefaultDailyLog(todayStr));
    }
  }

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
};

export const INITIAL_DAILY_LOGS: DailyLogEntry[] = [
  {
    date: '2026-10-14',
    studyHours: 6.5,
    attendedClass: true,
    pyqsSolved: 25,
    revisionDone: true,
    mockTestTaken: false,
    sleepHours: 7.0,
    focusRating: 5,
    notes: 'Deep focus on electromagnetic induction & organic synthesis pathways. Solved 25 PYQs with zero distractions.',
    customData: { 'col-water': 3.2, 'col-energy': 'High', 'col-workout': true },
  },
  {
    date: '2026-10-13',
    studyHours: 5.0,
    attendedClass: true,
    pyqsSolved: 18,
    revisionDone: true,
    mockTestTaken: false,
    sleepHours: 6.5,
    focusRating: 4,
    notes: 'Gauss Law numericals and mechanics problem sets completed. Fast review of rotational motion formulas.',
    customData: { 'col-water': 2.8, 'col-energy': 'High', 'col-workout': true },
  },
  {
    date: '2026-10-12',
    studyHours: 3.5,
    attendedClass: true,
    pyqsSolved: 8,
    revisionDone: false,
    mockTestTaken: false,
    sleepHours: 7.5,
    focusRating: 3,
    notes: 'Attended college lectures on thermodynamics & heat transfer. Heavy college schedule left limited self-study time.',
    customData: { 'col-water': 2.2, 'col-energy': 'Normal', 'col-workout': false },
  },
  {
    date: '2026-10-11',
    studyHours: 7.0,
    attendedClass: false,
    pyqsSolved: 35,
    revisionDone: true,
    mockTestTaken: true,
    sleepHours: 6.5,
    focusRating: 5,
    notes: 'Sunday mock test 1 completed (Score: 168/200). Analyzed mistakes in coordinate geometry and optics.',
    customData: { 'col-water': 3.5, 'col-energy': 'High', 'col-workout': true },
  },
  {
    date: '2026-10-10',
    studyHours: 2.5,
    attendedClass: true,
    pyqsSolved: 0,
    revisionDone: false,
    mockTestTaken: false,
    sleepHours: 8.5,
    focusRating: 2,
    notes: 'Felt fatigued, light reading and formula sheets review only. Took proper rest in the evening.',
    customData: { 'col-water': 2.0, 'col-energy': 'Low', 'col-workout': false },
  },
  {
    date: '2026-10-09',
    studyHours: 5.5,
    attendedClass: true,
    pyqsSolved: 22,
    revisionDone: true,
    mockTestTaken: false,
    sleepHours: 7.0,
    focusRating: 4,
    notes: 'Reaction mechanism flashcards revised. Solved aromatic substitution problems and carbonyl reactions.',
    customData: { 'col-water': 2.5, 'col-energy': 'High', 'col-workout': true },
  },
  {
    date: '2026-10-08',
    studyHours: 6.0,
    attendedClass: true,
    pyqsSolved: 30,
    revisionDone: true,
    mockTestTaken: false,
    sleepHours: 7.0,
    focusRating: 5,
    notes: 'Calculus integration by parts & differential equations drill. Solved 30 tough past-year questions.',
    customData: { 'col-water': 3.0, 'col-energy': 'High', 'col-workout': false },
  },
  {
    date: '2026-10-07',
    studyHours: 4.0,
    attendedClass: true,
    pyqsSolved: 14,
    revisionDone: true,
    mockTestTaken: false,
    sleepHours: 6.5,
    focusRating: 4,
    notes: 'Mid-week review: Capacitors, dielectrics, and Kirchhoff loop rules. Cleared backlog notes.',
    customData: { 'col-water': 2.6, 'col-energy': 'Normal', 'col-workout': true },
  },
  {
    date: '2026-10-06',
    studyHours: 5.5,
    attendedClass: false,
    pyqsSolved: 28,
    revisionDone: true,
    mockTestTaken: false,
    sleepHours: 7.5,
    focusRating: 4,
    notes: 'Binary search trees, AVL rotations and graph traversal algorithms implemented and tested.',
    customData: { 'col-water': 2.9, 'col-energy': 'High', 'col-workout': true },
  },
  {
    date: '2026-10-05',
    studyHours: 4.5,
    attendedClass: true,
    pyqsSolved: 15,
    revisionDone: false,
    mockTestTaken: false,
    sleepHours: 6.0,
    focusRating: 3,
    notes: 'College lab practicals + 3 hours evening study on organic isomerism and IUPAC nomenclature.',
    customData: { 'col-water': 2.1, 'col-energy': 'Normal', 'col-workout': false },
  },
  {
    date: '2026-10-04',
    studyHours: 7.5,
    attendedClass: false,
    pyqsSolved: 40,
    revisionDone: true,
    mockTestTaken: true,
    sleepHours: 7.0,
    focusRating: 5,
    notes: 'Full subject mini-mock test on Mechanics & Algebra. Great timing, finished 15 mins before time.',
    customData: { 'col-water': 3.4, 'col-energy': 'High', 'col-workout': true },
  },
  {
    date: '2026-10-03',
    studyHours: 3.0,
    attendedClass: true,
    pyqsSolved: 6,
    revisionDone: false,
    mockTestTaken: false,
    sleepHours: 8.0,
    focusRating: 3,
    notes: 'Quick study sprint before weekend. Covered electrostatics electric potential and field lines.',
    customData: { 'col-water': 2.0, 'col-energy': 'Normal', 'col-workout': false },
  },
  {
    date: '2026-10-02',
    studyHours: 6.0,
    attendedClass: false,
    pyqsSolved: 20,
    revisionDone: true,
    mockTestTaken: false,
    sleepHours: 7.5,
    focusRating: 4,
    notes: 'Holiday study marathon! Comprehensive revision of chemical equilibrium and Le Chatelier principle.',
    customData: { 'col-water': 3.0, 'col-energy': 'High', 'col-workout': true },
  },
  {
    date: '2026-10-01',
    studyHours: 5.0,
    attendedClass: true,
    pyqsSolved: 16,
    revisionDone: true,
    mockTestTaken: false,
    sleepHours: 6.5,
    focusRating: 4,
    notes: 'October goal kickoff: Planned study targets for the month. Covered limits, continuity, and differentiability.',
    customData: { 'col-water': 2.7, 'col-energy': 'High', 'col-workout': true },
  },
];

// Module-level persistent timer ticker engine
let timerInterval: number | null = null;
let targetEndTime: number | null = null;
let stopwatchStartedAt: number | null = null;

function clearTimerLoop() {
  if (timerInterval !== null) {
    window.clearInterval(timerInterval);
    timerInterval = null;
  }
  targetEndTime = null;
  stopwatchStartedAt = null;
}

// Module-level persistent stopwatch engine
let stopwatchInterval: number | null = null;
let stopwatchTimeStartedAt: number | null = null;

function clearStopwatchLoop() {
  if (stopwatchInterval !== null) {
    window.clearInterval(stopwatchInterval);
    stopwatchInterval = null;
  }
  stopwatchTimeStartedAt = null;
}

// Generate 4-5 digit unique alphanumeric student code (e.g. 7K9X2)
export function generateStudentCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const INITIAL_FRIENDS: FriendProfile[] = [
  {
    code: 'D4M8X',
    name: 'Dev Patel',
    avatar: 'D',
    bio: '',
    streakDays: 24,
    dailyTargetMinutes: 240,
    todayStudyMinutes: 210,
    lastActive: '20m ago',
    status: 'accepted',
    studyLogs: [
      {
        date: '2026-10-16',
        studyHours: 4.5,
        attendedClass: true,
        pyqsSolved: 25,
        revisionDone: true,
        mockTestTaken: false,
        sleepHours: 7.5,
        focusRating: 5,
        notes: 'Binary search tree rebalancing, red-black tree insertion proofs, and graph DFS.',
      },
      {
        date: '2026-10-15',
        studyHours: 4.0,
        attendedClass: true,
        pyqsSolved: 18,
        revisionDone: true,
        mockTestTaken: true,
        sleepHours: 7.0,
        focusRating: 4,
        notes: 'Mock exam on Operating Systems (Memory Management & Virtual Paging). Scored 92%.',
      },
      {
        date: '2026-10-14',
        studyHours: 3.5,
        attendedClass: false,
        pyqsSolved: 30,
        revisionDone: false,
        mockTestTaken: false,
        sleepHours: 8.0,
        focusRating: 4,
        notes: 'Dynamic programming marathon: Knapsack variations and longest common subsequence.',
      },
      {
        date: '2026-10-13',
        studyHours: 5.0,
        attendedClass: true,
        pyqsSolved: 20,
        revisionDone: true,
        mockTestTaken: false,
        sleepHours: 7.2,
        focusRating: 5,
        notes: 'System design fundamentals: Load balancing, caching patterns, and database indexing.',
      },
      {
        date: '2026-10-12',
        studyHours: 3.0,
        attendedClass: true,
        pyqsSolved: 15,
        revisionDone: true,
        mockTestTaken: false,
        sleepHours: 6.8,
        focusRating: 3,
        notes: 'Computer networks: TCP 3-way handshake and congestion control window.',
      },
    ],
    comments: [
      {
        id: 'comm-1',
        authorCode: 'A9X4K',
        authorName: 'Alex',
        text: 'Insane consistency on dynamic programming yesterday! 🔥',
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
        reactions: ['🔥', '💪'],
      },
      {
        id: 'comm-2',
        authorCode: 'D4M8X',
        authorName: 'Dev Patel',
        text: 'Thanks Alex! Graph theory finals coming up next week, pushing hard.',
        timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        reactions: ['⚡'],
      },
    ],
  },
  {
    code: 'E7K92',
    name: 'Elena Rostova',
    avatar: 'E',
    bio: '',
    streakDays: 18,
    dailyTargetMinutes: 330,
    todayStudyMinutes: 270,
    lastActive: '1h ago',
    status: 'incoming_request',
    requestedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    studyLogs: [
      {
        date: '2026-10-16',
        studyHours: 5.5,
        attendedClass: true,
        pyqsSolved: 35,
        revisionDone: true,
        mockTestTaken: false,
        sleepHours: 7.0,
        focusRating: 5,
        notes: 'Electrodynamics Maxwell equations, wave propagation in dielectric media.',
      },
      {
        date: '2026-10-15',
        studyHours: 5.0,
        attendedClass: false,
        pyqsSolved: 40,
        revisionDone: true,
        mockTestTaken: true,
        sleepHours: 7.5,
        focusRating: 5,
        notes: 'Full length Physics mock exam. Rotational dynamics & angular momentum conservation.',
      },
      {
        date: '2026-10-14',
        studyHours: 4.5,
        attendedClass: true,
        pyqsSolved: 25,
        revisionDone: true,
        mockTestTaken: false,
        sleepHours: 6.5,
        focusRating: 4,
        notes: 'Thermodynamics Carnot cycle, entropy integration problems.',
      },
    ],
    comments: [],
  },
  {
    code: 'S3W5Y',
    name: 'Sara Chen',
    avatar: 'S',
    bio: '',
    streakDays: 15,
    dailyTargetMinutes: 360,
    todayStudyMinutes: 310,
    lastActive: '40m ago',
    status: 'none',
    studyLogs: [
      {
        date: '2026-10-16',
        studyHours: 6.0,
        attendedClass: true,
        pyqsSolved: 30,
        revisionDone: true,
        mockTestTaken: false,
        sleepHours: 8.0,
        focusRating: 5,
        notes: 'Aldol condensation, Cannizzaro reaction, and carboxylic acid derivatives.',
      },
      {
        date: '2026-10-15',
        studyHours: 5.5,
        attendedClass: true,
        pyqsSolved: 28,
        revisionDone: true,
        mockTestTaken: false,
        sleepHours: 7.5,
        focusRating: 4,
        notes: 'Biomolecules: Peptide bond resonance, amino acid zwitterion titration curves.',
      },
    ],
    comments: [],
  },
  {
    code: 'R8P2T',
    name: 'Rohan Sharma',
    avatar: 'R',
    bio: '',
    streakDays: 12,
    dailyTargetMinutes: 300,
    todayStudyMinutes: 200,
    lastActive: '2h ago',
    status: 'none',
    studyLogs: [
      {
        date: '2026-10-16',
        studyHours: 4.0,
        attendedClass: true,
        pyqsSolved: 22,
        revisionDone: true,
        mockTestTaken: false,
        sleepHours: 7.0,
        focusRating: 4,
        notes: 'Differential equations: Integrating factor methods and orthogonal trajectories.',
      },
      {
        date: '2026-10-15',
        studyHours: 4.5,
        attendedClass: true,
        pyqsSolved: 30,
        revisionDone: false,
        mockTestTaken: true,
        sleepHours: 6.5,
        focusRating: 3,
        notes: 'Coordinate geometry conic sections: Parabola tangents and normal equations.',
      },
    ],
    comments: [],
  },
];

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#fae8dc');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', '#000000');
  }
};

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      language: 'en',
      user: {
        name: 'Alex',
        streakDays: 14,
        longestStreak: 21,
        lastStudiedDate: new Date().toISOString().split('T')[0],
        lastActiveSubjectId: 'sub-phys',
        friendCode: 'A9X4K',
        profileMetricSlots: ['currentStreak', 'bestStreak', 'daysLogged'],
        customWordmarkText: 'studyo',
      },
      friends: INITIAL_FRIENDS,
      subjects: INITIAL_SUBJECTS,
      sessions: generateSeedSessions(),
      tasks: INITIAL_TASKS,
      dailyLogs: ensureDailyLogsDateWise(INITIAL_DAILY_LOGS),
      customColumns: INITIAL_CUSTOM_COLUMNS,
      customTables: INITIAL_CUSTOM_TABLES,
      activeTableId: 'main',
      autoStartNextRound: false,
      soundAlertOnFinish: true,
      enableQuickScratchpad: false,
      showFinishButton: true,
      stopwatchTime: 0,
      stopwatchRunning: false,
      stopwatchLaps: [],
      examCountdowns: [
        {
          id: 'exam-1',
          title: 'Chemistry Board Exam',
          subjectId: 'sub-chem',
          examDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
          targetScore: '95%',
        },
        {
          id: 'exam-2',
          title: 'Math Calculus Finals',
          subjectId: 'sub-math',
          examDate: new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0],
          targetScore: '100%',
        },
        {
          id: 'exam-3',
          title: 'Physics Competitive Mock',
          subjectId: 'sub-phys',
          examDate: new Date(Date.now() + 24 * 86400000).toISOString().split('T')[0],
          targetScore: 'Top 5%',
        },
      ],
      distractionNotes: [
        {
          id: 'dist-1',
          text: 'Check if hackathon registration deadline is next Monday',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      timer: {
        mode: 'pomodoro',
        timeLeft: 25 * 60,
        initialDuration: 25 * 60,
        isRunning: false,
        activeSubjectId: 'sub-phys',
        activeChapterId: 'ch-phys-1',
      },
      zenMode: false,
      ambientSound: 'off',
      ambientVolume: 0.5,
      supabaseUrl: '',
      supabaseAnonKey: '',
      isCloudSynced: false,

      // Daily Study Log Actions
      ensureTodayDailyLog: () => {
        set((state) => ({
          dailyLogs: ensureDailyLogsDateWise(state.dailyLogs),
        }));
      },

      addOrUpdateDailyLog: (entry) => {
        set((state) => {
          const logs = Array.isArray(state.dailyLogs) ? state.dailyLogs : INITIAL_DAILY_LOGS;
          const existingIndex = logs.findIndex((l) => l.date === entry.date);
          let updated: DailyLogEntry[];
          if (existingIndex >= 0) {
            updated = [...logs];
            updated[existingIndex] = entry;
          } else {
            updated = [entry, ...logs];
          }
          return { dailyLogs: ensureDailyLogsDateWise(updated) };
        });
      },

      updateDailyLogField: (date, field, value) => {
        set((state) => {
          const logs = Array.isArray(state.dailyLogs) ? state.dailyLogs : INITIAL_DAILY_LOGS;
          const updated = logs.map((l) => {
            if (l.date === date) {
              return { ...l, [field]: value };
            }
            return l;
          });
          return { dailyLogs: updated };
        });
      },

      deleteDailyLog: (date) => {
        set((state) => {
          const logs = Array.isArray(state.dailyLogs) ? state.dailyLogs : INITIAL_DAILY_LOGS;
          return { dailyLogs: logs.filter((l) => l.date !== date) };
        });
      },

      // Custom Columns Actions
      addCustomColumn: (col) => {
        const newCol: CustomColumn = {
          ...col,
          id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        };
        set((state) => ({
          customColumns: [...(state.customColumns || []), newCol],
        }));
      },
      updateCustomColumn: (id, updates) => {
        set((state) => ({
          customColumns: (state.customColumns || []).map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },
      deleteCustomColumn: (id) => {
        set((state) => ({
          customColumns: (state.customColumns || []).filter((c) => c.id !== id),
          dailyLogs: (state.dailyLogs || []).map((log) => {
            if (!log.customData || !(id in log.customData)) return log;
            const nextData = { ...log.customData };
            delete nextData[id];
            return { ...log, customData: nextData };
          }),
        }));
      },
      reorderCustomColumns: (fromIndex, toIndex) => {
        set((state) => {
          const list = [...(state.customColumns || [])];
          if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length) {
            return state;
          }
          const [moved] = list.splice(fromIndex, 1);
          list.splice(toIndex, 0, moved);
          return { customColumns: list };
        });
      },
      updateDailyLogCustomField: (date, columnId, value) => {
        set((state) => {
          const logs = Array.isArray(state.dailyLogs) ? state.dailyLogs : INITIAL_DAILY_LOGS;
          const updated = logs.map((l) => {
            if (l.date === date) {
              return {
                ...l,
                customData: {
                  ...(l.customData || {}),
                  [columnId]: value,
                },
              };
            }
            return l;
          });
          return { dailyLogs: updated };
        });
      },

      // Customizable Study Tables Actions
      setActiveTableId: (id) => set({ activeTableId: id }),

      addCustomTable: ({ title, description, columns = [] }) => {
        const newId = `tbl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const initialColumns: CustomTableColumn[] = columns.length > 0
          ? columns.map((c, idx) => ({
              ...c,
              id: `col_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            }))
          : [
              { id: `col_${Date.now()}_1`, name: 'Topic / Item', type: 'text' },
              { id: `col_${Date.now()}_2`, name: 'Status', type: 'boolean' },
            ];

        const todayStr = getLocalTodayDateString();
        const newTable: CustomStudyTable = {
          id: newId,
          title: title.trim() || 'Untitled Table',
          description: description?.trim() || '',
          createdAt: todayStr,
          columns: initialColumns,
          rows: [
            {
              id: `row_${Date.now()}_1`,
              date: todayStr,
              values: {},
              notes: '',
              createdAt: new Date().toISOString(),
            },
          ],
        };

        set((state) => ({
          customTables: [...(state.customTables || []), newTable],
          activeTableId: newId,
        }));
        return newId;
      },

      updateCustomTable: (tableId, updates) => {
        set((state) => ({
          customTables: (state.customTables || []).map((t) =>
            t.id === tableId ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteCustomTable: (tableId) => {
        set((state) => ({
          customTables: (state.customTables || []).filter((t) => t.id !== tableId),
          activeTableId: state.activeTableId === tableId ? 'main' : state.activeTableId,
        }));
      },

      addCustomTableRow: (tableId, date, values = {}, notes = '') => {
        const newRow: CustomTableRow = {
          id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          date,
          values,
          notes,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          customTables: (state.customTables || []).map((tbl) => {
            if (tbl.id !== tableId) return tbl;
            const nextRows = [newRow, ...tbl.rows].sort((a, b) => b.date.localeCompare(a.date));
            return { ...tbl, rows: nextRows };
          }),
        }));
      },

      updateCustomTableCell: (tableId, rowId, columnId, value) => {
        set((state) => ({
          customTables: (state.customTables || []).map((tbl) => {
            if (tbl.id !== tableId) return tbl;
            return {
              ...tbl,
              rows: tbl.rows.map((row) => {
                if (row.id !== rowId) return row;
                return {
                  ...row,
                  values: {
                    ...row.values,
                    [columnId]: value,
                  },
                };
              }),
            };
          }),
        }));
      },

      updateCustomTableRowNotes: (tableId, rowId, notes) => {
        set((state) => ({
          customTables: (state.customTables || []).map((tbl) => {
            if (tbl.id !== tableId) return tbl;
            return {
              ...tbl,
              rows: tbl.rows.map((row) => (row.id === rowId ? { ...row, notes } : row)),
            };
          }),
        }));
      },

      deleteCustomTableRow: (tableId, rowId) => {
        set((state) => ({
          customTables: (state.customTables || []).map((tbl) => {
            if (tbl.id !== tableId) return tbl;
            return {
              ...tbl,
              rows: tbl.rows.filter((row) => row.id !== rowId),
            };
          }),
        }));
      },

      addCustomTableColumn: (tableId, col) => {
        const newCol: CustomTableColumn = {
          ...col,
          id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        };
        set((state) => ({
          customTables: (state.customTables || []).map((tbl) => {
            if (tbl.id !== tableId) return tbl;
            return {
              ...tbl,
              columns: [...tbl.columns, newCol],
            };
          }),
        }));
      },

      updateCustomTableColumn: (tableId, columnId, updates) => {
        set((state) => ({
          customTables: (state.customTables || []).map((tbl) => {
            if (tbl.id !== tableId) return tbl;
            return {
              ...tbl,
              columns: tbl.columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c)),
            };
          }),
        }));
      },

      deleteCustomTableColumn: (tableId, columnId) => {
        set((state) => ({
          customTables: (state.customTables || []).map((tbl) => {
            if (tbl.id !== tableId) return tbl;
            return {
              ...tbl,
              columns: tbl.columns.filter((c) => c.id !== columnId),
              rows: tbl.rows.map((row) => {
                if (!(columnId in row.values)) return row;
                const nextVals = { ...row.values };
                delete nextVals[columnId];
                return { ...row, values: nextVals };
              }),
            };
          }),
        }));
      },

      reorderCustomTableColumns: (tableId, fromIndex, toIndex) => {
        set((state) => ({
          customTables: (state.customTables || []).map((tbl) => {
            if (tbl.id !== tableId) return tbl;
            const cols = [...tbl.columns];
            if (fromIndex < 0 || fromIndex >= cols.length || toIndex < 0 || toIndex >= cols.length) {
              return tbl;
            }
            const [moved] = cols.splice(fromIndex, 1);
            cols.splice(toIndex, 0, moved);
            return { ...tbl, columns: cols };
          }),
        }));
      },

      // Timer Settings & Stopwatch Actions
      setAutoStartNextRound: (val) => set({ autoStartNextRound: val }),
      setSoundAlertOnFinish: (val) => set({ soundAlertOnFinish: val }),
      setEnableQuickScratchpad: (val) => set({ enableQuickScratchpad: val }),
      setShowFinishButton: (val) => set({ showFinishButton: val }),

      startStopwatch: () => {
        const { stopwatchRunning, stopwatchTime } = get();
        if (stopwatchRunning) return;
        clearStopwatchLoop();
        stopwatchTimeStartedAt = Date.now() - stopwatchTime * 1000;
        set({ stopwatchRunning: true });
        stopwatchInterval = window.setInterval(() => {
          if (!get().stopwatchRunning) {
            clearStopwatchLoop();
            return;
          }
          const elapsed = Math.floor((Date.now() - stopwatchTimeStartedAt!) / 1000);
          if (elapsed !== get().stopwatchTime) {
            set({ stopwatchTime: elapsed });
          }
        }, 250);
      },

      pauseStopwatch: () => {
        clearStopwatchLoop();
        set({ stopwatchRunning: false });
      },

      resetStopwatch: () => {
        clearStopwatchLoop();
        set({ stopwatchRunning: false, stopwatchTime: 0, stopwatchLaps: [] });
      },

      lapStopwatch: () => {
        const { stopwatchTime, stopwatchLaps } = get();
        if (stopwatchTime === 0) return;
        const previousLapTime = stopwatchLaps.length > 0 ? stopwatchLaps[0].timestampSeconds : 0;
        const lapDuration = Math.max(0, stopwatchTime - previousLapTime);
        const newLap: StopwatchLap = {
          id: `lap-${Date.now()}`,
          lapNumber: stopwatchLaps.length + 1,
          timestampSeconds: stopwatchTime,
          lapDurationSeconds: lapDuration,
        };
        set({ stopwatchLaps: [newLap, ...stopwatchLaps] });
      },

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        set({ theme: next });
        applyTheme(next);
      },

      setLanguage: (lang) => set({ language: lang }),
      setUserTarget: (minutes) => set((state) => ({ user: { ...state.user, dailyTargetMinutes: minutes } })),
      updateUserProfile: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
      setZenMode: (zen) => set({ zenMode: zen }),
      
      setAmbientSound: (sound) => {
        soundSynth.play(sound);
        set({ ambientSound: sound });
      },

      setAmbientVolume: (vol) => {
        soundSynth.setVolume(vol);
        set({ ambientVolume: vol });
      },

      setTimerMode: (mode, durationMinutes) => {
        clearTimerLoop();
        let seconds = 25 * 60;
        if (durationMinutes) {
          seconds = durationMinutes * 60;
        } else {
          if (mode === 'pomodoro') seconds = 25 * 60;
          else if (mode === 'short_break') seconds = 5 * 60;
          else if (mode === 'long_break') seconds = 15 * 60;
          else if (mode === 'stopwatch') seconds = 0;
        }

        set({
          timer: {
            ...get().timer,
            mode,
            timeLeft: seconds,
            initialDuration: seconds,
            isRunning: false,
          },
        });
      },

      setTimerDuration: (seconds: number) => {
        clearTimerLoop();
        const validSeconds = Math.max(1, Math.min(24 * 3600, seconds));
        set({
          timer: {
            ...get().timer,
            mode: 'pomodoro',
            timeLeft: validSeconds,
            initialDuration: validSeconds,
            isRunning: false,
          },
        });
      },

      adjustTimerSeconds: (delta: number) => {
        const { timer } = get();
        if (timer.mode === 'stopwatch') return;
        const newTime = Math.max(1, Math.min(24 * 3600, timer.timeLeft + delta));
        if (timer.isRunning) {
          targetEndTime = Date.now() + newTime * 1000;
        }
        set({
          timer: {
            ...timer,
            timeLeft: newTime,
            initialDuration: Math.max(newTime, timer.initialDuration),
          },
        });
      },

      setActiveSubject: (subjectId, chapterId) => {
        set((state) => ({
          timer: {
            ...state.timer,
            activeSubjectId: subjectId,
            activeChapterId: chapterId,
          },
          user: {
            ...state.user,
            lastActiveSubjectId: subjectId,
          },
        }));
      },

      startTimer: () => {
        const { timer } = get();
        if (timer.isRunning) return;
        if (timer.mode !== 'stopwatch' && timer.timeLeft <= 0) return;

        clearTimerLoop();

        if (timer.mode === 'stopwatch') {
          stopwatchStartedAt = Date.now() - timer.timeLeft * 1000;
        } else {
          targetEndTime = Date.now() + timer.timeLeft * 1000;
        }

        set((state) => ({
          timer: {
            ...state.timer,
            isRunning: true,
            sessionStartedAt: state.timer.sessionStartedAt || Date.now(),
          },
        }));

        timerInterval = window.setInterval(() => {
          const current = get().timer;
          if (!current.isRunning) {
            clearTimerLoop();
            return;
          }

          if (current.mode === 'stopwatch') {
            if (stopwatchStartedAt == null) {
              stopwatchStartedAt = Date.now() - current.timeLeft * 1000;
            }
            const elapsed = Math.floor((Date.now() - stopwatchStartedAt) / 1000);
            if (elapsed !== current.timeLeft) {
              set({ timer: { ...current, timeLeft: elapsed } });
            }
          } else {
            if (targetEndTime == null) {
              targetEndTime = Date.now() + current.timeLeft * 1000;
            }
            const remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
            if (remaining <= 0) {
              clearTimerLoop();
              if (get().soundAlertOnFinish) {
                soundSynth.playChime();
                confetti({
                  particleCount: 80,
                  spread: 60,
                  origin: { y: 0.6 },
                });
              }
              if (get().autoStartNextRound) {
                set({
                  timer: {
                    ...current,
                    timeLeft: current.initialDuration,
                    isRunning: true,
                  },
                });
                get().startTimer();
              } else {
                set({
                  timer: {
                    ...current,
                    timeLeft: 0,
                    isRunning: false,
                  },
                });
              }
            } else if (remaining !== current.timeLeft) {
              set({
                timer: {
                  ...current,
                  timeLeft: remaining,
                },
              });
            }
          }
        }, 250);
      },

      pauseTimer: () => {
        const { timer } = get();
        if (targetEndTime && timer.mode !== 'stopwatch') {
          const remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));
          clearTimerLoop();
          set((state) => ({
            timer: {
              ...state.timer,
              timeLeft: remaining,
              isRunning: false,
            },
          }));
        } else {
          clearTimerLoop();
          set((state) => ({
            timer: {
              ...state.timer,
              isRunning: false,
            },
          }));
        }
      },

      resetTimer: () => {
        clearTimerLoop();
        const { timer } = get();
        set({
          timer: {
            ...timer,
            timeLeft: timer.initialDuration,
            isRunning: false,
          },
        });
      },

      tickTimer: () => {
        const { timer } = get();
        if (!timer.isRunning) return;

        if (timer.mode === 'stopwatch') {
          set({
            timer: {
              ...timer,
              timeLeft: timer.timeLeft + 1,
            },
          });
        } else {
          if (timer.timeLeft <= 1) {
            clearTimerLoop();
            soundSynth.playChime();
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
            set({
              timer: {
                ...timer,
                timeLeft: 0,
                isRunning: false,
              },
            });
          } else {
            set({
              timer: {
                ...timer,
                timeLeft: timer.timeLeft - 1,
              },
            });
          }
        }
      },

      logSession: (rating, notes) => {
        clearTimerLoop();
        const { timer, subjects, sessions, user } = get();
        const activeSub = subjects.find((s) => s.id === timer.activeSubjectId) || subjects[0];
        const activeChap = activeSub?.chapters.find((c) => c.id === timer.activeChapterId);

        let durationMins = 25;
        if (timer.mode === 'stopwatch') {
          durationMins = Math.max(1, Math.round(timer.timeLeft / 60));
        } else {
          const elapsedSecs = timer.initialDuration - timer.timeLeft;
          durationMins = Math.max(1, Math.round(elapsedSecs / 60));
        }

        const now = new Date();
        const newSession: StudySession = {
          id: `sess-${Date.now()}`,
          subjectId: activeSub?.id || 'general',
          subjectName: activeSub?.name || 'General Study',
          chapterId: activeChap?.id,
          chapterTitle: activeChap?.title,
          durationMinutes: durationMins,
          timestamp: now.toISOString(),
          dateString: now.toISOString().split('T')[0],
          hour: now.getHours(),
          focusRating: rating,
          notes: notes || '',
          mode: timer.mode === 'stopwatch' ? 'stopwatch' : 'pomodoro',
        };

        const todayStr = now.toISOString().split('T')[0];
        let streak = user.streakDays;
        if (user.lastStudiedDate !== todayStr) {
          streak += 1;
        }

        // Optimistic UI updates
        set({
          sessions: [newSession, ...sessions],
          user: {
            ...user,
            streakDays: streak,
            longestStreak: Math.max(streak, user.longestStreak),
            lastStudiedDate: todayStr,
            lastActiveSubjectId: activeSub?.id,
          },
          timer: {
            ...timer,
            timeLeft: timer.mode === 'pomodoro' ? 25 * 60 : 0,
            isRunning: false,
          },
        });

        // Trigger victory confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      },

      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: `task-${Date.now()}`,
          completed: false,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },

      toggleTask: (taskId) => {
        const { tasks } = get();
        const target = tasks.find((t) => t.id === taskId);
        const willBeCompleted = target ? !target.completed : false;

        if (willBeCompleted) {
          confetti({
            particleCount: 60,
            spread: 55,
            origin: { y: 0.7 },
          });
        }

        set({
          tasks: tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : undefined,
                }
              : t
          ),
        });
      },

      deleteTask: (taskId) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
      },

      addSubject: (name, color, icon, examDate) => {
        const newSubject: Subject = {
          id: `sub-${Date.now()}`,
          name,
          color,
          icon,
          examDate,
          chapters: [],
        };
        set((state) => ({ subjects: [...state.subjects, newSubject] }));
      },

      addChapter: (subjectId, title) => {
        const newChapter = {
          id: `ch-${Date.now()}`,
          subjectId,
          title,
          topics: [],
        };
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId ? { ...s, chapters: [...s.chapters, newChapter] } : s
          ),
        }));
      },

      addTopic: (subjectId, chapterId, name) => {
        const newTopic = {
          id: `top-${Date.now()}`,
          name,
          status: 'pending' as TopicStatus,
          confidence: 'medium' as RevisionConfidence,
        };
        set((state) => ({
          subjects: state.subjects.map((s) => {
            if (s.id !== subjectId) return s;
            return {
              ...s,
              chapters: s.chapters.map((c) => {
                if (c.id !== chapterId) return c;
                return { ...c, topics: [...c.topics, newTopic] };
              }),
            };
          }),
        }));
      },

      toggleTopicStatus: (subjectId, chapterId, topicId) => {
        set((state) => ({
          subjects: state.subjects.map((s) => {
            if (s.id !== subjectId) return s;
            return {
              ...s,
              chapters: s.chapters.map((c) => {
                if (c.id !== chapterId) return c;
                return {
                  ...c,
                  topics: c.topics.map((top) => {
                    if (top.id !== topicId) return top;
                    const nextStatus: TopicStatus =
                      top.status === 'pending'
                        ? 'in_progress'
                        : top.status === 'in_progress'
                        ? 'completed'
                        : 'pending';
                    return { ...top, status: nextStatus };
                  }),
                };
              }),
            };
          }),
        }));
      },

      setTopicConfidence: (subjectId, chapterId, topicId, confidence) => {
        set((state) => ({
          subjects: state.subjects.map((s) => {
            if (s.id !== subjectId) return s;
            return {
              ...s,
              chapters: s.chapters.map((c) => {
                if (c.id !== chapterId) return c;
                return {
                  ...c,
                  topics: c.topics.map((top) => (top.id === topicId ? { ...top, confidence } : top)),
                };
              }),
            };
          }),
        }));
      },

      updateChapterNotes: (subjectId, chapterId, notes, formulas) => {
        set((state) => ({
          subjects: state.subjects.map((s) => {
            if (s.id !== subjectId) return s;
            return {
              ...s,
              chapters: s.chapters.map((c) => {
                if (c.id !== chapterId) return c;
                return { ...c, notes, formulas: formulas !== undefined ? formulas : c.formulas };
              }),
            };
          }),
        }));
      },

      addDistraction: (text) => {
        if (!text.trim()) return;
        const newNote: DistractionNote = {
          id: `dist-${Date.now()}`,
          text: text.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        set((state) => ({ distractionNotes: [newNote, ...state.distractionNotes] }));
      },

      deleteDistraction: (id) => {
        set((state) => ({ distractionNotes: state.distractionNotes.filter((n) => n.id !== id) }));
      },

      convertDistractionToTask: (distractionId, subjectId) => {
        const { distractionNotes, subjects } = get();
        const note = distractionNotes.find((n) => n.id === distractionId);
        if (!note) return;

        const defaultSub = subjectId || subjects[0]?.id || 'sub-general';
        get().addTask({
          title: note.text,
          subjectId: defaultSub,
          priority: 'med',
          dueDate: new Date().toISOString().split('T')[0],
          estimatedPomodoros: 1,
        });

        get().deleteDistraction(distractionId);
      },

      addExamCountdown: (title, subjectId, examDate) => {
        const newExam: ExamCountdown = {
          id: `exam-${Date.now()}`,
          title,
          subjectId,
          examDate,
        };
        set((state) => ({ examCountdowns: [...state.examCountdowns, newExam] }));
      },

      deleteExamCountdown: (id) => {
        set((state) => ({ examCountdowns: state.examCountdowns.filter((e) => e.id !== id) }));
      },

      setSupabaseConfig: (url, key) => {
        set({
          supabaseUrl: url,
          supabaseAnonKey: key,
          isCloudSynced: Boolean(url && key),
        });
      },

      // Social / Friends Network Actions
      sendFriendRequest: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        if (!cleanCode) {
          return { success: false, message: 'Please enter a valid student code.' };
        }
        const { user, friends } = get();
        if (cleanCode === (user.friendCode || 'A9X4K').toUpperCase()) {
          return { success: false, message: 'You cannot connect with your own student code!' };
        }

        const acceptedCount = friends.filter((f) => f.status === 'accepted').length;
        if (acceptedCount >= 51) {
          return { success: false, message: 'Friend limit reached (max 51 friends allowed).' };
        }

        const existing = friends.find((f) => f.code.toUpperCase() === cleanCode);
        if (existing) {
          if (existing.status === 'accepted') {
            return { success: false, message: `${existing.name} is already in your study circle!` };
          }
          if (existing.status === 'outgoing_request') {
            return { success: false, message: `Request already pending for ${existing.name}.` };
          }
          if (existing.status === 'incoming_request') {
            get().acceptFriendRequest(cleanCode);
            return { success: true, message: `Accepted incoming request from ${existing.name}!`, friend: existing };
          }
          const updated = friends.map((f) =>
            f.code.toUpperCase() === cleanCode
              ? { ...f, status: 'outgoing_request' as const, requestedAt: new Date().toISOString() }
              : f
          );
          set({ friends: updated });
          return { success: true, message: `Friend request sent to ${existing.name}!`, friend: existing };
        }

        // Code not in known list - dynamically generate student profile so any valid 4-5 code works
        const newFriend: FriendProfile = {
          code: cleanCode,
          name: `Student ${cleanCode}`,
          avatar: cleanCode.charAt(0),
          bio: '',
          streakDays: Math.floor(Math.random() * 15) + 3,
          dailyTargetMinutes: 300,
          todayStudyMinutes: 180,
          lastActive: 'Just now',
          status: 'outgoing_request',
          requestedAt: new Date().toISOString(),
          studyLogs: [
            {
              date: new Date().toISOString().split('T')[0],
              studyHours: 4.0,
              attendedClass: true,
              pyqsSolved: 20,
              revisionDone: true,
              mockTestTaken: false,
              sleepHours: 7.5,
              focusRating: 4,
              notes: 'Active study sprint and problem solving.',
            },
            {
              date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
              studyHours: 3.5,
              attendedClass: true,
              pyqsSolved: 15,
              revisionDone: true,
              mockTestTaken: false,
              sleepHours: 7.0,
              focusRating: 4,
              notes: 'Topic review and question bank practice.',
            },
          ],
          comments: [],
        };
        set({ friends: [newFriend, ...friends] });
        return { success: true, message: `Friend request sent to Student ${cleanCode}!`, friend: newFriend };
      },

      acceptFriendRequest: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        const { friends } = get();
        const acceptedCount = friends.filter((f) => f.status === 'accepted').length;
        if (acceptedCount >= 51) {
          alert('Friend limit reached (max 51 friends allowed).');
          return;
        }
        set((state) => ({
          friends: state.friends.map((f) =>
            f.code.toUpperCase() === cleanCode
              ? { ...f, status: 'accepted' as const }
              : f
          ),
        }));
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      },

      declineFriendRequest: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        set((state) => ({
          friends: state.friends.map((f) =>
            f.code.toUpperCase() === cleanCode
              ? { ...f, status: 'none' as const }
              : f
          ),
        }));
      },

      cancelFriendRequest: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        set((state) => ({
          friends: state.friends.map((f) =>
            f.code.toUpperCase() === cleanCode
              ? { ...f, status: 'none' as const }
              : f
          ),
        }));
      },

      removeFriend: (code: string) => {
        const cleanCode = code.trim().toUpperCase();
        set((state) => ({
          friends: state.friends.map((f) =>
            f.code.toUpperCase() === cleanCode
              ? { ...f, status: 'none' as const }
              : f
          ),
        }));
      },

      addFriendComment: (friendCode: string, text: string) => {
        const cleanCode = friendCode.trim().toUpperCase();
        const cleanText = text.trim();
        if (!cleanText) return;
        const { user } = get();

        const newComment: FriendComment = {
          id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          authorCode: user.friendCode || 'A9X4K',
          authorName: user.name || 'Alex',
          text: cleanText,
          timestamp: new Date().toISOString(),
          reactions: ['🔥'],
        };

        set((state) => ({
          friends: state.friends.map((f) =>
            f.code.toUpperCase() === cleanCode
              ? { ...f, comments: [newComment, ...f.comments] }
              : f
          ),
        }));
      },

      deleteFriendComment: (friendCode: string, commentId: string) => {
        const cleanCode = friendCode.trim().toUpperCase();
        set((state) => ({
          friends: state.friends.map((f) =>
            f.code.toUpperCase() === cleanCode
              ? { ...f, comments: f.comments.filter((c) => c.id !== commentId) }
              : f
          ),
        }));
      },

      generateNewFriendCode: () => {
        const newCode = generateStudentCode();
        set((state) => ({
          user: {
            ...state.user,
            friendCode: newCode,
          },
        }));
        return newCode;
      },

      updateProfileMetricSlot: (slotIndex: 0 | 1 | 2, metricKey: string) => {
        set((state) => {
          const currentSlots = state.user.profileMetricSlots || ['currentStreak', 'bestStreak', 'daysLogged'];
          const newSlots: [string, string, string] = [currentSlots[0], currentSlots[1], currentSlots[2]];
          newSlots[slotIndex] = metricKey;
          return {
            user: {
              ...state.user,
              profileMetricSlots: newSlots,
            },
          };
        });
      },

      setCustomWordmarkText: (text: string) => {
        const trimmed = text.trim().slice(0, 12);
        set((state) => ({
          user: {
            ...state.user,
            customWordmarkText: trimmed ? trimmed : 'studyo',
          },
        }));
      },

      resetToDefaults: () => {
        set({
          subjects: INITIAL_SUBJECTS,
          sessions: generateSeedSessions(),
          tasks: INITIAL_TASKS,
          dailyLogs: ensureDailyLogsDateWise(INITIAL_DAILY_LOGS),
          customColumns: INITIAL_CUSTOM_COLUMNS,
          customTables: INITIAL_CUSTOM_TABLES,
          activeTableId: 'main',
          friends: INITIAL_FRIENDS,
          stopwatchLaps: [
            { id: 'lap-1', lapNumber: 1, timestampSeconds: 1500, lapDurationSeconds: 1500 },
            { id: 'lap-2', lapNumber: 2, timestampSeconds: 3300, lapDurationSeconds: 1800 },
          ],
        });
      },

      loadDemoData: () => {
        set({
          dailyLogs: ensureDailyLogsDateWise(INITIAL_DAILY_LOGS),
          customColumns: INITIAL_CUSTOM_COLUMNS,
          customTables: INITIAL_CUSTOM_TABLES,
          activeTableId: 'main',
          tasks: INITIAL_TASKS,
          sessions: generateSeedSessions(),
          friends: INITIAL_FRIENDS,
          stopwatchLaps: [
            { id: 'lap-1', lapNumber: 1, timestampSeconds: 1500, lapDurationSeconds: 1500 },
            { id: 'lap-2', lapNumber: 2, timestampSeconds: 3300, lapDurationSeconds: 1800 },
          ],
        });
      },
    }),
    {
      name: 'studypulse_storage_v2',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        user: state.user,
        subjects: state.subjects,
        sessions: state.sessions,
        tasks: state.tasks,
        examCountdowns: state.examCountdowns,
        distractionNotes: state.distractionNotes,
        ambientVolume: state.ambientVolume,
        supabaseUrl: state.supabaseUrl,
        supabaseAnonKey: state.supabaseAnonKey,
        isCloudSynced: state.isCloudSynced,
        dailyLogs: state.dailyLogs,
        customColumns: state.customColumns,
        customTables: state.customTables,
        activeTableId: state.activeTableId,
        autoStartNextRound: state.autoStartNextRound,
        soundAlertOnFinish: state.soundAlertOnFinish,
        enableQuickScratchpad: state.enableQuickScratchpad,
        showFinishButton: state.showFinishButton,
        friends: state.friends,
      }),
      merge: (persistedState, currentState) => {
        const persisted = (persistedState as Partial<StudyState>) || {};
        const persistedLogs = Array.isArray(persisted.dailyLogs) ? persisted.dailyLogs : [];
        const mergedMap = new Map<string, DailyLogEntry>();
        INITIAL_DAILY_LOGS.forEach(log => mergedMap.set(log.date, log));
        persistedLogs.forEach(log => mergedMap.set(log.date, log));
        const mergedLogs = ensureDailyLogsDateWise(Array.from(mergedMap.values()));

        // Ensure user has friendCode, profileMetricSlots and customWordmarkText
        const mergedUser = {
          ...currentState.user,
          ...(persisted.user || {}),
          friendCode: persisted.user?.friendCode || currentState.user.friendCode || 'A9X4K',
          profileMetricSlots: persisted.user?.profileMetricSlots || currentState.user.profileMetricSlots || ['currentStreak', 'bestStreak', 'daysLogged'],
          customWordmarkText: persisted.user?.customWordmarkText || currentState.user.customWordmarkText || 'studyo',
        };

        // Merge friends: preserve user state, ensure seed friends are present
        const persistedFriends = Array.isArray(persisted.friends) ? persisted.friends : [];
        const friendsMap = new Map<string, FriendProfile>();
        INITIAL_FRIENDS.forEach(f => friendsMap.set(f.code.toUpperCase(), f));
        persistedFriends.forEach(f => friendsMap.set(f.code.toUpperCase(), f));
        const mergedFriends = Array.from(friendsMap.values()).map(f => {
          if (f.code.toUpperCase() === 'E7K92' && f.bio && f.bio.includes('Physics Olympiad')) {
            return { ...f, bio: '' };
          }
          return f;
        });

        const resolvedTheme: ThemeMode = persisted.theme === 'light' ? 'light' : 'dark';
        applyTheme(resolvedTheme);

        return {
          ...currentState,
          ...persisted,
          theme: resolvedTheme,
          user: mergedUser,
          friends: mergedFriends,
          enableQuickScratchpad: persisted.enableQuickScratchpad ?? false,
          showFinishButton: persisted.showFinishButton ?? true,
          dailyLogs: mergedLogs,
          customColumns: Array.isArray(persisted.customColumns) && persisted.customColumns.length > 0
            ? persisted.customColumns
            : INITIAL_CUSTOM_COLUMNS,
          customTables: Array.isArray(persisted.customTables) && persisted.customTables.length > 0
            ? persisted.customTables
            : INITIAL_CUSTOM_TABLES,
          activeTableId: persisted.activeTableId || 'main',
        };
      },
    }
  )
);

// Initial browser rehydration sync
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('studypulse_storage_v2');
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.state?.theme) {
        applyTheme(data.state.theme);
      }
    }
  } catch {
    // fallback
  }
}

