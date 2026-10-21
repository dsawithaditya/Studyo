import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import confetti from 'canvas-confetti';
import { 
  Language, 
  Subject, 
  Chapter,
  Topic,
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
import { useAuthStore } from './useAuthStore';
import {
  fetchUserDataFromSupabase,
  dbSaveSubject,
  dbDeleteSubject,
  dbSaveStudySession,
  dbSaveTask,
  dbDeleteTask,
  dbSaveDailyLog,
  dbDeleteDailyLog,
  dbSaveExamCountdown,
  dbDeleteExamCountdown,
  dbUpdateProfile,
  dbSaveCustomTable,
  dbDeleteCustomTable,
  dbSaveCustomColumns,
  uploadAllUserDataToSupabase,
  dbClearAllDailyLogs,
  dbSaveTableConfig,
  resetSupabaseClient,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY
} from '../services/supabaseClient';

const getCurrentUserId = () => {
  return useAuthStore.getState().currentUser?.id || null;
};

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
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Daily Study Log Module
  dailyLogs: DailyLogEntry[];
  ensureTodayDailyLog: () => void;
  addOrUpdateDailyLog: (entry: DailyLogEntry) => void;
  updateDailyLogField: <K extends keyof DailyLogEntry>(date: string, field: K, value: DailyLogEntry[K]) => void;
  deleteDailyLog: (date: string) => void;

  // Default Table Deletion & Column Customization
  deletedDefaultColumns: string[];
  isDefaultTableDeleted: boolean;
  deleteDefaultColumn: (colKey: string) => void;
  restoreDefaultColumn: (colKey: string) => void;
  resetDefaultColumns: () => void;
  deleteDefaultTable: () => void;
  restoreDefaultTable: () => void;


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
  deleteSubject: (subjectId: string) => void;
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
  syncUserData: (forcedUserId?: string) => Promise<void>;
  loadUserData: (userId: string) => Promise<void>;
  clearUserData: () => void;
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

export const DEMO_SUBJECT_IDS = new Set(['sub-math', 'sub-phys', 'sub-chem', 'sub-cs']);
export const DEMO_TASK_IDS = new Set(['task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7']);
export const DEMO_FRIEND_CODES = new Set(['D4M8X', 'E7K92', 'S3W5Y', 'R8P2T']);

function generateSeedSessions(): StudySession[] {
  return [];
}

export const INITIAL_SUBJECTS: Subject[] = [];
export const INITIAL_CUSTOM_COLUMNS: CustomColumn[] = [];
export const INITIAL_CUSTOM_TABLES: CustomStudyTable[] = [];
export const INITIAL_TASKS: Task[] = [];

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

export const INITIAL_DAILY_LOGS: DailyLogEntry[] = [];

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

export const INITIAL_FRIENDS: FriendProfile[] = [];

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

/**
 * Intelligent Multi-Device Merge Engine
 * Strictly follows the rules specified for two-way synchronization:
 * - Study Hours: Takes higher number (Math.max) or whichever was filled
 * - Checkboxes (attendedClass, revisionDone, mockTestTaken): OR Logic (true always wins)
 * - PYQs Solved: Takes higher count (Math.max) or non-null
 * - Sleep Hours: Non-null / filled value wins (or Math.max if both entered)
 * - Focus Rating: Takes non-null / higher rating (Math.max)
 * - Notes: Combines both notes ("Note 1 | Note 2" unless duplicate or empty)
 * - Custom Columns: Deep object merge with intelligent scalar merging
 */
export function mergeDailyLogEntryPair(
  remote: DailyLogEntry,
  local: DailyLogEntry
): DailyLogEntry {
  // 1. Study Hours (studyHours): Takes higher number (Math.max) or whichever was filled
  const rStudy = remote.studyHours != null ? Number(remote.studyHours) : null;
  const lStudy = local.studyHours != null ? Number(local.studyHours) : null;
  let studyHours: number | null | undefined = null;
  if (rStudy != null && lStudy != null) {
    studyHours = Math.max(rStudy, lStudy);
  } else if (rStudy != null) {
    studyHours = rStudy;
  } else if (lStudy != null) {
    studyHours = lStudy;
  }

  // 2. Checkboxes (attendedClass, revisionDone, mockTestTaken): OR Logic (true always wins)
  const attendedClass = Boolean(remote.attendedClass || local.attendedClass);
  const revisionDone = Boolean(remote.revisionDone || local.revisionDone);
  const mockTestTaken = Boolean(remote.mockTestTaken || local.mockTestTaken);

  // 3. PYQs Solved (pyqsSolved): Takes higher count (Math.max) or non-null
  const rPyqs = remote.pyqsSolved != null ? Number(remote.pyqsSolved) : null;
  const lPyqs = local.pyqsSolved != null ? Number(local.pyqsSolved) : null;
  let pyqsSolved: number | null | undefined = null;
  if (rPyqs != null && lPyqs != null) {
    pyqsSolved = Math.max(rPyqs, lPyqs);
  } else if (rPyqs != null) {
    pyqsSolved = rPyqs;
  } else if (lPyqs != null) {
    pyqsSolved = lPyqs;
  }

  // 4. Sleep Hours (sleepHours): Non-null / filled value wins
  const rSleep = remote.sleepHours != null ? Number(remote.sleepHours) : null;
  const lSleep = local.sleepHours != null ? Number(local.sleepHours) : null;
  let sleepHours: number | null | undefined = null;
  if (rSleep != null && lSleep != null) {
    sleepHours = Math.max(rSleep, lSleep);
  } else if (rSleep != null) {
    sleepHours = rSleep;
  } else if (lSleep != null) {
    sleepHours = lSleep;
  }

  // 5. Focus Rating (focusRating 1–5): Takes non-null / higher rating
  const rFocus = remote.focusRating != null ? Number(remote.focusRating) : null;
  const lFocus = local.focusRating != null ? Number(local.focusRating) : null;
  let focusRating: number | null | undefined = null;
  if (rFocus != null && lFocus != null) {
    focusRating = Math.max(rFocus, lFocus);
  } else if (rFocus != null) {
    focusRating = rFocus;
  } else if (lFocus != null) {
    focusRating = lFocus;
  }

  // 6. Notes (notes): Combines both notes ("Note 1 | Note 2")
  const rNotes = (remote.notes || '').trim();
  const lNotes = (local.notes || '').trim();
  let notes = '';
  if (rNotes && lNotes) {
    if (rNotes === lNotes) {
      notes = rNotes;
    } else if (rNotes.includes(lNotes)) {
      notes = rNotes;
    } else if (lNotes.includes(rNotes)) {
      notes = lNotes;
    } else {
      notes = `${rNotes} | ${lNotes}`;
    }
  } else {
    notes = rNotes || lNotes || '';
  }

  // 7. Custom Columns (customData): Deep Object Merge ({ ...device1, ...device2 })
  const rCustom = remote.customData || {};
  const lCustom = local.customData || {};
  const mergedCustomData: Record<string, any> = { ...rCustom, ...lCustom };

  const allKeys = new Set([...Object.keys(rCustom), ...Object.keys(lCustom)]);
  allKeys.forEach((key) => {
    const rVal = rCustom[key];
    const lVal = lCustom[key];
    if (rVal !== undefined && lVal !== undefined) {
      if (typeof rVal === 'number' && typeof lVal === 'number') {
        mergedCustomData[key] = Math.max(rVal, lVal);
      } else if (typeof rVal === 'boolean' || typeof lVal === 'boolean') {
        mergedCustomData[key] = Boolean(rVal || lVal);
      } else if (typeof rVal === 'string' && typeof lVal === 'string') {
        const rTrim = rVal.trim();
        const lTrim = lVal.trim();
        if (rTrim && lTrim) {
          mergedCustomData[key] =
            rTrim === lTrim
              ? rTrim
              : rTrim.includes(lTrim)
              ? rTrim
              : lTrim.includes(rTrim)
              ? lTrim
              : `${rTrim} | ${lTrim}`;
        } else {
          mergedCustomData[key] = rTrim || lTrim;
        }
      } else if (rVal != null && lVal == null) {
        mergedCustomData[key] = rVal;
      } else if (lVal != null && rVal == null) {
        mergedCustomData[key] = lVal;
      }
    }
  });

  return {
    date: remote.date || local.date,
    studyHours,
    attendedClass,
    pyqsSolved,
    revisionDone,
    mockTestTaken,
    sleepHours,
    focusRating,
    notes,
    customData: mergedCustomData,
  };
}

export function mergeDailyLogsList(
  remoteLogs: DailyLogEntry[] = [],
  localLogs: DailyLogEntry[] = []
): { mergedLogs: DailyLogEntry[]; logsToUpload: DailyLogEntry[] } {
  const remoteMap = new Map<string, DailyLogEntry>();
  remoteLogs.forEach((l) => {
    if (l.date) remoteMap.set(l.date, l);
  });

  const localMap = new Map<string, DailyLogEntry>();
  localLogs.forEach((l) => {
    if (l.date) localMap.set(l.date, l);
  });

  const allDates = Array.from(new Set([...remoteMap.keys(), ...localMap.keys()])).sort();
  const mergedLogs: DailyLogEntry[] = [];
  const logsToUpload: DailyLogEntry[] = [];

  allDates.forEach((date) => {
    const r = remoteMap.get(date);
    const l = localMap.get(date);

    if (r && l) {
      const merged = mergeDailyLogEntryPair(r, l);
      mergedLogs.push(merged);
      if (JSON.stringify(merged) !== JSON.stringify(r)) {
        logsToUpload.push(merged);
      }
    } else if (l && !r) {
      mergedLogs.push(l);
      logsToUpload.push(l);
    } else if (r) {
      mergedLogs.push(r);
    }
  });

  return { mergedLogs, logsToUpload };
}

export function mergeCustomTableRowPair(
  remote: CustomTableRow,
  local: CustomTableRow
): CustomTableRow {
  // Deep cell merge (values: { ...remote, ...local })
  const rValues = remote.values || {};
  const lValues = local.values || {};
  const mergedValues: Record<string, any> = { ...rValues, ...lValues };

  const allKeys = new Set([...Object.keys(rValues), ...Object.keys(lValues)]);
  allKeys.forEach((key) => {
    const rVal = rValues[key];
    const lVal = lValues[key];
    if (rVal !== undefined && lVal !== undefined) {
      if (typeof rVal === 'number' && typeof lVal === 'number') {
        mergedValues[key] = Math.max(rVal, lVal);
      } else if (typeof rVal === 'boolean' || typeof lVal === 'boolean') {
        mergedValues[key] = Boolean(rVal || lVal);
      } else if (typeof rVal === 'string' && typeof lVal === 'string') {
        const rTrim = rVal.trim();
        const lTrim = lVal.trim();
        if (rTrim && lTrim) {
          mergedValues[key] =
            rTrim === lTrim
              ? rTrim
              : rTrim.includes(lTrim)
              ? rTrim
              : lTrim.includes(rTrim)
              ? lTrim
              : `${rTrim} | ${lTrim}`;
        } else {
          mergedValues[key] = rTrim || lTrim;
        }
      } else if (rVal != null && lVal == null) {
        mergedValues[key] = rVal;
      } else if (lVal != null && rVal == null) {
        mergedValues[key] = lVal;
      }
    }
  });

  const rNotes = (remote.notes || '').trim();
  const lNotes = (local.notes || '').trim();
  let notes = '';
  if (rNotes && lNotes) {
    notes = rNotes === lNotes ? rNotes : `${rNotes} | ${lNotes}`;
  } else {
    notes = rNotes || lNotes || '';
  }

  return {
    id: remote.id || local.id,
    date: remote.date || local.date,
    values: mergedValues,
    notes,
    createdAt: remote.createdAt || local.createdAt || new Date().toISOString(),
  };
}

export function mergeCustomTablesList(
  remoteTables: CustomStudyTable[] = [],
  localTables: CustomStudyTable[] = []
): { mergedTables: CustomStudyTable[]; tablesNeedUpload: boolean } {
  const tableMap = new Map<string, CustomStudyTable>();
  remoteTables.forEach((t) => tableMap.set(t.id, t));

  let tablesNeedUpload = false;

  localTables.forEach((localT) => {
    if (!tableMap.has(localT.id)) {
      // Different Table: Unions both tables by ID
      tableMap.set(localT.id, localT);
      tablesNeedUpload = true;
    } else {
      const remoteT = tableMap.get(localT.id)!;

      // 1. Merge column definitions (Different Columns: Merges column definitions)
      const colMap = new Map<string, CustomTableColumn>();
      (remoteT.columns || []).forEach((c) => colMap.set(c.id, c));
      let colsChanged = false;
      (localT.columns || []).forEach((c) => {
        if (!colMap.has(c.id)) {
          colMap.set(c.id, c);
          colsChanged = true;
        }
      });
      const mergedColumns = Array.from(colMap.values());

      // 2. Merge rows: Unions rows by row ID & date
      const remoteRows = remoteT.rows || [];
      const localRows = localT.rows || [];
      const mergedRows: CustomTableRow[] = [];
      const matchedLocalRowIndices = new Set<number>();
      let rowsChanged = false;

      remoteRows.forEach((rRow) => {
        let matchIdx = localRows.findIndex(
          (lRow, idx) => !matchedLocalRowIndices.has(idx) && lRow.id === rRow.id
        );
        if (matchIdx === -1 && rRow.date) {
          matchIdx = localRows.findIndex(
            (lRow, idx) => !matchedLocalRowIndices.has(idx) && lRow.date === rRow.date
          );
        }

        if (matchIdx !== -1) {
          matchedLocalRowIndices.add(matchIdx);
          const lRow = localRows[matchIdx];
          const mergedRow = mergeCustomTableRowPair(rRow, lRow);
          mergedRows.push(mergedRow);
          if (JSON.stringify(mergedRow) !== JSON.stringify(rRow)) {
            rowsChanged = true;
          }
        } else {
          mergedRows.push(rRow);
        }
      });

      localRows.forEach((lRow, idx) => {
        if (!matchedLocalRowIndices.has(idx)) {
          mergedRows.push(lRow);
          rowsChanged = true;
        }
      });

      if (colsChanged || rowsChanged) {
        const updatedTable: CustomStudyTable = {
          ...remoteT,
          columns: mergedColumns,
          rows: mergedRows,
        };
        tableMap.set(localT.id, updatedTable);
        tablesNeedUpload = true;
      }
    }
  });

  return {
    mergedTables: Array.from(tableMap.values()),
    tablesNeedUpload,
  };
}


let pendingSyncUid: string | null = null;

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      language: 'en',
      user: {
        name: 'Student',
        streakDays: 0,
        longestStreak: 0,
        lastStudiedDate: '',
        lastActiveSubjectId: '',
        friendCode: generateStudentCode(),
        profileMetricSlots: ['currentStreak', 'bestStreak', 'daysLogged'],
        customWordmarkText: 'studyo',
      },
      friends: [],
      subjects: [],
      sessions: [],
      tasks: [],
      dailyLogs: ensureDailyLogsDateWise([]),
      deletedDefaultColumns: [],
      isDefaultTableDeleted: false,
      customColumns: [],
      customTables: [],
      activeTableId: 'main',
      autoStartNextRound: false,
      soundAlertOnFinish: true,
      enableQuickScratchpad: false,
      showFinishButton: true,
      stopwatchTime: 0,
      stopwatchRunning: false,
      stopwatchLaps: [],
      examCountdowns: [],
      distractionNotes: [],
      timer: {
        mode: 'pomodoro',
        timeLeft: 25 * 60,
        initialDuration: 25 * 60,
        isRunning: false,
        activeSubjectId: '',
        activeChapterId: undefined,
      },
      zenMode: false,
      ambientSound: 'off',
      ambientVolume: 0.5,
      supabaseUrl: DEFAULT_SUPABASE_URL,
      supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
      isCloudSynced: true,
      isSyncing: false,
      lastSyncedAt: null,

      // Default Table Column Customization & Table Deletion Actions
      deleteDefaultColumn: (colKey) => {
        set((state) => ({
          deletedDefaultColumns: Array.from(new Set([...(state.deletedDefaultColumns || []), colKey])),
        }));
        const uid = getCurrentUserId();
        if (uid) {
          dbSaveTableConfig(uid, {
            deletedDefaultColumns: get().deletedDefaultColumns,
            isDefaultTableDeleted: get().isDefaultTableDeleted,
          });
        }
      },

      restoreDefaultColumn: (colKey) => {
        set((state) => ({
          deletedDefaultColumns: (state.deletedDefaultColumns || []).filter((k) => k !== colKey),
        }));
        const uid = getCurrentUserId();
        if (uid) {
          dbSaveTableConfig(uid, {
            deletedDefaultColumns: get().deletedDefaultColumns,
            isDefaultTableDeleted: get().isDefaultTableDeleted,
          });
        }
      },

      resetDefaultColumns: () => {
        set({ deletedDefaultColumns: [] });
        const uid = getCurrentUserId();
        if (uid) {
          dbSaveTableConfig(uid, {
            deletedDefaultColumns: [],
            isDefaultTableDeleted: get().isDefaultTableDeleted,
          });
        }
      },

      deleteDefaultTable: () => {
        const { customTables } = get();
        const nextActive = customTables.length > 0 ? customTables[0].id : 'main';
        set({
          isDefaultTableDeleted: true,
          dailyLogs: [],
          activeTableId: nextActive,
        });
        const uid = getCurrentUserId();
        if (uid) {
          dbClearAllDailyLogs(uid);
          dbSaveTableConfig(uid, {
            deletedDefaultColumns: get().deletedDefaultColumns,
            isDefaultTableDeleted: true,
          });
        }
      },

      restoreDefaultTable: () => {
        const todayStr = getLocalTodayDateString();
        set({
          isDefaultTableDeleted: false,
          dailyLogs: [createDefaultDailyLog(todayStr)],
          activeTableId: 'main',
        });
        const uid = getCurrentUserId();
        if (uid) {
          dbSaveDailyLog(uid, createDefaultDailyLog(todayStr));
          dbSaveTableConfig(uid, {
            deletedDefaultColumns: get().deletedDefaultColumns,
            isDefaultTableDeleted: false,
          });
        }
      },


      // Daily Study Log Actions
      ensureTodayDailyLog: () => {
        set((state) => ({
          dailyLogs: state.isDefaultTableDeleted ? [] : ensureDailyLogsDateWise(state.dailyLogs),
        }));
      },

      addOrUpdateDailyLog: (entry) => {
        set((state) => {
          const logs = Array.isArray(state.dailyLogs) ? state.dailyLogs : [];
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
        const uid = getCurrentUserId();
        if (uid) dbSaveDailyLog(uid, entry);
      },

      updateDailyLogField: (date, field, value) => {
        set((state) => {
          const logs = Array.isArray(state.dailyLogs) ? state.dailyLogs : [];
          const updated = logs.map((l) => {
            if (l.date === date) {
              return { ...l, [field]: value };
            }
            return l;
          });
          return { dailyLogs: updated };
        });
        const uid = getCurrentUserId();
        const updated = get().dailyLogs.find((l) => l.date === date);
        if (uid && updated) dbSaveDailyLog(uid, updated);
      },

      deleteDailyLog: (date) => {
        set((state) => {
          const logs = Array.isArray(state.dailyLogs) ? state.dailyLogs : [];
          return { dailyLogs: logs.filter((l) => l.date !== date) };
        });
        const uid = getCurrentUserId();
        if (uid) dbDeleteDailyLog(uid, date);
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
        const uid = getCurrentUserId();
        if (uid) dbSaveCustomColumns(uid, get().customColumns);
      },
      updateCustomColumn: (id, updates) => {
        set((state) => ({
          customColumns: (state.customColumns || []).map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
        const uid = getCurrentUserId();
        if (uid) dbSaveCustomColumns(uid, get().customColumns);
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
        const uid = getCurrentUserId();
        if (uid) dbSaveCustomColumns(uid, get().customColumns);
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
        const uid = getCurrentUserId();
        if (uid) dbSaveCustomColumns(uid, get().customColumns);
      },
      updateDailyLogCustomField: (date, columnId, value) => {
        set((state) => {
          const logs = Array.isArray(state.dailyLogs) ? state.dailyLogs : [];
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
        const uid = getCurrentUserId();
        const updated = get().dailyLogs.find((l) => l.date === date);
        if (uid && updated) dbSaveDailyLog(uid, updated);
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
        const uid = getCurrentUserId();
        if (uid) dbSaveCustomTable(uid, newTable, get().customTables);
        return newId;
      },

      updateCustomTable: (tableId, updates) => {
        set((state) => ({
          customTables: (state.customTables || []).map((t) =>
            t.id === tableId ? { ...t, ...updates } : t
          ),
        }));
        const uid = getCurrentUserId();
        const target = get().customTables.find((t) => t.id === tableId);
        if (uid && target) dbSaveCustomTable(uid, target, get().customTables);
      },

      deleteCustomTable: (tableId) => {
        set((state) => ({
          customTables: (state.customTables || []).filter((t) => t.id !== tableId),
          activeTableId: state.activeTableId === tableId ? 'main' : state.activeTableId,
        }));
        const uid = getCurrentUserId();
        if (uid) dbDeleteCustomTable(uid, tableId, get().customTables);
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
        const uid = getCurrentUserId();
        const target = get().customTables.find((t) => t.id === tableId);
        if (uid && target) dbSaveCustomTable(uid, target, get().customTables);
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
        const uid = getCurrentUserId();
        const target = get().customTables.find((t) => t.id === tableId);
        if (uid && target) dbSaveCustomTable(uid, target, get().customTables);
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
        const uid = getCurrentUserId();
        const target = get().customTables.find((t) => t.id === tableId);
        if (uid && target) dbSaveCustomTable(uid, target, get().customTables);
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
        const uid = getCurrentUserId();
        const target = get().customTables.find((t) => t.id === tableId);
        if (uid && target) dbSaveCustomTable(uid, target, get().customTables);
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
        const uid = getCurrentUserId();
        const target = get().customTables.find((t) => t.id === tableId);
        if (uid && target) dbSaveCustomTable(uid, target, get().customTables);
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
        const uid = getCurrentUserId();
        const target = get().customTables.find((t) => t.id === tableId);
        if (uid && target) dbSaveCustomTable(uid, target, get().customTables);
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
        const uid = getCurrentUserId();
        const target = get().customTables.find((t) => t.id === tableId);
        if (uid && target) dbSaveCustomTable(uid, target, get().customTables);
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
        const uid = getCurrentUserId();
        const target = get().customTables.find((t) => t.id === tableId);
        if (uid && target) dbSaveCustomTable(uid, target, get().customTables);
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
      setUserTarget: (minutes) => {
        set((state) => ({ user: { ...state.user, dailyTargetMinutes: minutes } }));
        const uid = getCurrentUserId();
        if (uid) dbUpdateProfile(uid, { dailyTargetMinutes: minutes });
      },
      updateUserProfile: (updates) => {
        set((state) => ({ user: { ...state.user, ...updates } }));
        const uid = getCurrentUserId();
        if (uid) dbUpdateProfile(uid, updates);
      },
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

        // Background Supabase Persistence
        const uid = getCurrentUserId();
        if (uid) {
          dbSaveStudySession(uid, newSession);
          dbUpdateProfile(uid, {
            streakDays: streak,
            longestStreak: Math.max(streak, user.longestStreak),
            lastStudiedDate: todayStr,
            lastActiveSubjectId: activeSub?.id,
          });
        }

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
        const uid = getCurrentUserId();
        if (uid) dbSaveTask(uid, newTask);
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

        const updatedTasks = tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: !t.completed,
                completedAt: !t.completed ? new Date().toISOString() : undefined,
              }
            : t
        );

        set({ tasks: updatedTasks });
        const uid = getCurrentUserId();
        const updatedTask = updatedTasks.find((t) => t.id === taskId);
        if (uid && updatedTask) dbSaveTask(uid, updatedTask);
      },

      deleteTask: (taskId) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) }));
        const uid = getCurrentUserId();
        if (uid) dbDeleteTask(uid, taskId);
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
        const uid = getCurrentUserId();
        if (uid) dbSaveSubject(uid, newSubject);
      },

      deleteSubject: (subjectId) => {
        set((state) => ({ subjects: state.subjects.filter((s) => s.id !== subjectId) }));
        const uid = getCurrentUserId();
        if (uid) dbDeleteSubject(uid, subjectId);
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
        const uid = getCurrentUserId();
        const updated = get().subjects.find((s) => s.id === subjectId);
        if (uid && updated) dbSaveSubject(uid, updated);
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
        const uid = getCurrentUserId();
        const updated = get().subjects.find((s) => s.id === subjectId);
        if (uid && updated) dbSaveSubject(uid, updated);
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
        const uid = getCurrentUserId();
        const updated = get().subjects.find((s) => s.id === subjectId);
        if (uid && updated) dbSaveSubject(uid, updated);
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
        const uid = getCurrentUserId();
        const updated = get().subjects.find((s) => s.id === subjectId);
        if (uid && updated) dbSaveSubject(uid, updated);
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
        const uid = getCurrentUserId();
        const updated = get().subjects.find((s) => s.id === subjectId);
        if (uid && updated) dbSaveSubject(uid, updated);
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
        const uid = getCurrentUserId();
        if (uid) dbSaveExamCountdown(uid, newExam);
      },

      deleteExamCountdown: (id) => {
        set((state) => ({ examCountdowns: state.examCountdowns.filter((e) => e.id !== id) }));
        const uid = getCurrentUserId();
        if (uid) dbDeleteExamCountdown(uid, id);
      },

      setSupabaseConfig: (url, key) => {
        resetSupabaseClient(url, key);
        set({
          supabaseUrl: url,
          supabaseAnonKey: key,
          isCloudSynced: Boolean(url && key),
        });
      },

      syncUserData: async (forcedUserId?: string) => {
        const uid = forcedUserId || getCurrentUserId();
        if (!uid) return;
        if (get().isSyncing) {
          pendingSyncUid = uid;
          return;
        }

        set({ isSyncing: true });

        try {
          const remote = await fetchUserDataFromSupabase(uid);
          if (!remote) {
            return;
          }

          const current = get();

          // 1. Two-way merge for Subjects (with deep chapter & topic merge)
          const subjectMap = new Map<string, Subject>();
          (remote.subjects || []).forEach((s) => subjectMap.set(s.id, s));
          const subjectsToUpload: Subject[] = [];
          (current.subjects || []).forEach((s) => {
            if (!subjectMap.has(s.id)) {
              subjectMap.set(s.id, s);
              subjectsToUpload.push(s);
            } else {
              const remoteSub = subjectMap.get(s.id)!;
              const chapMap = new Map<string, Chapter>();
              (remoteSub.chapters || []).forEach((c) => chapMap.set(c.id, c));
              let chapsChanged = false;

              (s.chapters || []).forEach((localChap) => {
                if (!chapMap.has(localChap.id)) {
                  chapMap.set(localChap.id, localChap);
                  chapsChanged = true;
                } else {
                  const remoteChap = chapMap.get(localChap.id)!;
                  const topicMap = new Map<string, Topic>();
                  (remoteChap.topics || []).forEach((t) => topicMap.set(t.id, t));
                  let topicsChanged = false;

                  (localChap.topics || []).forEach((localTop) => {
                    if (!topicMap.has(localTop.id)) {
                      topicMap.set(localTop.id, localTop);
                      topicsChanged = true;
                    } else {
                      const remoteTop = topicMap.get(localTop.id)!;
                      const isCompleted = remoteTop.status === 'completed' || localTop.status === 'completed';
                      const mergedStatus: TopicStatus = isCompleted ? 'completed' : (localTop.status || remoteTop.status);
                      const confidence = localTop.confidence || remoteTop.confidence;
                      if (mergedStatus !== remoteTop.status || confidence !== remoteTop.confidence) {
                        topicMap.set(localTop.id, { ...remoteTop, status: mergedStatus, confidence });
                        topicsChanged = true;
                      }
                    }
                  });

                  if (topicsChanged) {
                    chapMap.set(localChap.id, {
                      ...remoteChap,
                      topics: Array.from(topicMap.values()),
                      notes: localChap.notes || remoteChap.notes,
                      formulas: localChap.formulas || remoteChap.formulas,
                    });
                    chapsChanged = true;
                  }
                }
              });

              if (chapsChanged) {
                const mergedSub: Subject = {
                  ...remoteSub,
                  chapters: Array.from(chapMap.values()),
                };
                subjectMap.set(s.id, mergedSub);
                subjectsToUpload.push(mergedSub);
              }
            }
          });

          // 2. Two-way merge for Sessions
          const sessionMap = new Map<string, StudySession>();
          (remote.sessions || []).forEach((s) => sessionMap.set(s.id, s));
          const sessionsToUpload: StudySession[] = [];
          (current.sessions || []).forEach((s) => {
            if (!sessionMap.has(s.id)) {
              sessionMap.set(s.id, s);
              sessionsToUpload.push(s);
            }
          });

          // 3. Two-way merge for Tasks
          const taskMap = new Map<string, Task>();
          (remote.tasks || []).forEach((t) => taskMap.set(t.id, t));
          const tasksToUpload: Task[] = [];
          (current.tasks || []).forEach((t) => {
            if (!taskMap.has(t.id)) {
              taskMap.set(t.id, t);
              tasksToUpload.push(t);
            }
          });

          // 4. Default Table Sync (Intelligent Multi-Device Merge Engine per specification)
          const { mergedLogs: rawMergedLogs, logsToUpload } = mergeDailyLogsList(
            remote.dailyLogs || [],
            current.dailyLogs || []
          );
          const isDefDeleted = remote.tableConfig?.isDefaultTableDeleted ?? current.isDefaultTableDeleted;
          const mergedLogs = isDefDeleted ? [] : ensureDailyLogsDateWise(rawMergedLogs);

          // 5. Custom Tables Sync (Intelligent Multi-Device Merge Engine per specification)
          const { mergedTables, tablesNeedUpload } = mergeCustomTablesList(
            remote.customTables || [],
            current.customTables || []
          );

          // 6. Two-way merge for Custom Columns of the Default Table
          const colMap = new Map<string, CustomColumn>();
          (remote.customColumns || []).forEach((c) => colMap.set(c.id, c));
          let columnsToUpload = false;
          (current.customColumns || []).forEach((c) => {
            if (!colMap.has(c.id)) {
              colMap.set(c.id, c);
              columnsToUpload = true;
            }
          });
          const mergedColumns = Array.from(colMap.values());

          // 7. Two-way merge for Exam Countdowns
          const examMap = new Map<string, ExamCountdown>();
          (remote.examCountdowns || []).forEach((e) => examMap.set(e.id, e));
          const examsToUpload: ExamCountdown[] = [];
          (current.examCountdowns || []).forEach((e) => {
            if (!examMap.has(e.id)) {
              examMap.set(e.id, e);
              examsToUpload.push(e);
            }
          });

          const mergedSubjects = Array.from(subjectMap.values());
          const mergedSessions = Array.from(sessionMap.values());
          const mergedTasks = Array.from(taskMap.values());
          const mergedExams = Array.from(examMap.values());

          set((state) => ({
            isCloudSynced: true,
            lastSyncedAt: new Date().toISOString(),
            subjects: mergedSubjects,
            sessions: mergedSessions,
            tasks: mergedTasks,
            dailyLogs: mergedLogs,
            deletedDefaultColumns: remote.tableConfig?.deletedDefaultColumns || state.deletedDefaultColumns || [],
            isDefaultTableDeleted: isDefDeleted,
            customTables: mergedTables,
            customColumns: mergedColumns,
            examCountdowns: mergedExams,
            user: {
              ...state.user,
              ...(remote.profile?.name ? { name: remote.profile.name } : {}),
              ...(remote.profile?.email ? { email: remote.profile.email } : {}),
              ...(remote.profile?.dailyTargetMinutes ? { dailyTargetMinutes: remote.profile.dailyTargetMinutes } : {}),
              ...(remote.profile?.streakDays != null ? { streakDays: Math.max(state.user.streakDays, remote.profile.streakDays) } : {}),
              ...(remote.profile?.longestStreak != null ? { longestStreak: Math.max(state.user.longestStreak, remote.profile.longestStreak) } : {}),
              ...(remote.profile?.lastStudiedDate ? { lastStudiedDate: remote.profile.lastStudiedDate } : {}),
              ...(remote.profile?.lastActiveSubjectId ? { lastActiveSubjectId: remote.profile.lastActiveSubjectId } : {}),
              ...(remote.profile?.friendCode ? { friendCode: remote.profile.friendCode } : {}),
              ...(remote.profile?.customWordmarkText ? { customWordmarkText: remote.profile.customWordmarkText } : {}),
            },
          }));

          // Upload any local items or merged updates that need to sync to Supabase
          if (
            subjectsToUpload.length > 0 ||
            sessionsToUpload.length > 0 ||
            tasksToUpload.length > 0 ||
            logsToUpload.length > 0 ||
            tablesNeedUpload ||
            examsToUpload.length > 0 ||
            columnsToUpload
          ) {
            uploadAllUserDataToSupabase(uid, {
              subjects: subjectsToUpload,
              sessions: sessionsToUpload,
              tasks: tasksToUpload,
              dailyLogs: logsToUpload.length > 0 ? logsToUpload : undefined,
              customTables: tablesNeedUpload ? mergedTables : undefined,
              customColumns: columnsToUpload ? mergedColumns : undefined,
              examCountdowns: examsToUpload,
            }).catch((err) => console.warn('Background sync upload notice:', err));
          }
        } catch (err) {
          console.error('syncUserData error:', err);
        } finally {
          set({ isSyncing: false });
          if (pendingSyncUid) {
            const nextUid = pendingSyncUid;
            pendingSyncUid = null;
            setTimeout(() => {
              get().syncUserData(nextUid);
            }, 100);
          }
        }
      },

      loadUserData: async (userId: string) => {
        await get().syncUserData(userId);
      },

      clearUserData: () => {
        set({
          subjects: [],
          sessions: [],
          tasks: [],
          dailyLogs: ensureDailyLogsDateWise([]),
          customTables: [],
          customColumns: [],
          examCountdowns: [],
          isCloudSynced: false,
          isSyncing: false,
          lastSyncedAt: null,
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
        const uid = getCurrentUserId();
        if (uid) dbUpdateProfile(uid, { friendCode: newCode });
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
        const nextVal = trimmed ? trimmed : 'studyo';
        set((state) => ({
          user: {
            ...state.user,
            customWordmarkText: nextVal,
          },
        }));
        const uid = getCurrentUserId();
        if (uid) dbUpdateProfile(uid, { customWordmarkText: nextVal });
      },

      resetToDefaults: () => {
        set({
          subjects: [],
          sessions: [],
          tasks: [],
          dailyLogs: ensureDailyLogsDateWise([]),
          customColumns: [],
          customTables: [],
          activeTableId: 'main',
          friends: [],
          stopwatchLaps: [],
          examCountdowns: [],
          distractionNotes: [],
          user: {
            ...get().user,
            streakDays: 0,
            longestStreak: 0,
            lastStudiedDate: '',
            lastActiveSubjectId: '',
          },
        });
      },

      loadDemoData: () => {
        set({
          subjects: [],
          sessions: [],
          tasks: [],
          dailyLogs: ensureDailyLogsDateWise([]),
          customColumns: [],
          customTables: [],
          activeTableId: 'main',
          friends: [],
          stopwatchLaps: [],
          examCountdowns: [],
          distractionNotes: [],
          user: {
            ...get().user,
            streakDays: 0,
            longestStreak: 0,
            lastStudiedDate: '',
            lastActiveSubjectId: '',
          },
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
        lastSyncedAt: state.lastSyncedAt,
        dailyLogs: state.dailyLogs,
        deletedDefaultColumns: state.deletedDefaultColumns,
        isDefaultTableDeleted: state.isDefaultTableDeleted,
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

        // Purge legacy demo data from rehydration
        const cleanSubjects = (persisted.subjects || []).filter((s) => !DEMO_SUBJECT_IDS.has(s.id));
        const cleanSessions = (persisted.sessions || []).filter(
          (s) => !s.id.startsWith('sess-today-') && !s.id.startsWith('sess-hist-') && !DEMO_SUBJECT_IDS.has(s.subjectId)
        );
        const cleanTasks = (persisted.tasks || []).filter(
          (t) => !DEMO_TASK_IDS.has(t.id) && !DEMO_SUBJECT_IDS.has(t.subjectId)
        );
        const cleanFriends = (persisted.friends || []).filter(
          (f) => !DEMO_FRIEND_CODES.has(f.code.toUpperCase())
        );
        const cleanTables = (persisted.customTables || []).filter(
          (tbl) => tbl.id !== 'tbl-mock-tests'
        );

        const mergedMap = new Map<string, DailyLogEntry>();
        persistedLogs.forEach((log) => {
          const isDemoLog =
            log.notes &&
            (log.notes.includes('Gauss') ||
              log.notes.includes('electromagnetic') ||
              log.notes.includes('thermodynamics') ||
              log.notes.includes('PYQs with zero distractions') ||
              log.notes.includes('Sunday mock') ||
              log.notes.includes('Calculus integration') ||
              log.notes.includes('October goal kickoff'));
          if (!isDemoLog) {
            mergedMap.set(log.date, log);
          }
        });
        const isDefDeleted = Boolean(persisted.isDefaultTableDeleted);
        const mergedLogs = isDefDeleted ? [] : ensureDailyLogsDateWise(Array.from(mergedMap.values()));

        const isDemoUser =
          persisted.user?.name === 'Alex' &&
          persisted.user?.streakDays === 14 &&
          persisted.user?.longestStreak === 21;

        const mergedUser = {
          ...currentState.user,
          ...(persisted.user || {}),
          ...(isDemoUser
            ? {
                name: 'Student',
                streakDays: 0,
                longestStreak: 0,
                lastStudiedDate: '',
                lastActiveSubjectId: '',
              }
            : {}),
          friendCode: persisted.user?.friendCode || currentState.user.friendCode || generateStudentCode(),
          profileMetricSlots:
            persisted.user?.profileMetricSlots ||
            currentState.user.profileMetricSlots ||
            ['currentStreak', 'bestStreak', 'daysLogged'],
          customWordmarkText:
            persisted.user?.customWordmarkText ||
            currentState.user.customWordmarkText ||
            'studyo',
        };

        const resolvedTheme: ThemeMode = persisted.theme === 'light' ? 'light' : 'dark';
        applyTheme(resolvedTheme);

        return {
          ...currentState,
          ...persisted,
          theme: resolvedTheme,
          user: mergedUser,
          subjects: cleanSubjects,
          sessions: cleanSessions,
          tasks: cleanTasks,
          friends: cleanFriends,
          customTables: cleanTables,
          enableQuickScratchpad: persisted.enableQuickScratchpad ?? false,
          showFinishButton: persisted.showFinishButton ?? true,
          dailyLogs: mergedLogs,
          deletedDefaultColumns: Array.isArray(persisted.deletedDefaultColumns) ? persisted.deletedDefaultColumns : [],
          isDefaultTableDeleted: isDefDeleted,
          customColumns: Array.isArray(persisted.customColumns) ? persisted.customColumns : [],
          activeTableId: persisted.activeTableId || 'main',
        };
      },
    }
  )
);

// Initial browser rehydration sync & automatic demo data cleanup
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('studypulse_storage_v2');
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.state) {
        if (data.state.theme) {
          applyTheme(data.state.theme);
        }
        let modified = false;
        if (data.state.subjects?.some((s: any) => DEMO_SUBJECT_IDS.has(s.id))) {
          data.state.subjects = data.state.subjects.filter((s: any) => !DEMO_SUBJECT_IDS.has(s.id));
          modified = true;
        }
        if (data.state.sessions?.some((s: any) => s.id?.startsWith('sess-today-') || s.id?.startsWith('sess-hist-') || DEMO_SUBJECT_IDS.has(s.subjectId))) {
          data.state.sessions = data.state.sessions.filter(
            (s: any) => !s.id?.startsWith('sess-today-') && !s.id?.startsWith('sess-hist-') && !DEMO_SUBJECT_IDS.has(s.subjectId)
          );
          modified = true;
        }
        if (data.state.tasks?.some((t: any) => DEMO_TASK_IDS.has(t.id) || DEMO_SUBJECT_IDS.has(t.subjectId))) {
          data.state.tasks = data.state.tasks.filter((t: any) => !DEMO_TASK_IDS.has(t.id) && !DEMO_SUBJECT_IDS.has(t.subjectId));
          modified = true;
        }
        if (data.state.friends?.some((f: any) => DEMO_FRIEND_CODES.has(f.code?.toUpperCase()))) {
          data.state.friends = data.state.friends.filter(
            (f: any) => !DEMO_FRIEND_CODES.has(f.code?.toUpperCase())
          );
          modified = true;
        }
        if (data.state.customTables?.some((t: any) => t.id === 'tbl-mock-tests')) {
          data.state.customTables = data.state.customTables.filter((t: any) => t.id !== 'tbl-mock-tests');
          modified = true;
        }
        if (data.state.user?.name === 'Alex' && data.state.user?.streakDays === 14) {
          data.state.user.name = 'Student';
          data.state.user.streakDays = 0;
          data.state.user.longestStreak = 0;
          data.state.user.lastStudiedDate = '';
          data.state.user.lastActiveSubjectId = '';
          modified = true;
        }
        if (modified) {
          localStorage.setItem('studypulse_storage_v2', JSON.stringify(data));
        }
      }
    }
  } catch {
    // fallback
  }
}

