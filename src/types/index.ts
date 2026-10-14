export type Language = 'en' | 'hinglish' | 'hi';

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
  dailyTargetMinutes: number; // e.g. 300 = 5 hours
  streakDays: number;
  longestStreak: number;
  lastStudiedDate?: string;
  lastActiveSubjectId?: string;
}

export interface DailyLogEntry {
  date: string; // YYYY-MM-DD
  studyHours: number;
  attendedClass: boolean;
  pyqsSolved: number;
  revisionDone: boolean;
  mockTestTaken: boolean;
  sleepHours: number;
  focusRating: number; // 1-5
  notes?: string;
}

export interface StopwatchLap {
  id: string;
  lapNumber: number;
  timestampSeconds: number;
  lapDurationSeconds: number;
}

