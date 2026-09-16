import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables or localStorage config
const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
let supabaseUrl = metaEnv.VITE_SUPABASE_URL || metaEnv.NEXT_PUBLIC_SUPABASE_URL || '';
let supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Allow runtime override via localStorage for client testing
if (typeof window !== 'undefined') {
  const savedUrl = localStorage.getItem('everlast_supabase_url');
  const savedKey = localStorage.getItem('everlast_supabase_anon_key');
  if (savedUrl) supabaseUrl = savedUrl;
  if (savedKey) supabaseAnonKey = savedKey;
}

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
}

export function configureSupabase(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('everlast_supabase_url', url);
    localStorage.setItem('everlast_supabase_anon_key', anonKey);
    supabaseUrl = url;
    supabaseAnonKey = anonKey;
    if (url && anonKey) {
      supabase = createClient(url, anonKey);
    } else {
      supabase = null;
    }
  }
}

export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    isConnected: !!(supabaseUrl && supabaseAnonKey)
  };
}

/**
 * The complete, production-ready Supabase Postgres SQL migration script
 * as specified in Section 5 of the Everlast Bathrooms Technical Specification.
 */
export const SUPABASE_SQL_SCHEMA = `-- Everlast Bathrooms — Service Call Portal
-- Milestone 1 & 2 Database Schema & Row-Level Security (RLS)
-- Run this in your Supabase SQL Editor

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'office', 'installer');
CREATE TYPE call_priority AS ENUM ('low', 'mid', 'high');
CREATE TYPE call_status AS ENUM ('open', 'in_progress', 'blocked', 'completed', 'cancelled');
CREATE TYPE responsibility AS ENUM ('installer', 'office', 'manufacturer', 'client', 'unknown');
CREATE TYPE billing_type AS ENUM ('unpaid', 'paid', 'undecided');
CREATE TYPE attachment_kind AS ENUM ('image', 'video', 'document');
CREATE TYPE attachment_phase AS ENUM ('reported', 'resolution');
CREATE TYPE note_visibility AS ENUM ('shared', 'internal');

-- 2. Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 2 AND 120),
  role user_role NOT NULL DEFAULT 'installer',
  email TEXT NOT NULL UNIQUE,
  phone TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notify_by_email BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role_active ON profiles (role) WHERE is_active = true;
CREATE INDEX idx_profiles_email ON profiles (email);

-- 3. Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (length(name) >= 2),
  phone TEXT NULL,
  email TEXT NULL,
  address TEXT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Service Calls (The core table)
CREATE TABLE service_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number TEXT NOT NULL CHECK (length(job_number) BETWEEN 1 AND 30),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  installer_id UUID NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  install_date DATE NULL,
  priority call_priority NOT NULL DEFAULT 'low',
  description TEXT NOT NULL CHECK (length(description) BETWEEN 3 AND 4000),
  responsibility responsibility NOT NULL DEFAULT 'installer',
  billing billing_type NOT NULL DEFAULT 'undecided',
  status call_status NOT NULL DEFAULT 'open',
  completion_note TEXT NULL,
  completed_at TIMESTAMPTZ NULL,
  completed_by UUID NULL REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT completed_fields_present CHECK (
    (status <> 'completed')
    OR (completed_at IS NOT NULL AND completed_by IS NOT NULL)
  ),
  CONSTRAINT blocked_needs_reason CHECK (
    status <> 'blocked' OR (completion_note IS NOT NULL AND length(completion_note) > 0)
  ),
  CONSTRAINT install_before_report CHECK (
    install_date IS NULL OR install_date <= reported_date
  )
);

CREATE INDEX idx_service_calls_installer_status ON service_calls (installer_id, status);
CREATE INDEX idx_service_calls_reported_desc ON service_calls (reported_date DESC);
CREATE INDEX idx_service_calls_open ON service_calls (status) WHERE status <> 'completed';
CREATE INDEX idx_service_calls_job_number ON service_calls (job_number);
CREATE INDEX idx_service_calls_client ON service_calls (client_id);

-- 5. Attachments
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id UUID NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 104857600),
  kind attachment_kind NOT NULL,
  phase attachment_phase NOT NULL DEFAULT 'reported',
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attachments_call_phase ON attachments (service_call_id, phase);

-- 6. Service Call Notes
CREATE TABLE service_call_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id UUID NOT NULL REFERENCES service_calls(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  visibility note_visibility NOT NULL DEFAULT 'shared',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notes_call_time ON service_call_notes (service_call_id, created_at DESC);

-- 7. Installer Monthly Stats (Denominator for 90-day rate)
CREATE TABLE installer_monthly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_month DATE NOT NULL,
  projects_completed INTEGER NOT NULL CHECK (projects_completed >= 0),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unq_installer_month UNIQUE (installer_id, period_month)
);

-- 8. Notification Log
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id UUID REFERENCES service_calls(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('new_call','updated','reassigned','overdue','completed')),
  provider_id TEXT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT NULL,
  sent_at TIMESTAMPTZ NULL,
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unq_notification_day UNIQUE (service_call_id, recipient_email, event_type, created_date)
);

-- 9. Row-Level Security (RLS) - CRITICAL: Database-Level Isolation
CREATE OR REPLACE FUNCTION auth_role() RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

ALTER TABLE service_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "installers read own calls" ON service_calls;
CREATE POLICY "installers read own calls"
ON service_calls FOR SELECT
USING (
  auth_role() IN ('admin', 'office')
  OR installer_id = auth.uid()
);

DROP POLICY IF EXISTS "office and admin insert" ON service_calls;
CREATE POLICY "office and admin insert"
ON service_calls FOR INSERT
WITH CHECK (auth_role() IN ('admin', 'office'));

DROP POLICY IF EXISTS "office and admin update anything" ON service_calls;
CREATE POLICY "office and admin update anything"
ON service_calls FOR UPDATE
USING (auth_role() IN ('admin', 'office'));

-- 10. RPC: installer_complete_call (Constrained Installer Action)
CREATE OR REPLACE FUNCTION installer_complete_call(
  p_call_id UUID,
  p_status call_status,
  p_note TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_status NOT IN ('completed', 'blocked', 'in_progress') THEN
    RAISE EXCEPTION 'Installers cannot set status %', p_status;
  END IF;

  IF p_status = 'blocked' AND (p_note IS NULL OR length(trim(p_note)) = 0) THEN
    RAISE EXCEPTION 'A reason note is required when marking a call blocked';
  END IF;

  UPDATE service_calls
     SET status          = p_status,
         completion_note = p_note,
         completed_at    = CASE WHEN p_status = 'completed' THEN now() END,
         completed_by    = CASE WHEN p_status = 'completed' THEN auth.uid() END,
         updated_at      = now()
   WHERE id = p_call_id
     AND installer_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Call not found or not assigned to you';
  END IF;
END $$;

-- 11. The 90-day Service Call Rate View
CREATE OR REPLACE VIEW installer_service_rate_90d AS
SELECT
  p.id AS installer_id,
  p.full_name,
  coalesce(sum(s.projects_completed), 0) AS total_projects,
  count(distinct c.id) AS total_service_calls,
  CASE
    WHEN coalesce(sum(s.projects_completed), 0) = 0 THEN NULL
    ELSE round(
      count(distinct c.id)::numeric
      / sum(s.projects_completed)::numeric * 100, 0)
  END AS service_call_pct
FROM profiles p
LEFT JOIN installer_monthly_stats s
  ON s.installer_id = p.id
 AND s.period_month >= date_trunc('month', CURRENT_DATE - INTERVAL '90 days')
LEFT JOIN service_calls c
  ON c.installer_id = p.id
 AND c.reported_date >= CURRENT_DATE - INTERVAL '90 days'
 AND c.responsibility = 'installer'
WHERE p.role = 'installer' AND p.is_active = true
GROUP BY p.id, p.full_name;
`;
