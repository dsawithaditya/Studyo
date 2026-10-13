import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_SQL_SCHEMA = `-- PostgreSQL Schema for Study Tracker PWA
-- Run this in Supabase SQL Editor

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'BookOpen',
    color TEXT DEFAULT '#6366f1',
    exam_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT,
    formulas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Study Sessions Table (Crucial for Analytics)
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL,
    focus_rating SMALLINT CHECK (focus_rating BETWEEN 1 AND 5),
    mode TEXT CHECK (mode IN ('pomodoro', 'stopwatch')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('high', 'med', 'low')),
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    estimated_pomodoros SMALLINT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- 6. INDEXES FOR LIGHTNING FAST AGGREGATION (< 15ms Analytics)
-- Composite indices on (user_id, created_at) and (user_id, subject_id)
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON public.study_sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_subject ON public.study_sessions (user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON public.tasks (user_id, due_date);

-- ==========================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures complete student privacy & data isolation
-- ==========================================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage own subjects" 
ON public.subjects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Students can manage own chapters" 
ON public.chapters FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Students can manage own sessions" 
ON public.study_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Students can manage own tasks" 
ON public.tasks FOR ALL USING (auth.uid() = user_id);
`;

let client: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const envUrl = url || (import.meta.env.VITE_SUPABASE_URL as string);
  const envKey = key || (import.meta.env.VITE_SUPABASE_ANON_KEY as string);

  if (!envUrl || !envKey) {
    return null;
  }

  if (!client) {
    try {
      client = createClient(envUrl, envKey);
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return client;
}

export function resetSupabaseClient(url: string, key: string): SupabaseClient | null {
  try {
    client = createClient(url, key);
    return client;
  } catch {
    client = null;
    return null;
  }
}
