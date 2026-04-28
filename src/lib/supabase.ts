import { createClient } from "@supabase/supabase-js";

/**
 * OS³ Command Centre — Supabase client
 *
 * URL + anon key are read from Vite env vars so we can ship cleanly to Vercel.
 * For local dev safety, we fall back to the previously hardcoded values if
 * the env vars are missing — but production should always supply them.
 *
 * Auth flow: magic-link (PKCE), session persisted to localStorage,
 * URL-hash detection enabled so the /auth/callback route just works.
 */
const FALLBACK_URL = "https://uxeolplwhtyyefpmwktw.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4ZW9scGx3aHR5eWVmcG13a3R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzYwMDYsImV4cCI6MjA4ODIxMjAwNn0.YSYxPMgdUiMpz32qg7YfoQw87_tP8U_nctdS9VXSRb0";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? FALLBACK_URL;
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  FALLBACK_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "os3-command-centre-auth",
  },
});

// ── Hub table types ────────────────────────────────────────────────────────
export type HubTask = {
  id: string;
  clickup_id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: number;
  due_date?: string;
  space?: string;
  folder?: string;
  list_name?: string;
  tags?: string[];
  url?: string;
  synced_at: string;
};

export type HubCalendarEvent = {
  id: string;
  gcal_id: string;
  title: string;
  calendar_name?: string;
  calendar_colour?: string;
  start_time?: string;
  end_time?: string;
  all_day?: boolean;
  location?: string;
  description?: string;
  meet_link?: string;
  synced_at: string;
};

export type HubEmail = {
  id: string;
  gmail_id: string;
  thread_id?: string;
  subject?: string;
  sender?: string;
  sender_email?: string;
  snippet?: string;
  is_unread?: boolean;
  has_attachment?: boolean;
  labels?: string[];
  received_at?: string;
  synced_at: string;
};

export type HubDeploy = {
  id: string;
  vercel_id: string;
  project_name?: string;
  status?: string;
  url?: string;
  branch?: string;
  commit_message?: string;
  duration_ms?: number;
  error_message?: string;
  deployed_at?: string;
  synced_at: string;
};

export type SyncStatus = {
  id: string;
  source: string;
  last_synced_at?: string;
  last_status?: string;
  error_message?: string;
  record_count?: number;
  updated_at: string;
};

export type HubBriefing = {
  id: string;
  briefing_type: "morning" | "evening" | "sunday";
  title?: string;
  body_md?: string;
  body_html?: string;
  model?: string;
  generated_at: string;
  for_date?: string;
  metadata?: Record<string, unknown>;
};

export type HubProductivitySession = {
  id: string;
  session_type: "focus" | "break" | "long_break";
  duration_minutes: number;
  started_at: string;
  ended_at?: string;
  source?: string;
  tag?: string;
  notes?: string;
};

/**
 * NOTE: HubBraveheart was extended in migration 001_initial_os3_schema.sql.
 * The fields below mirror the live schema after that migration runs.
 * Old fields (party, court, case_number, event_type, event_date) were
 * removed in a follow-up cleanup — if any UI still references them,
 * grep and update on your next pass.
 */
export type HubBraveheart = {
  id: string;
  matter_ref?: string;
  title: string;
  creditor?: string;
  matter_type?: string;
  severity?: string;
  status?: string;
  court_date?: string;
  court_label?: string;
  next_action?: string;
  next_action_due?: string;
  related_gmail_thread_id?: string;
  amount_zar?: number;
  notes?: string;
  // ── Migration 001 additions ────────────────────────
  account_ref?: string;
  priority?: "Critical" | "High" | "Medium" | "Low";
  response_status?: "red" | "amber" | "green" | "unknown";
  on_credit_record?: boolean;
  imed_status?: string;
  action_status?: string;
  attorney_name?: string;
  attorney_meta?: Record<string, unknown>;
  last_correspondence_at?: string;
  updated_at?: string;
  synced_at: string;
};

export type HubSubscription = {
  id: string;
  service: string;
  plan?: string;
  status?: string;
  cost_amount?: number;
  cost_currency?: string;
  billing_cycle?: string;
  next_renewal?: string;
  owner?: string;
  category?: string;
  notes?: string;
  synced_at: string;
};
