export type Language = 'en' | 'hinglish' | 'hi';
export type ThemeMode = 'dark' | 'light';

export type RevisionConfidence = 'strong' | 'medium' | 'weak';
export type TopicStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'high' | 'med' | 'low';
export type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'stopwatch';

export interface Topic {
  id: string;
  name: string;
  status: TopicStatus;
  confidence: RevisionConfidence;
  estimatedMinutes?: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  notes?: string;
  formulas?: string;
  topics: Topic[];
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
  examDate?: string; // YYYY-MM-DD
  chapters: Chapter[];
}

export interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  chapterId?: string;
  chapterTitle?: string;
  durationMinutes: number;
  timestamp: string; // ISO string
  dateString: string; // YYYY-MM-DD
  hour: number; // 0-23 for peak productivity analysis
  focusRating: number; // 1-5
  notes?: string;
  mode: 'pomodoro' | 'stopwatch';
}

export interface Task {
  id: string;
  title: string;
  subjectId: string;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  estimatedPomodoros: number;
  notes?: string;
}

export interface ExamCountdown {
  id: string;
  title: string;
  subjectId: string;
  examDate: string; // YYYY-MM-DD
  targetScore?: string;
}

export interface DistractionNote {
  id: string;
  text: string;
  timestamp: string;
}

export interface UserProfile {
  name: string;
  email?: string;
  dailyTargetMinutes?: number;
  streakDays: number;
  longestStreak: number;
  lastStudiedDate?: string;
  lastActiveSubjectId?: string;
  friendCode?: string; // 4-5 alphanumeric unique student code
  profileMetricSlots?: [string, string, string];
  customWordmarkText?: string;
}

export interface FriendComment {
  id: string;
  authorCode: string;
  authorName: string;
  text: string;
  timestamp: string;
  reactions?: string[];
}

export interface FriendProfile {
  code: string; // 4-5 characters uppercase alphanumeric
  name: string;
  avatar?: string;
  bio?: string;
  streakDays: number;
  dailyTargetMinutes: number;
  todayStudyMinutes?: number;
  topSubject?: string;
  lastActive: string;
  status: 'accepted' | 'incoming_request' | 'outgoing_request' | 'none';
  requestedAt?: string;
  studyLogs: DailyLogEntry[];
  recentSessions?: StudySession[];
  comments: FriendComment[];
}

export type CustomColumnType = 'boolean' | 'number' | 'text' | 'select';

export interface CustomColumn {
  id: string;
  name: string;
  type: CustomColumnType;
  options?: string[]; // for 'select' type (e.g. ['Good', 'Okay', 'Bad'])
}

export interface DailyLogEntry {
  date: string; // YYYY-MM-DD
  studyHours?: number | null;
  attendedClass?: boolean;
  pyqsSolved?: number | null;
  revisionDone?: boolean;
  mockTestTaken?: boolean;
  sleepHours?: number | null;
  focusRating?: number | null; // 1-5
  notes?: string;
  customData?: Record<string, any>;
}

export interface StopwatchLap {
  id: string;
  lapNumber: number;
  timestampSeconds: number;
  lapDurationSeconds: number;
}

export type CustomTableColumnType = 'boolean' | 'number' | 'text' | 'select' | 'rating';

export interface CustomTableColumn {
  id: string;
  name: string;
  type: CustomTableColumnType;
  options?: string[]; // for 'select'
  unit?: string;
}

export interface CustomTableRow {
  id: string;
  date: string; // YYYY-MM-DD
  values: Record<string, any>;
  notes?: string;
  createdAt: string;
}

export interface CustomStudyTable {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  columns: CustomTableColumn[];
  rows: CustomTableRow[];
}


