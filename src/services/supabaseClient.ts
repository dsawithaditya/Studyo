import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Subject, 
  StudySession, 
  Task, 
  DailyLogEntry, 
  ExamCountdown, 
  UserProfile,
  CustomStudyTable,
  CustomColumn
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

-- 8. Custom Study Tables (User-defined tables & spreadsheets)
CREATE TABLE IF NOT EXISTS public.custom_tables (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    columns JSONB DEFAULT '[]'::jsonb,
    rows JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Custom Daily Study Log Columns
CREATE TABLE IF NOT EXISTS public.custom_columns (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    col_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 10. PERFORMANCE INDEXES
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.study_sessions (user_id, date_string DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON public.study_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id, completed, due_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_exam_user_date ON public.exam_countdowns (user_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_custom_tables_user ON public.custom_tables (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_columns_user ON public.custom_columns (user_id);

-- ==========================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_columns ENABLE ROW LEVEL SECURITY;

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
    DROP POLICY IF EXISTS "Users can manage own custom tables" ON public.custom_tables;
    DROP POLICY IF EXISTS "Users can manage own custom columns" ON public.custom_columns;
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

CREATE POLICY "Users can manage own custom tables" 
ON public.custom_tables FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own custom columns" 
ON public.custom_columns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==========================================================
-- 12. AUTOMATIC PROFILE TRIGGER ON SIGNUP
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
// AUTHENTICATION GUARD & SESSION VALIDATOR
// ==========================================================

let inFlightEnsureAuthPromise: Promise<boolean> | null = null;

/**
 * Ensures the Supabase client has an active, authenticated session for the given user.
 * Deduplicates concurrent calls via in-flight promise and restores from localStorage/native tokens.
 */
export async function ensureSupabaseAuth(userId?: string): Promise<boolean> {
  if (inFlightEnsureAuthPromise) {
    return inFlightEnsureAuthPromise;
  }
  inFlightEnsureAuthPromise = runEnsureSupabaseAuth(userId).finally(() => {
    inFlightEnsureAuthPromise = null;
  });
  return inFlightEnsureAuthPromise;
}

async function runEnsureSupabaseAuth(userId?: string): Promise<boolean> {
  const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 4000));
  return Promise.race([_internalEnsureSupabaseAuth(userId), timeoutPromise]);
}

async function _internalEnsureSupabaseAuth(userId?: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;

  try {
    // 1. Await getSession() which ensures GoTrueClient initialization has completed
    const { data: { session } } = await sb.auth.getSession();
    if (session?.user && (!userId || session.user.id === userId)) {
      const nowSec = Math.floor(Date.now() / 1000);
      // If token is valid with at least 30 seconds buffer, session is ready
      if (!session.expires_at || session.expires_at > nowSec + 30) {
        return true;
      }
    }

    // 2. If no active session or expired, extract tokens from storage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        let token: string | undefined;
        let refreshToken: string | undefined;
        let matchedUserId = false;

        // Try reading from studyo_auth_state_v1
        const raw = window.localStorage.getItem('studyo_auth_state_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          const storedState = parsed?.state;
          const storedSession = storedState?.session;
          const storedUser = storedState?.currentUser;

          if (storedSession?.token && (!userId || storedUser?.id === userId)) {
            token = storedSession.token;
            refreshToken = storedSession.refreshToken;
            matchedUserId = true;
          }
        }

        // Search Supabase's native storage key (sb-*-auth-token) for fresh refresh token
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
            try {
              const item = JSON.parse(window.localStorage.getItem(k) || '{}');
              if (item?.user?.id && (!userId || item.user.id === userId)) {
                matchedUserId = true;
                if (!token || item.access_token) token = item.access_token;
                if (item.refresh_token) refreshToken = item.refresh_token;
                break;
              }
            } catch {}
          }
        }

        if (token && refreshToken && matchedUserId) {
          const { data: setRes, error: setErr } = await sb.auth.setSession({
            access_token: token,
            refresh_token: refreshToken,
          });

          if (setRes?.session?.user && (!userId || setRes.session.user.id === userId)) {
            // Update studyo_auth_state_v1 in localStorage with newly rotated tokens
            try {
              const authRaw = window.localStorage.getItem('studyo_auth_state_v1');
              if (authRaw) {
                const authData = JSON.parse(authRaw);
                if (authData.state?.session && setRes.session.access_token) {
                  authData.state.session.token = setRes.session.access_token;
                  authData.state.session.refreshToken = setRes.session.refresh_token;
                  window.localStorage.setItem('studyo_auth_state_v1', JSON.stringify(authData));
                }
              }
            } catch {}

            return true;
          }

          if (setErr) {
            console.warn('[SupabaseAuth] setSession notice:', setErr.message);
          }
        }
      } catch (storageErr) {
        console.warn('[SupabaseAuth] Error reading auth from localStorage:', storageErr);
      }
    }

    if (userId) {
      console.warn(`[SupabaseAuth] Session unauthenticated or user mismatch for: ${userId}`);
      return false;
    }
    return false;
  } catch (err) {
    console.error('[SupabaseAuth] Error in ensureSupabaseAuth:', err);
    return false;
  }
}

// ==========================================================
// DATABASE QUERY & MUTATION SERVICES
// ==========================================================

export async function fetchUserDataFromSupabase(userId: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return null;

  const authed = await ensureSupabaseAuth(userId);
  if (!authed) {
    console.warn('[Supabase] Aborting fetch: authenticated session not ready for user:', userId);
    return null;
  }

  try {
    const [
      profileRes,
      subjectsRes,
      sessionsRes,
      tasksRes,
      dailyLogsRes,
      examsRes,
      customTablesRes,
      customColumnsRes,
    ] = await Promise.all([
      sb.from('profiles').select('*').eq('id', userId).maybeSingle(),
      sb.from('subjects').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      sb.from('study_sessions').select('*').eq('user_id', userId).order('timestamp', { ascending: false }),
      sb.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      sb.from('daily_logs').select('*').eq('user_id', userId).order('date', { ascending: false }),
      sb.from('exam_countdowns').select('*').eq('user_id', userId).order('exam_date', { ascending: true }),
      // Gracefully attempt querying dedicated tables, returning null if table does not exist
      Promise.resolve(sb.from('custom_tables').select('*').eq('user_id', userId).order('created_at', { ascending: true })).catch(() => ({ data: null, error: null })),
      Promise.resolve(sb.from('custom_columns').select('*').eq('user_id', userId).order('col_order', { ascending: true })).catch(() => ({ data: null, error: null })),
    ]);

    if (dailyLogsRes?.error) {
      console.error('[Supabase fetchUserData] daily_logs query error:', dailyLogsRes.error);
    }
    if (subjectsRes?.error) {
      console.error('[Supabase fetchUserData] subjects query error:', subjectsRes.error);
    }
    if (sessionsRes?.error) {
      console.error('[Supabase fetchUserData] study_sessions query error:', sessionsRes.error);
    }
    if (tasksRes?.error) {
      console.error('[Supabase fetchUserData] tasks query error:', tasksRes.error);
    }
    if (examsRes?.error) {
      console.error('[Supabase fetchUserData] exam_countdowns query error:', examsRes.error);
    }

    const subjects: Subject[] = ((subjectsRes?.data as any[]) || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      icon: row.icon || 'BookOpen',
      color: row.color || '#e9762b',
      examDate: row.exam_date || undefined,
      chapters: Array.isArray(row.chapters) ? row.chapters : [],
    }));

    const sessions: StudySession[] = ((sessionsRes?.data as any[]) || []).map((row: any) => ({
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

    const tasks: Task[] = ((tasksRes?.data as any[]) || []).map((row: any) => ({
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

    // Split real daily logs from internal sync metadata rows
    const rawLogs = (dailyLogsRes?.data as any[]) || [];
    const metaTablesRow = rawLogs.find((r: any) => r.date === '__meta_custom_tables__');
    const metaColumnsRow = rawLogs.find((r: any) => r.date === '__meta_custom_columns__');
    const metaConfigRow = rawLogs.find((r: any) => r.date === '__meta_table_config__');

    const realLogs = rawLogs.filter((r: any) => !r.date.startsWith('__meta_'));

    const dailyLogs: DailyLogEntry[] = realLogs.map((row: any) => ({
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

    // Custom study tables: from dedicated table if available, or from metadata row
    let customTables: CustomStudyTable[] = [];
    if (customTablesRes?.data && Array.isArray(customTablesRes.data) && customTablesRes.data.length > 0) {
      customTables = (customTablesRes.data as any[]).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        columns: Array.isArray(row.columns) ? row.columns : [],
        rows: Array.isArray(row.rows) ? row.rows : [],
      }));
    } else if (metaTablesRow?.custom_data?.tables && Array.isArray(metaTablesRow.custom_data.tables)) {
      customTables = metaTablesRow.custom_data.tables;
    }

    // Custom columns: from dedicated table if available, or from metadata row
    let customColumns: CustomColumn[] = [];
    if (customColumnsRes?.data && Array.isArray(customColumnsRes.data) && customColumnsRes.data.length > 0) {
      customColumns = (customColumnsRes.data as any[]).map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type || 'text',
        options: Array.isArray(row.options) ? row.options : undefined,
      }));
    } else if (metaColumnsRow?.custom_data?.columns && Array.isArray(metaColumnsRow.custom_data.columns)) {
      customColumns = metaColumnsRow.custom_data.columns;
    }

    const tableConfig = {
      deletedDefaultColumns: (metaConfigRow?.custom_data?.deletedDefaultColumns as string[]) || [],
      isDefaultTableDeleted: Boolean(metaConfigRow?.custom_data?.isDefaultTableDeleted),
    };

    const examCountdowns: ExamCountdown[] = ((examsRes?.data as any[]) || []).map((row: any) => ({
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
      customTables,
      customColumns,
      tableConfig,
    };
  } catch (err) {
    console.error('Error fetching Supabase user data:', err);
    return null;
  }
}

export async function dbSaveSubject(userId: string, subject: Subject) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('subjects').upsert({
      id: subject.id,
      user_id: userId,
      name: subject.name,
      icon: subject.icon,
      color: subject.color,
      exam_date: subject.examDate || null,
      chapters: subject.chapters || [],
    });
    if (error) {
      console.error('[Supabase dbSaveSubject Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to save subject to Supabase:', err);
  }
}

export async function dbDeleteSubject(userId: string, subjectId: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('subjects').delete().eq('id', subjectId).eq('user_id', userId);
    if (error) {
      console.error('[Supabase dbDeleteSubject Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to delete subject from Supabase:', err);
  }
}

export async function dbSaveStudySession(userId: string, session: StudySession) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('study_sessions').upsert({
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
    if (error) {
      console.error('[Supabase dbSaveStudySession Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to save session to Supabase:', err);
  }
}

export async function dbSaveTask(userId: string, task: Task) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('tasks').upsert({
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
    if (error) {
      console.error('[Supabase dbSaveTask Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to save task to Supabase:', err);
  }
}

export async function dbDeleteTask(userId: string, taskId: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
    if (error) {
      console.error('[Supabase dbDeleteTask Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to delete task from Supabase:', err);
  }
}

export async function dbSaveDailyLog(userId: string, entry: DailyLogEntry) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('daily_logs').upsert(
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
    if (error) {
      console.error('[Supabase dbSaveDailyLog Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to save daily log to Supabase:', err);
  }
}

export async function dbSaveDailyLogsBatch(userId: string, entries: DailyLogEntry[]) {
  const sb = getSupabaseClient();
  if (!sb || !userId || entries.length === 0) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const payload = entries.map((entry) => ({
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
    }));

    // In chunks of 50 to prevent oversized HTTP payloads
    const chunkSize = 50;
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      const { error } = await sb.from('daily_logs').upsert(chunk, { onConflict: 'user_id,date' });
      if (error) {
        console.error('[Supabase dbSaveDailyLogsBatch Chunk Error]:', error.message, error);
      }
    }
  } catch (err) {
    console.error('Failed to batch save daily logs to Supabase:', err);
  }
}

export async function dbDeleteDailyLog(userId: string, date: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('daily_logs').delete().eq('date', date).eq('user_id', userId);
    if (error) {
      console.error('[Supabase dbDeleteDailyLog Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to delete daily log from Supabase:', err);
  }
}

export async function dbClearAllDailyLogs(userId: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('daily_logs').delete().eq('user_id', userId).not('date', 'like', '__meta_%');
    if (error) {
      console.error('[Supabase dbClearAllDailyLogs Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to clear daily logs from Supabase:', err);
  }
}

export async function dbSaveTableConfig(userId: string, config: { deletedDefaultColumns: string[]; isDefaultTableDeleted: boolean }) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('daily_logs').upsert(
      {
        user_id: userId,
        date: '__meta_table_config__',
        custom_data: config,
      },
      { onConflict: 'user_id,date' }
    );
    if (error) {
      console.error('[Supabase dbSaveTableConfig Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to save table config to Supabase:', err);
  }
}

export async function dbSaveExamCountdown(userId: string, exam: ExamCountdown) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('exam_countdowns').upsert({
      id: exam.id,
      user_id: userId,
      subject_id: exam.subjectId || null,
      title: exam.title,
      exam_date: exam.examDate,
      target_score: exam.targetScore || null,
    });
    if (error) {
      console.error('[Supabase dbSaveExamCountdown Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to save exam countdown to Supabase:', err);
  }
}

export async function dbDeleteExamCountdown(userId: string, examId: string) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    const { error } = await sb.from('exam_countdowns').delete().eq('id', examId).eq('user_id', userId);
    if (error) {
      console.error('[Supabase dbDeleteExamCountdown Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to delete exam countdown from Supabase:', err);
  }
}

export async function dbUpdateProfile(userId: string, updates: Partial<UserProfile>) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

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

    const { error } = await sb.from('profiles').upsert(payload);
    if (error) {
      console.error('[Supabase dbUpdateProfile Error]:', error.message, error);
    }
  } catch (err) {
    console.error('Failed to update profile in Supabase:', err);
  }
}

// ==========================================================
// CUSTOM TABLES & COLUMNS DATABASE SERVICES
// ==========================================================

export async function dbSaveCustomTable(
  userId: string, 
  table: CustomStudyTable, 
  allTables?: CustomStudyTable[]
) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  // 1. Try dedicated public.custom_tables
  try {
    const { error: tblErr } = await sb.from('custom_tables').upsert({
      id: table.id,
      user_id: userId,
      title: table.title,
      description: table.description || '',
      columns: table.columns || [],
      rows: table.rows || [],
      updated_at: new Date().toISOString(),
    });
    if (tblErr) {
      // Dedicate table might not be present in public schema; fallback will handle it
    }
  } catch {
    // Graceful fallback if table does not exist
  }

  // 2. Resilient backup to daily_logs under '__meta_custom_tables__'
  try {
    const tablesList = allTables || [table];
    const { error: metaErr } = await sb.from('daily_logs').upsert(
      {
        user_id: userId,
        date: '__meta_custom_tables__',
        notes: 'Studyo Internal Sync Cache',
        custom_data: { tables: tablesList },
      },
      { onConflict: 'user_id,date' }
    );
    if (metaErr) {
      console.error('[Supabase dbSaveCustomTable meta backup Error]:', metaErr.message, metaErr);
    }
  } catch (err) {
    console.warn('Backup custom table sync notice:', err);
  }
}

export async function dbDeleteCustomTable(
  userId: string, 
  tableId: string, 
  remainingTables?: CustomStudyTable[]
) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    await sb.from('custom_tables').delete().eq('id', tableId).eq('user_id', userId);
  } catch {
    // Graceful fallback
  }

  if (remainingTables) {
    try {
      const { error: metaErr } = await sb.from('daily_logs').upsert(
        {
          user_id: userId,
          date: '__meta_custom_tables__',
          notes: 'Studyo Internal Sync Cache',
          custom_data: { tables: remainingTables },
        },
        { onConflict: 'user_id,date' }
      );
      if (metaErr) {
        console.error('[Supabase dbDeleteCustomTable meta Error]:', metaErr.message, metaErr);
      }
    } catch (err) {
      console.warn('Backup custom table delete notice:', err);
    }
  }
}

export async function dbSaveAllCustomTables(userId: string, tables: CustomStudyTable[]) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    for (const table of tables) {
      await sb.from('custom_tables').upsert({
        id: table.id,
        user_id: userId,
        title: table.title,
        description: table.description || '',
        columns: table.columns || [],
        rows: table.rows || [],
        updated_at: new Date().toISOString(),
      });
    }
  } catch {
    // Graceful fallback
  }

  try {
    const { error: metaErr } = await sb.from('daily_logs').upsert(
      {
        user_id: userId,
        date: '__meta_custom_tables__',
        notes: 'Studyo Internal Sync Cache',
        custom_data: { tables },
      },
      { onConflict: 'user_id,date' }
    );
    if (metaErr) {
      console.error('[Supabase dbSaveAllCustomTables meta Error]:', metaErr.message, metaErr);
    }
  } catch (err) {
    console.warn('Backup all custom tables notice:', err);
  }
}

export async function dbSaveCustomColumns(userId: string, columns: CustomColumn[]) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) return;

  try {
    for (let i = 0; i < columns.length; i++) {
      const c = columns[i];
      await sb.from('custom_columns').upsert({
        id: c.id,
        user_id: userId,
        name: c.name,
        type: c.type,
        options: c.options || [],
        col_order: i,
      });
    }
  } catch {
    // Graceful fallback
  }

  try {
    const { error: metaErr } = await sb.from('daily_logs').upsert(
      {
        user_id: userId,
        date: '__meta_custom_columns__',
        notes: 'Studyo Internal Sync Cache',
        custom_data: { columns },
      },
      { onConflict: 'user_id,date' }
    );
    if (metaErr) {
      console.error('[Supabase dbSaveCustomColumns meta Error]:', metaErr.message, metaErr);
    }
  } catch (err) {
    console.warn('Backup custom columns notice:', err);
  }
}

// Mass upload helper for initial sync or cloud push
export async function uploadAllUserDataToSupabase(
  userId: string,
  data: {
    user?: Partial<UserProfile>;
    subjects?: Subject[];
    sessions?: StudySession[];
    tasks?: Task[];
    dailyLogs?: DailyLogEntry[];
    examCountdowns?: ExamCountdown[];
    customTables?: CustomStudyTable[];
    customColumns?: CustomColumn[];
  }
) {
  const sb = getSupabaseClient();
  if (!sb || !userId) return;
  const authed = await ensureSupabaseAuth(userId);
  if (!authed) {
    console.warn('[Supabase uploadAllUserDataToSupabase] Skipped: session not authenticated for user', userId);
    return;
  }

  const promises: Promise<any>[] = [];

  if (data.user) {
    promises.push(dbUpdateProfile(userId, data.user));
  }

  if (data.subjects && data.subjects.length > 0) {
    data.subjects.forEach((s) => promises.push(dbSaveSubject(userId, s)));
  }

  if (data.sessions && data.sessions.length > 0) {
    data.sessions.forEach((s) => promises.push(dbSaveStudySession(userId, s)));
  }

  if (data.tasks && data.tasks.length > 0) {
    data.tasks.forEach((t) => promises.push(dbSaveTask(userId, t)));
  }

  if (data.dailyLogs && data.dailyLogs.length > 0) {
    const realLogs = data.dailyLogs.filter((l) => !l.date.startsWith('__meta_'));
    if (realLogs.length > 0) {
      promises.push(dbSaveDailyLogsBatch(userId, realLogs));
    }
  }

  if (data.examCountdowns && data.examCountdowns.length > 0) {
    data.examCountdowns.forEach((e) => promises.push(dbSaveExamCountdown(userId, e)));
  }

  if (data.customTables && data.customTables.length > 0) {
    promises.push(dbSaveAllCustomTables(userId, data.customTables));
  }

  if (data.customColumns && data.customColumns.length > 0) {
    promises.push(dbSaveCustomColumns(userId, data.customColumns));
  }

  try {
    await Promise.all(promises);
  } catch (err) {
    console.error('Failed to upload all user data to Supabase:', err);
  }
}
