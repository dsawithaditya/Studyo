import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Subject, 
  StudySession, 
  Task, 
  DailyLogEntry, 
  ExamCountdown, 
  UserProfile 
} from '../types';

export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- PostgreSQL Schema for Studyo (Study Tracker PWA)
-- Paste and Run in Supabase SQL Editor:
-- Project: https://qryeyooumhluhkqciyyf.supabase.co
-- ==========================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    daily_target_minutes INTEGER DEFAULT 360,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_studied_date TEXT,
    last_active_subject_id TEXT,
    friend_code TEXT,
    custom_wordmark_text TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'BookOpen',
    color TEXT DEFAULT '#e9762b',
    exam_date TEXT,
    chapters JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Study Sessions Table (Pomodoro & Stopwatch Focus Records)
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    chapter_id TEXT,
    chapter_title TEXT,
    duration_minutes INTEGER NOT NULL,
    focus_rating SMALLINT DEFAULT 5,
    mode TEXT CHECK (mode IN ('pomodoro', 'stopwatch')),
    notes TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    date_string TEXT NOT NULL,
    hour SMALLINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id TEXT,
    title TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('high', 'med', 'low')),
    due_date TEXT,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    estimated_pomodoros SMALLINT DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Daily Study Logs Table
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date TEXT NOT NULL,
    study_hours NUMERIC,
    attended_class BOOLEAN DEFAULT false,
    pyqs_solved INTEGER DEFAULT 0,
    revision_done BOOLEAN DEFAULT false,
    mock_test_taken BOOLEAN DEFAULT false,
    sleep_hours NUMERIC,
    focus_rating SMALLINT,
    notes TEXT,
    custom_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- 7. Exam Countdowns Table
CREATE TABLE IF NOT EXISTS public.exam_countdowns (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject_id TEXT,
    title TEXT NOT NULL,
    exam_date TEXT NOT NULL,
    target_score TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 8. PERFORMANCE INDEXES
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.study_sessions (user_id, date_string DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON public.study_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id, completed, due_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_exam_user_date ON public.exam_countdowns (user_id, exam_date);

-- ==========================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_countdowns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can manage own subjects" ON public.subjects;
    DROP POLICY IF EXISTS "Users can manage own study sessions" ON public.study_sessions;
    DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
    DROP POLICY IF EXISTS "Users can manage own daily logs" ON public.daily_logs;
    DROP POLICY IF EXISTS "Users can manage own exam countdowns" ON public.exam_countdowns;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own subjects" 
ON public.subjects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own study sessions" 
ON public.study_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own tasks" 
ON public.tasks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily logs" 
ON public.daily_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own exam countdowns" 
ON public.exam_countdowns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==========================================================
-- 10. AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

// Default project configuration fallback
export const DEFAULT_SUPABASE_URL = 
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://qryeyooumhluhkqciyyf.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_J_SOftnv_MPe48vI7APraA_2czCyksa';

let client: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const targetUrl = url || DEFAULT_SUPABASE_URL;
  const targetKey = key || DEFAULT_SUPABASE_ANON_KEY;

  if (!targetUrl || !targetKey) {
    return null;
  }

  if (!client) {
    try {
      client = createClient(targetUrl, targetKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return client;
}

export function resetSupabaseClient(url: string, key: string): SupabaseClient | null {
  try {
    client = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return client;
  } catch {
    client = null;
    return null;
  }
}

export const supabase = getSupabaseClient();

// ==========================================================
// DATABASE QUERY & MUTATION SERVICES
// ==========================================================

export async function fetchUserDataFromSupabase(userId: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;

  try {
    const [
      profileRes,
      subjectsRes,
      sessionsRes,
      tasksRes,
      dailyLogsRes,
      examsRes,
    ] = await Promise.all([
      sb.from('profiles').select('*').eq('id', userId).maybeSingle(),
      sb.from('subjects').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      sb.from('study_sessions').select('*').eq('user_id', userId).order('timestamp', { ascending: false }),
      sb.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      sb.from('daily_logs').select('*').eq('user_id', userId).order('date', { ascending: false }),
      sb.from('exam_countdowns').select('*').eq('user_id', userId).order('exam_date', { ascending: true }),
    ]);

    const subjects: Subject[] = (subjectsRes.data || []).map((row) => ({
      id: row.id,
      name: row.name,
      icon: row.icon || 'BookOpen',
      color: row.color || '#e9762b',
      examDate: row.exam_date || undefined,
      chapters: Array.isArray(row.chapters) ? row.chapters : [],
    }));

    const sessions: StudySession[] = (sessionsRes.data || []).map((row) => ({
      id: row.id,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      chapterId: row.chapter_id || undefined,
      chapterTitle: row.chapter_title || undefined,
      durationMinutes: row.duration_minutes,
      timestamp: row.timestamp,
      dateString: row.date_string,
      hour: row.hour,
      focusRating: row.focus_rating || 5,
      notes: row.notes || undefined,
      mode: (row.mode as 'pomodoro' | 'stopwatch') || 'pomodoro',
    }));

    const tasks: Task[] = (tasksRes.data || []).map((row) => ({
      id: row.id,
      title: row.title,
      subjectId: row.subject_id || '',
      priority: row.priority || 'med',
      dueDate: row.due_date || '',
      completed: Boolean(row.completed),
      completedAt: row.completed_at || undefined,
      estimatedPomodoros: row.estimated_pomodoros || 1,
      notes: row.notes || undefined,
    }));

    const dailyLogs: DailyLogEntry[] = (dailyLogsRes.data || []).map((row) => ({
      date: row.date,
      studyHours: row.study_hours != null ? Number(row.study_hours) : null,
      attendedClass: Boolean(row.attended_class),
      pyqsSolved: row.pyqs_solved != null ? Number(row.pyqs_solved) : null,
      revisionDone: Boolean(row.revision_done),
      mockTestTaken: Boolean(row.mock_test_taken),
      sleepHours: row.sleep_hours != null ? Number(row.sleep_hours) : null,
      focusRating: row.focus_rating != null ? Number(row.focus_rating) : null,
      notes: row.notes || '',
      customData: row.custom_data || {},
    }));

    const examCountdowns: ExamCountdown[] = (examsRes.data || []).map((row) => ({
      id: row.id,
      title: row.title,
      subjectId: row.subject_id || '',
      examDate: row.exam_date,
      targetScore: row.target_score || undefined,
    }));

    return {
      profile: profileRes.data as Partial<UserProfile> | null,
      subjects,
      sessions,
      tasks,
      dailyLogs,
      examCountdowns,
    };
  } catch (err) {
    console.error('Error fetching Supabase user data:', err);
    return null;
  }
}

export async function dbSaveSubject(userId: string, subject: Subject) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('subjects').upsert({
      id: subject.id,
      user_id: userId,
      name: subject.name,
      icon: subject.icon,
      color: subject.color,
      exam_date: subject.examDate || null,
      chapters: subject.chapters || [],
    });
  } catch (err) {
    console.error('Failed to save subject to Supabase:', err);
  }
}

export async function dbDeleteSubject(userId: string, subjectId: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('subjects').delete().eq('id', subjectId).eq('user_id', userId);
  } catch (err) {
    console.error('Failed to delete subject from Supabase:', err);
  }
}

export async function dbSaveStudySession(userId: string, session: StudySession) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('study_sessions').upsert({
      id: session.id,
      user_id: userId,
      subject_id: session.subjectId,
      subject_name: session.subjectName,
      chapter_id: session.chapterId || null,
      chapter_title: session.chapterTitle || null,
      duration_minutes: session.durationMinutes,
      focus_rating: session.focusRating,
      mode: session.mode,
      notes: session.notes || null,
      timestamp: session.timestamp,
      date_string: session.dateString,
      hour: session.hour,
    });
  } catch (err) {
    console.error('Failed to save session to Supabase:', err);
  }
}

export async function dbSaveTask(userId: string, task: Task) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('tasks').upsert({
      id: task.id,
      user_id: userId,
      subject_id: task.subjectId || null,
      title: task.title,
      priority: task.priority,
      due_date: task.dueDate || null,
      completed: task.completed,
      completed_at: task.completedAt || null,
      estimated_pomodoros: task.estimatedPomodoros,
      notes: task.notes || null,
    });
  } catch (err) {
    console.error('Failed to save task to Supabase:', err);
  }
}

export async function dbDeleteTask(userId: string, taskId: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
  } catch (err) {
    console.error('Failed to delete task from Supabase:', err);
  }
}

export async function dbSaveDailyLog(userId: string, entry: DailyLogEntry) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('daily_logs').upsert(
      {
        user_id: userId,
        date: entry.date,
        study_hours: entry.studyHours,
        attended_class: entry.attendedClass,
        pyqs_solved: entry.pyqsSolved,
        revision_done: entry.revisionDone,
        mock_test_taken: entry.mockTestTaken,
        sleep_hours: entry.sleepHours,
        focus_rating: entry.focusRating,
        notes: entry.notes || null,
        custom_data: entry.customData || {},
      },
      { onConflict: 'user_id,date' }
    );
  } catch (err) {
    console.error('Failed to save daily log to Supabase:', err);
  }
}

export async function dbDeleteDailyLog(userId: string, date: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('daily_logs').delete().eq('date', date).eq('user_id', userId);
  } catch (err) {
    console.error('Failed to delete daily log from Supabase:', err);
  }
}

export async function dbSaveExamCountdown(userId: string, exam: ExamCountdown) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('exam_countdowns').upsert({
      id: exam.id,
      user_id: userId,
      subject_id: exam.subjectId || null,
      title: exam.title,
      exam_date: exam.examDate,
      target_score: exam.targetScore || null,
    });
  } catch (err) {
    console.error('Failed to save exam countdown to Supabase:', err);
  }
}

export async function dbDeleteExamCountdown(userId: string, examId: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    await sb.from('exam_countdowns').delete().eq('id', examId).eq('user_id', userId);
  } catch (err) {
    console.error('Failed to delete exam countdown from Supabase:', err);
  }
}

export async function dbUpdateProfile(userId: string, updates: Partial<UserProfile>) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  try {
    const payload: Record<string, any> = {
      id: userId,
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.dailyTargetMinutes !== undefined) payload.daily_target_minutes = updates.dailyTargetMinutes;
    if (updates.streakDays !== undefined) payload.streak_days = updates.streakDays;
    if (updates.longestStreak !== undefined) payload.longest_streak = updates.longestStreak;
    if (updates.lastStudiedDate !== undefined) payload.last_studied_date = updates.lastStudiedDate;
    if (updates.lastActiveSubjectId !== undefined) payload.last_active_subject_id = updates.lastActiveSubjectId;
    if (updates.friendCode !== undefined) payload.friend_code = updates.friendCode;
    if (updates.customWordmarkText !== undefined) payload.custom_wordmark_text = updates.customWordmarkText;

    await sb.from('profiles').upsert(payload);
  } catch (err) {
    console.error('Failed to update profile in Supabase:', err);
  }
}
