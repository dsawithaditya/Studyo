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
    location TEXT,
    timestamp TIMESTAMPTZ NOT NULL,
    date_string TEXT NOT NULL,
    hour SMALLINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS location TEXT;

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
    auto_generate_rows BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.custom_tables ADD COLUMN IF NOT EXISTS auto_generate_rows BOOLEAN DEFAULT true;

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

-- 10. Friend Requests Table (Real-time student networking)
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    sender_code TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    receiver_code TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(sender_id, receiver_id)
);

-- 11. Friendships Table (Mutual study circle connections)
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    friend_code TEXT NOT NULL,
    friend_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, friend_id)
);

-- ==========================================================
-- 12. PERFORMANCE INDEXES
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON public.study_sessions (user_id, date_string DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON public.study_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks (user_id, completed, due_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_exam_user_date ON public.exam_countdowns (user_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_custom_tables_user ON public.custom_tables (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_columns_user ON public.custom_columns (user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests (sender_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON public.friendships (user_id);

-- ==========================================================
-- 13. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can view student profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can manage own subjects" ON public.subjects;
    DROP POLICY IF EXISTS "Users can manage own study sessions" ON public.study_sessions;
    DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
    DROP POLICY IF EXISTS "Users can manage own daily logs" ON public.daily_logs;
    DROP POLICY IF EXISTS "Users can manage own exam countdowns" ON public.exam_countdowns;
    DROP POLICY IF EXISTS "Users can manage own custom tables" ON public.custom_tables;
    DROP POLICY IF EXISTS "Users can manage own custom columns" ON public.custom_columns;
    DROP POLICY IF EXISTS "Users can view their friend requests" ON public.friend_requests;
    DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
    DROP POLICY IF EXISTS "Users can update their friend requests" ON public.friend_requests;
    DROP POLICY IF EXISTS "Users can delete their friend requests" ON public.friend_requests;
    DROP POLICY IF EXISTS "Users can view their friendships" ON public.friendships;
    DROP POLICY IF EXISTS "Users can manage their friendships" ON public.friendships;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

CREATE POLICY "Users can view student profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" 
ON public.profiles FOR DELETE USING (auth.uid() = id);

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

CREATE POLICY "Users can view their friend requests" 
ON public.friend_requests FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" 
ON public.friend_requests FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their friend requests" 
ON public.friend_requests FOR UPDATE 
USING (auth.uid() = receiver_id OR auth.uid() = sender_id)
WITH CHECK (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can delete their friend requests" 
ON public.friend_requests FOR DELETE 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can view their friendships" 
ON public.friendships FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can manage their friendships" 
ON public.friendships FOR ALL 
USING (auth.uid() = user_id OR auth.uid() = friend_id) 
WITH CHECK (auth.uid() = user_id OR auth.uid() = friend_id);

-- ==========================================================
-- 14. AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ==========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- 15. SECURE ACCOUNT DELETION RPC
-- ==========================================================
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Cascades through all public tables with REFERENCES auth.users(id) ON DELETE CASCADE
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
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
      location: row.location || undefined,
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

    const dailyLogs: DailyLogEntry[] = realLogs.map((row: any) => {
      const customRaw = row.custom_data && typeof row.custom_data === 'object' ? { ...row.custom_data } : {};
      const tri = customRaw.__tri && typeof customRaw.__tri === 'object' ? customRaw.__tri : null;
      delete customRaw.__tri;
      delete customRaw.location;

      const resolveTri = (triVal: unknown, boolVal: unknown): 'yes' | 'no' | 'na' | boolean => {
        if (triVal === 'yes' || triVal === 'no' || triVal === 'na' || typeof triVal === 'boolean') {
          return triVal;
        }
        return Boolean(boolVal);
      };

      return {
        date: row.date,
        studyHours: row.study_hours != null ? Number(row.study_hours) : null,
        attendedClass: resolveTri(tri?.attendedClass, row.attended_class),
        pyqsSolved: row.pyqs_solved != null ? Number(row.pyqs_solved) : null,
        revisionDone: resolveTri(tri?.revisionDone, row.revision_done),
        mockTestTaken: resolveTri(tri?.mock_test_taken ?? tri?.mockTestTaken, row.mock_test_taken),
        sleepHours: row.sleep_hours != null ? Number(row.sleep_hours) : null,
        focusRating: row.focus_rating != null ? Number(row.focus_rating) : null,
        notes: row.notes || '',
        location: row.location || row.custom_data?.location || '',
        customData: customRaw,
      };
    });

    // Custom study tables: from dedicated table if available, or from metadata row
    let customTables: CustomStudyTable[] = [];
    const metaTablesMap = new Map<string, Partial<CustomStudyTable>>();
    if (metaTablesRow?.custom_data?.tables && Array.isArray(metaTablesRow.custom_data.tables)) {
      for (const mt of metaTablesRow.custom_data.tables) {
        if (mt?.id) metaTablesMap.set(mt.id, mt);
      }
    }
    if (customTablesRes?.data && Array.isArray(customTablesRes.data) && customTablesRes.data.length > 0) {
      customTables = (customTablesRes.data as any[]).map((row: any) => {
        const metaTbl = metaTablesMap.get(row.id);
        return {
          id: row.id,
          title: row.title,
          description: row.description || '',
          createdAt: row.created_at ? row.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          columns: Array.isArray(row.columns) ? row.columns : [],
          rows: Array.isArray(row.rows) ? row.rows : [],
          ...(typeof metaTbl?.autoGenerateRows === 'boolean' ? { autoGenerateRows: metaTbl.autoGenerateRows } : {}),
          ...(Array.isArray(metaTbl?.deletedRowDates) ? { deletedRowDates: metaTbl.deletedRowDates } : {}),
        };
      });
    } else if (metaTablesRow?.custom_data?.tables && Array.isArray(metaTablesRow.custom_data.tables)) {
      customTables = metaTablesRow.custom_data.tables;
    }

    const deletedCustomTableIds = (metaConfigRow?.custom_data?.deletedCustomTableIds as string[]) || [];

    // Filter out deleted tables and strip legacy demo fake rows
    customTables = customTables
      .filter((tbl) => tbl.id !== 'tbl-mock-tests' && !deletedCustomTableIds.includes(tbl.id))
      .map((tbl) => {
        const isCheck =
          tbl.id === 'tbl-check-demo' ||
          tbl.id === 'tbl-check' ||
          tbl.title?.trim().toLowerCase() === 'check';

        const nonDemoRows = (tbl.rows || []).filter((r: any) => {
          if (r.id === 'row-1' || r.id === 'row-2' || r.id === 'row-3' || r.id === 'row-4' || r.id === 'row-5') {
            if (
              r.values &&
              (r.values.col_score === 142 ||
                r.values.col_score === 118 ||
                r.values.col_score === 85 ||
                r.values.col_score === 48 ||
                r.values.col_score === 102)
            ) {
              return false;
            }
          }
          if (r.values?.col_paper && typeof r.values.col_paper === 'string') {
            const p = r.values.col_paper.toLowerCase();
            if (
              p.includes('cs mock') ||
              p.includes('full syllabus exam') ||
              p.includes('discrete math') ||
              p.includes('logical reasoning') ||
              p.includes('diagnostic test')
            ) {
              return false;
            }
          }
          if (r.notes && typeof r.notes === 'string') {
            const n = r.notes.toLowerCase();
            if (
              n.includes('revised dp and graph') ||
              n.includes('ran short of time') ||
              n.includes('permutations formulas') ||
              n.includes('fast completion under 18') ||
              n.includes('initial benchmark test')
            ) {
              return false;
            }
          }
          return true;
        });

        if (
          isCheck &&
          (nonDemoRows.length === 0 ||
            tbl.columns?.some((c: any) => c.id === 'col_paper' || c.id === 'col_difficulty') ||
            tbl.description?.toLowerCase().includes('mock exam'))
        ) {
          const todayIso = new Date().toISOString().split('T')[0];
          const yestIso = new Date(Date.now() - 86400000).toISOString().split('T')[0];
          return {
            ...tbl,
            description: 'Topic Checklist & Tracker',
            columns: [
              { id: 'col_topic', name: 'TOPIC', type: 'text' },
              { id: 'col_status', name: 'STATUS', type: 'boolean' },
            ],
            rows: nonDemoRows.length > 0 ? nonDemoRows : [
              { id: 'row-1', date: todayIso, values: { col_topic: '', col_status: 'na' }, notes: '', createdAt: new Date().toISOString() },
              { id: 'row-2', date: yestIso, values: { col_topic: '', col_status: 'na' }, notes: '', createdAt: new Date().toISOString() },
            ],
          };
        }

        return {
          ...tbl,
          rows: nonDemoRows,
        };
      });

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
      deletedCustomTableIds,
      isDefaultTableDeleted: Boolean(metaConfigRow?.custom_data?.isDefaultTableDeleted),
      autoGenerateRows:
        typeof metaConfigRow?.custom_data?.autoGenerateRows === 'boolean'
          ? metaConfigRow.custom_data.autoGenerateRows
          : undefined,
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

  const baseRecord = {
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
  };

  try {
    const { error } = await sb.from('study_sessions').upsert({
      ...baseRecord,
      location: session.location || null,
    });
    if (error) {
      // Fallback if the remote database schema has not yet added the `location` column
      if (error.message?.includes('location')) {
        const { error: retryErr } = await sb.from('study_sessions').upsert(baseRecord);
        if (retryErr) {
          console.error('[Supabase dbSaveStudySession Retry Error]:', retryErr.message, retryErr);
        }
        return;
      }
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

function toSqlBool(val: 'yes' | 'no' | 'na' | boolean | undefined | null): boolean {
  return val === 'yes' || val === true;
}

function buildDailyLogCustomData(entry: DailyLogEntry): Record<string, unknown> {
  return {
    ...(entry.customData || {}),
    location: entry.location || '',
    __tri: {
      attendedClass: entry.attendedClass,
      revisionDone: entry.revisionDone,
      mockTestTaken: entry.mockTestTaken,
    },
  };
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
        attended_class: toSqlBool(entry.attendedClass),
        pyqs_solved: entry.pyqsSolved,
        revision_done: toSqlBool(entry.revisionDone),
        mock_test_taken: toSqlBool(entry.mockTestTaken),
        sleep_hours: entry.sleepHours,
        focus_rating: entry.focusRating,
        notes: entry.notes || null,
        custom_data: buildDailyLogCustomData(entry),
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
      attended_class: toSqlBool(entry.attendedClass),
      pyqs_solved: entry.pyqsSolved,
      revision_done: toSqlBool(entry.revisionDone),
      mock_test_taken: toSqlBool(entry.mockTestTaken),
      sleep_hours: entry.sleepHours,
      focus_rating: entry.focusRating,
      notes: entry.notes || null,
      custom_data: buildDailyLogCustomData(entry),
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

export async function dbSaveTableConfig(
  userId: string,
  config: { deletedDefaultColumns: string[]; isDefaultTableDeleted: boolean; deletedCustomTableIds?: string[]; autoGenerateRows?: boolean }
) {
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
    const tableRecord = {
      id: table.id,
      user_id: userId,
      title: table.title,
      description: table.description || '',
      columns: table.columns || [],
      rows: table.rows || [],
      auto_generate_rows: table.autoGenerateRows ?? true,
      updated_at: new Date().toISOString(),
    };
    const { error: tblErr } = await sb.from('custom_tables').upsert(tableRecord);
    if (tblErr && tblErr.message?.includes('auto_generate_rows')) {
      delete (tableRecord as any).auto_generate_rows;
      await sb.from('custom_tables').upsert(tableRecord);
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
      const tableRecord = {
        id: table.id,
        user_id: userId,
        title: table.title,
        description: table.description || '',
        columns: table.columns || [],
        rows: table.rows || [],
        auto_generate_rows: table.autoGenerateRows ?? true,
        updated_at: new Date().toISOString(),
      };
      const { error } = await sb.from('custom_tables').upsert(tableRecord);
      if (error && error.message?.includes('auto_generate_rows')) {
        delete (tableRecord as any).auto_generate_rows;
        await sb.from('custom_tables').upsert(tableRecord);
      }
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
    tableConfig?: { deletedDefaultColumns: string[]; isDefaultTableDeleted: boolean; deletedCustomTableIds?: string[]; autoGenerateRows?: boolean };
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

  if (data.tableConfig) {
    promises.push(dbSaveTableConfig(userId, data.tableConfig));
  }

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
    const deletedSet = new Set(data.tableConfig?.deletedCustomTableIds || []);
    const cleanTables = data.customTables
      .filter((t) => t.id !== 'tbl-mock-tests' && !deletedSet.has(t.id))
      .map((t) => ({
        ...t,
        rows: (t.rows || []).filter((r: any) => {
          if (r.id === 'row-1' || r.id === 'row-2' || r.id === 'row-3' || r.id === 'row-4' || r.id === 'row-5') {
            if (
              r.values &&
              (r.values.col_score === 142 ||
                r.values.col_score === 118 ||
                r.values.col_score === 85 ||
                r.values.col_score === 48 ||
                r.values.col_score === 102)
            ) {
              return false;
            }
          }
          return true;
        }),
      }));
    promises.push(dbSaveAllCustomTables(userId, cleanTables));
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(val: string | undefined | null): val is string {
  return Boolean(val && UUID_REGEX.test(val.trim()));
}

function sanitizeFriendCode(code: string | undefined | null): string {
  if (!code) return '';
  return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

// Complete Account & Data Deletion from all Database Tables
export async function dbDeleteAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  const sb = getSupabaseClient();
  if (!sb || !userId) {
    return { success: false, error: 'Database client not connected.' };
  }
  await ensureSupabaseAuth(userId);

  try {
    // 1. Try PostgreSQL RPC function if available (deletes auth.users record which cascades all tables)
    try {
      const { error: rpcError } = await sb.rpc('delete_user_account');
      if (!rpcError) {
        await sb.auth.signOut().catch(() => {});
        return { success: true };
      }
    } catch {
      // Fallback to table-by-table cascade deletion
    }

    // 2. Cascade delete all user records from every database table where user_id = auth.uid()
    const cleanTasks: Promise<unknown>[] = [
      Promise.resolve(sb.from('daily_logs').delete().eq('user_id', userId)),
      Promise.resolve(sb.from('custom_tables').delete().eq('user_id', userId)),
      Promise.resolve(sb.from('custom_columns').delete().eq('user_id', userId)),
      Promise.resolve(sb.from('tasks').delete().eq('user_id', userId)),
      Promise.resolve(sb.from('study_sessions').delete().eq('user_id', userId)),
      Promise.resolve(sb.from('subjects').delete().eq('user_id', userId)),
      Promise.resolve(sb.from('exam_countdowns').delete().eq('user_id', userId)),
      Promise.resolve(sb.from('profiles').delete().eq('id', userId)),
    ];

    if (isValidUuid(userId)) {
      cleanTasks.push(
        Promise.resolve(sb.from('friendships').delete().or(`user_id.eq.${userId},friend_id.eq.${userId}`)),
        Promise.resolve(sb.from('friend_requests').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`))
      );
    }

    await Promise.allSettled(cleanTasks);

    // Sign out the user
    await sb.auth.signOut().catch(() => {});
    return { success: true };
  } catch (err: any) {
    console.error('[Supabase dbDeleteAccount Error]:', err);
    return { success: false, error: err?.message || 'Failed to delete account from database.' };
  }
}

export interface SearchedStudentPeer {
  id: string;
  name: string;
  email?: string;
  friendCode: string;
  streakDays: number;
  dailyTargetMinutes: number;
  longestStreak?: number;
  lastStudiedDate?: string;
}

// Search student peer by unique 4-5 digit friend code in Supabase
export async function dbSearchProfileByFriendCode(friendCode: string): Promise<SearchedStudentPeer | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  const cleanCode = sanitizeFriendCode(friendCode);
  if (!cleanCode) return null;

  try {
    const { data, error } = await sb
      .from('profiles')
      .select('id, name, streak_days, daily_target_minutes, longest_streak, last_studied_date, friend_code')
      .ilike('friend_code', cleanCode)
      .maybeSingle();

    if (error) {
      console.warn('[dbSearchProfileByFriendCode query error]:', error.message);
      return null;
    }

    if (data && data.name) {
      return {
        id: data.id,
        name: data.name,
        friendCode: (data.friend_code || cleanCode).toUpperCase(),
        streakDays: Number(data.streak_days) || 0,
        dailyTargetMinutes: Number(data.daily_target_minutes) || 360,
        longestStreak: Number(data.longest_streak) || 0,
        lastStudiedDate: data.last_studied_date || undefined,
      };
    }
  } catch (err) {
    console.warn('[dbSearchProfileByFriendCode exception]:', err);
  }
  return null;
}

// ==========================================================
// REAL-TIME FRIEND REQUESTS & FRIENDSHIPS (SUPABASE BACKEND)
// ==========================================================

export interface FriendRequestRow {
  id: string;
  sender_id: string;
  sender_code: string;
  sender_name: string;
  receiver_id: string;
  receiver_code: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// 1. Send Friend Request via Supabase
export async function dbSendFriendRequest(
  senderId: string,
  senderCode: string,
  senderName: string,
  receiverCode: string
): Promise<{ success: boolean; message: string; receiver?: SearchedStudentPeer; requestId?: string }> {
  const sb = getSupabaseClient();
  if (!sb || !isValidUuid(senderId)) {
    return { success: false, message: 'Supabase client is not connected.' };
  }
  await ensureSupabaseAuth(senderId);

  const cleanReceiverCode = sanitizeFriendCode(receiverCode);
  const cleanSenderCode = sanitizeFriendCode(senderCode);

  if (!cleanReceiverCode) {
    return { success: false, message: 'Please enter a valid student code.' };
  }

  if (cleanReceiverCode === cleanSenderCode) {
    return { success: false, message: 'You cannot connect with your own student code!' };
  }

  try {
    // A. Verify receiver exists in Supabase profiles
    const receiver = await dbSearchProfileByFriendCode(cleanReceiverCode);
    if (!receiver || !isValidUuid(receiver.id)) {
      return { success: false, message: `No registered student found with code #${cleanReceiverCode}.` };
    }

    if (receiver.id === senderId) {
      return { success: false, message: 'You cannot connect with your own account!' };
    }

    // B. Check if already friends
    const { data: existingFriendship } = await sb
      .from('friendships')
      .select('id')
      .eq('user_id', senderId)
      .eq('friend_id', receiver.id)
      .maybeSingle();

    if (existingFriendship) {
      return { success: false, message: `${receiver.name} is already in your study circle!` };
    }

    // C. Check if request already exists
    const { data: existingRequest } = await sb
      .from('friend_requests')
      .select('id, status, sender_id')
      .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiver.id}),and(sender_id.eq.${receiver.id},receiver_id.eq.${senderId})`)
      .maybeSingle();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        if (existingRequest.sender_id === senderId) {
          return { success: false, message: `Friend request is already pending for ${receiver.name}.` };
        } else {
          // The other user already sent us a request! Auto-accept it.
          await dbAcceptFriendRequest(existingRequest.id, senderId);
          return { success: true, message: `Accepted incoming friend request from ${receiver.name}!`, receiver, requestId: existingRequest.id };
        }
      }
      if (existingRequest.status === 'accepted') {
        return { success: false, message: `${receiver.name} is already in your study circle!` };
      }
    }

    // D. Insert / update friend request
    const { data: inserted, error: insertErr } = await sb
      .from('friend_requests')
      .upsert({
        sender_id: senderId,
        sender_code: cleanSenderCode,
        sender_name: senderName,
        receiver_id: receiver.id,
        receiver_code: cleanReceiverCode,
        status: 'pending',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'sender_id,receiver_id' })
      .select('id')
      .single();

    if (insertErr) {
      console.error('[dbSendFriendRequest Error]:', insertErr);
      return { success: false, message: insertErr.message || 'Failed to send request on cloud.' };
    }

    return {
      success: true,
      message: `Friend request sent to ${receiver.name} (#${cleanReceiverCode})!`,
      receiver,
      requestId: inserted?.id,
    };
  } catch (err: any) {
    console.error('[dbSendFriendRequest Exception]:', err);
    return { success: false, message: err?.message || 'Unexpected error while sending request.' };
  }
}

// 2. Fetch Incoming and Outgoing Friend Requests
export async function dbFetchFriendRequests(userId: string): Promise<{
  incoming: FriendRequestRow[];
  outgoing: FriendRequestRow[];
}> {
  const sb = getSupabaseClient();
  if (!sb || !isValidUuid(userId)) return { incoming: [], outgoing: [] };
  await ensureSupabaseAuth(userId);

  try {
    const [incomingRes, outgoingRes] = await Promise.all([
      sb
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      sb
        .from('friend_requests')
        .select('*')
        .eq('sender_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
    ]);

    return {
      incoming: (incomingRes.data as FriendRequestRow[]) || [],
      outgoing: (outgoingRes.data as FriendRequestRow[]) || [],
    };
  } catch (err) {
    console.warn('[dbFetchFriendRequests Exception]:', err);
    return { incoming: [], outgoing: [] };
  }
}

// 3. Accept Friend Request
export async function dbAcceptFriendRequest(
  requestId: string,
  userId: string
): Promise<{ success: boolean; message?: string }> {
  const sb = getSupabaseClient();
  if (!sb || !isValidUuid(userId) || !isValidUuid(requestId)) {
    return { success: false, message: 'Not connected' };
  }
  await ensureSupabaseAuth(userId);

  try {
    // A. Fetch request details
    const { data: req, error: fetchErr } = await sb
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchErr || !req) {
      return { success: false, message: 'Request not found.' };
    }

    if (req.receiver_id !== userId) {
      return { success: false, message: 'Only the recipient can accept this friend request.' };
    }

    // B. Fetch receiver name
    const { data: receiverProfile } = await sb
      .from('profiles')
      .select('name, friend_code')
      .eq('id', userId)
      .maybeSingle();

    const receiverName = receiverProfile?.name || 'Student';
    const receiverCode = receiverProfile?.friend_code || req.receiver_code;

    // C. Update request status to accepted
    await sb
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('receiver_id', userId);

    // D. Upsert reciprocal friendship records (both directions; second one is best-effort if RLS restricts it on legacy schema)
    await Promise.allSettled([
      sb.from('friendships').upsert({
        user_id: req.receiver_id,
        friend_id: req.sender_id,
        friend_code: req.sender_code,
        friend_name: req.sender_name,
      }, { onConflict: 'user_id,friend_id' }),
      sb.from('friendships').upsert({
        user_id: req.sender_id,
        friend_id: req.receiver_id,
        friend_code: receiverCode,
        friend_name: receiverName,
      }, { onConflict: 'user_id,friend_id' }),
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('[dbAcceptFriendRequest Error]:', err);
    return { success: false, message: err?.message || 'Failed to accept request.' };
  }
}

// 4. Decline Friend Request
export async function dbDeclineFriendRequest(
  requestId: string,
  userId: string
): Promise<{ success: boolean }> {
  const sb = getSupabaseClient();
  if (!sb || !isValidUuid(userId) || !isValidUuid(requestId)) return { success: false };
  await ensureSupabaseAuth(userId);

  try {
    const { error } = await sb
      .from('friend_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', requestId)
      .eq('receiver_id', userId);

    return { success: !error };
  } catch (err) {
    console.error('[dbDeclineFriendRequest Error]:', err);
    return { success: false };
  }
}

// 5. Cancel Outgoing Friend Request
export async function dbCancelFriendRequest(
  requestId: string,
  userId: string
): Promise<{ success: boolean }> {
  const sb = getSupabaseClient();
  if (!sb || !isValidUuid(userId) || !isValidUuid(requestId)) return { success: false };
  await ensureSupabaseAuth(userId);

  try {
    const { error } = await sb
      .from('friend_requests')
      .delete()
      .eq('id', requestId)
      .eq('sender_id', userId);

    return { success: !error };
  } catch (err) {
    console.error('[dbCancelFriendRequest Error]:', err);
    return { success: false };
  }
}

// 6. Remove Friend
export async function dbRemoveFriend(
  userId: string,
  friendIdOrCode: string
): Promise<{ success: boolean }> {
  const sb = getSupabaseClient();
  if (!sb || !isValidUuid(userId) || !friendIdOrCode) return { success: false };
  await ensureSupabaseAuth(userId);

  try {
    const trimmed = friendIdOrCode.trim();
    if (isValidUuid(trimmed)) {
      await Promise.allSettled([
        sb.from('friendships').delete().eq('user_id', userId).eq('friend_id', trimmed),
        sb.from('friendships').delete().eq('friend_id', userId).eq('user_id', trimmed),
        sb.from('friend_requests').delete().or(`and(sender_id.eq.${userId},receiver_id.eq.${trimmed}),and(sender_id.eq.${trimmed},receiver_id.eq.${userId})`),
      ]);
    } else {
      const cleanCode = sanitizeFriendCode(trimmed);
      if (!cleanCode) return { success: false };
      // Also look up friend UUID by code if possible so reciprocal rows and requests are cleaned up
      const peer = await dbSearchProfileByFriendCode(cleanCode);
      const ops: Promise<unknown>[] = [
        Promise.resolve(sb.from('friendships').delete().eq('user_id', userId).ilike('friend_code', cleanCode)),
      ];
      if (peer && isValidUuid(peer.id)) {
        ops.push(
          Promise.resolve(sb.from('friendships').delete().eq('user_id', userId).eq('friend_id', peer.id)),
          Promise.resolve(sb.from('friendships').delete().eq('friend_id', userId).eq('user_id', peer.id)),
          Promise.resolve(sb.from('friend_requests').delete().or(`and(sender_id.eq.${userId},receiver_id.eq.${peer.id}),and(sender_id.eq.${peer.id},receiver_id.eq.${userId})`))
        );
      }
      await Promise.allSettled(ops);
    }
    return { success: true };
  } catch (err) {
    console.error('[dbRemoveFriend Error]:', err);
    return { success: false };
  }
}

// 7. Fetch Live Friends from Supabase
export async function dbFetchFriends(userId: string): Promise<SearchedStudentPeer[]> {
  const sb = getSupabaseClient();
  if (!sb || !isValidUuid(userId)) return [];
  await ensureSupabaseAuth(userId);

  try {
    const [directRes, reverseRes, acceptedReqRes] = await Promise.all([
      sb
        .from('friendships')
        .select('friend_id, friend_code, friend_name')
        .eq('user_id', userId),
      sb
        .from('friendships')
        .select('user_id')
        .eq('friend_id', userId),
      sb
        .from('friend_requests')
        .select('sender_id, sender_code, sender_name, receiver_id, receiver_code')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
    ]);

    const friendMetaMap = new Map<string, { code: string; name: string }>();

    for (const f of directRes.data || []) {
      if (f.friend_id && f.friend_id !== userId) {
        friendMetaMap.set(f.friend_id, {
          code: f.friend_code || '',
          name: f.friend_name || 'Student',
        });
      }
    }

    for (const r of reverseRes.data || []) {
      if (r.user_id && r.user_id !== userId && !friendMetaMap.has(r.user_id)) {
        friendMetaMap.set(r.user_id, { code: '', name: 'Student' });
      }
    }

    for (const req of acceptedReqRes.data || []) {
      const peerId = req.sender_id === userId ? req.receiver_id : req.sender_id;
      const peerCode = req.sender_id === userId ? req.receiver_code : req.sender_code;
      const peerName = req.sender_id === userId ? 'Student' : req.sender_name;
      if (peerId && peerId !== userId && !friendMetaMap.has(peerId)) {
        friendMetaMap.set(peerId, { code: peerCode || '', name: peerName || 'Student' });
      }
    }

    const friendIds = Array.from(friendMetaMap.keys());
    if (friendIds.length === 0) {
      return [];
    }

    const { data: profiles } = await sb
      .from('profiles')
      .select('id, name, streak_days, daily_target_minutes, longest_streak, last_studied_date, friend_code')
      .in('id', friendIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    return friendIds.map((friendId) => {
      const meta = friendMetaMap.get(friendId);
      const p = profileMap.get(friendId);
      return {
        id: friendId,
        name: p?.name || meta?.name || 'Student',
        friendCode: (p?.friend_code || meta?.code || '').toUpperCase(),
        streakDays: Number(p?.streak_days) || 0,
        dailyTargetMinutes: Number(p?.daily_target_minutes) || 360,
        longestStreak: Number(p?.longest_streak) || 0,
        lastStudiedDate: p?.last_studied_date || undefined,
      };
    });
  } catch (err) {
    console.warn('[dbFetchFriends Error]:', err);
    return [];
  }
}

