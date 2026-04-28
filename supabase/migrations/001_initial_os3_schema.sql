-- ============================================================================
-- OS³ Command Centre — Phase 1 Initial Schema  (ADDITIVE)
-- Project: uxeolplwhtyyefpmwktw (eu-west-1)
-- Date:    2026-04-25
-- Auth:    Supabase magic-link email; RLS locked to authenticated users
--
-- This migration is purely ADDITIVE. It assumes the live database already has:
--   hub_tasks, hub_calendar, hub_emails, hub_deploys,
--   hub_braveheart, hub_subscriptions, hub_subscriptions_meta,
--   hub_briefings, hub_productivity_sessions, hub_sync_status,
--   hub_automation_log, plus several non-hub tables.
--
-- It does NOT drop or rewrite any existing column. It only:
--   (a) ADDs columns/constraints/indexes to existing hub_* tables
--   (b) CREATEs the genuinely new hub_* tables for the 14-panel app
--   (c) ENABLES RLS + auth-only policy ONLY on the new tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Shared helper: updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- A. hub_braveheart  →  becomes the creditors-of-record table for BRAVEHEART
--    (BRAVEHEART matters and the creditor accounts they relate to are the
--     same row; we extend the existing schema rather than fork a new table)
-- ============================================================================
alter table public.hub_braveheart
  add column if not exists account_ref            text,
  add column if not exists priority               text,
  add column if not exists response_status        text,
  add column if not exists on_credit_record       boolean default false,
  add column if not exists imed_status            text,
  add column if not exists action_status          text,
  add column if not exists attorney_name          text,
  add column if not exists attorney_meta          jsonb default '{}'::jsonb,
  add column if not exists last_correspondence_at timestamptz,
  add column if not exists updated_at             timestamptz default now();

-- CHECK constraints (idempotent)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'hub_braveheart_priority_check') then
    alter table public.hub_braveheart
      add constraint hub_braveheart_priority_check
      check (priority is null or priority in ('Critical','High','Medium','Low'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'hub_braveheart_response_status_check') then
    alter table public.hub_braveheart
      add constraint hub_braveheart_response_status_check
      check (response_status is null or response_status in ('red','amber','green','unknown'));
  end if;
end $$;

create index if not exists idx_braveheart_priority on public.hub_braveheart(priority);
create index if not exists idx_braveheart_action   on public.hub_braveheart(action_status);

drop trigger if exists trg_braveheart_updated on public.hub_braveheart;
create trigger trg_braveheart_updated before update on public.hub_braveheart
  for each row execute function public.set_updated_at();

-- ============================================================================
-- B. hub_sync_status  →  also powers the CONFIG / Integrations dashboard
--    (already has source, last_synced_at, last_status, error_message,
--     record_count, updated_at — we add the display + heartbeat fields)
-- ============================================================================
alter table public.hub_sync_status
  add column if not exists display_name text,
  add column if not exists category     text,
  add column if not exists enabled      boolean default true,
  add column if not exists endpoint     text,
  add column if not exists latency_ms   integer;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'hub_sync_status_category_check') then
    alter table public.hub_sync_status
      add constraint hub_sync_status_category_check
      check (category is null or category in ('mcp','api','script','scheduler','tunnel','db','ingest','other'));
  end if;
end $$;

-- ============================================================================
-- C. NEW TABLES — the 12 panels that have nothing in the DB yet
-- ============================================================================

-- 1. hub_daily_intentions  (Productivity gadget — single intention per day)
create table if not exists public.hub_daily_intentions (
  id          uuid primary key default gen_random_uuid(),
  for_date    date not null unique,
  intention   text not null,
  created_at  timestamptz default now()
);

-- 2. hub_daily_reviews  (Productivity gadget — 3 wins / 1 lesson)
create table if not exists public.hub_daily_reviews (
  id          uuid primary key default gen_random_uuid(),
  for_date    date not null unique,
  win_1       text,
  win_2       text,
  win_3       text,
  lesson      text,
  mood        smallint check (mood between 1 and 5),
  created_at  timestamptz default now()
);

-- 3. hub_reading_queue  (Productivity gadget — saved articles/books)
create table if not exists public.hub_reading_queue (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  url          text,
  source       text,
  added_at     timestamptz default now(),
  read_at      timestamptz,
  archived     boolean default false,
  notes        text,
  tags         text[] default array[]::text[]
);
create index if not exists idx_reading_unread on public.hub_reading_queue(read_at) where read_at is null;

-- 4. hub_links  (Links page — clickable index of clients/projects/refs)
create table if not exists public.hub_links (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  url         text not null,
  category    text,
  pinned      boolean default false,
  sort_order  integer default 100,
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
drop trigger if exists trg_links_updated on public.hub_links;
create trigger trg_links_updated before update on public.hub_links
  for each row execute function public.set_updated_at();

-- 5. hub_notes_dump  (Dropbox/Notes page — quick captures + apple-mcp mirror)
create table if not exists public.hub_notes_dump (
  id          uuid primary key default gen_random_uuid(),
  body        text not null,
  source      text,                              -- 'apple-notes','dropbox','manual','quick-capture'
  source_ref  text,                              -- external id if applicable
  pinned      boolean default false,
  archived    boolean default false,
  tags        text[] default array[]::text[],
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists idx_notes_recent on public.hub_notes_dump(created_at desc) where archived = false;
drop trigger if exists trg_notes_updated on public.hub_notes_dump;
create trigger trg_notes_updated before update on public.hub_notes_dump
  for each row execute function public.set_updated_at();

-- 6. hub_quick_capture  (Relay → ClickUp Inbox Triage)
create table if not exists public.hub_quick_capture (
  id                uuid primary key default gen_random_uuid(),
  body              text not null,
  pushed_to_clickup boolean default false,
  clickup_task_id   text,
  pushed_at         timestamptz,
  created_at        timestamptz default now()
);
create index if not exists idx_qc_pending on public.hub_quick_capture(pushed_to_clickup) where pushed_to_clickup = false;

-- 7. hub_marketing_leads  (Marketing / CRM)
create table if not exists public.hub_marketing_leads (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text,
  phone         text,
  company       text,
  source        text,                            -- 'meta-ads','referral','website','linkedin','manual'
  campaign      text,
  stage         text check (stage in ('new','qualified','contacted','proposal','won','lost')) default 'new',
  exposure_zar  numeric(14,2),
  notes         text,
  last_touch_at timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_leads_stage on public.hub_marketing_leads(stage);
drop trigger if exists trg_leads_updated on public.hub_marketing_leads;
create trigger trg_leads_updated before update on public.hub_marketing_leads
  for each row execute function public.set_updated_at();

-- 8. hub_news_items  (News page — RSS + Gmail ai-news label)
create table if not exists public.hub_news_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  url          text,
  source       text,                             -- 'rss:hn','rss:tech','gmail:ai-news'
  source_ref   text,
  summary      text,
  published_at timestamptz,
  read         boolean default false,
  starred      boolean default false,
  tags         text[] default array[]::text[],
  created_at   timestamptz default now()
);
create index if not exists idx_news_recent on public.hub_news_items(published_at desc);
create unique index if not exists uniq_news_source on public.hub_news_items(source, source_ref) where source_ref is not null;

-- 9. hub_media_items  (Media kanban — ideas/prompts/rendering)
create table if not exists public.hub_media_items (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  kind         text check (kind in ('image','video','audio','copy','design','other')) default 'image',
  status       text check (status in ('idea','prompt-ready','rendering','review','done','archived')) default 'idea',
  prompt       text,
  asset_url    text,
  thumb_url    text,
  notes        text,
  tags         text[] default array[]::text[],
  sort_order   integer default 100,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists idx_media_status on public.hub_media_items(status);
drop trigger if exists trg_media_updated on public.hub_media_items;
create trigger trg_media_updated before update on public.hub_media_items
  for each row execute function public.set_updated_at();

-- 10. hub_monthly_chronicles  (Monthly Chronicle — current + archive)
create table if not exists public.hub_monthly_chronicles (
  id           uuid primary key default gen_random_uuid(),
  for_month    date not null unique,             -- first day of month
  title        text,
  highlights   text,
  metrics      jsonb default '{}'::jsonb,
  body_md      text,
  is_current   boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists idx_chronicle_month on public.hub_monthly_chronicles(for_month desc);
drop trigger if exists trg_chronicle_updated on public.hub_monthly_chronicles;
create trigger trg_chronicle_updated before update on public.hub_monthly_chronicles
  for each row execute function public.set_updated_at();

-- 11. hub_whatsapp_messages  (WhatsApp bridge log — read-only mirror)
create table if not exists public.hub_whatsapp_messages (
  id           uuid primary key default gen_random_uuid(),
  jid          text not null,
  display_name text,
  direction    text check (direction in ('in','out')) default 'in',
  body         text,
  has_media    boolean default false,
  sent_at      timestamptz not null,
  flagged      boolean default false,
  created_at   timestamptz default now()
);
create index if not exists idx_wa_recent on public.hub_whatsapp_messages(sent_at desc);
create index if not exists idx_wa_jid    on public.hub_whatsapp_messages(jid);

-- 12. hub_bankzero_transactions  (BankZero — Phase 4, manual CSV import)
create table if not exists public.hub_bankzero_transactions (
  id            uuid primary key default gen_random_uuid(),
  txn_date      date not null,
  description   text,
  amount_zar    numeric(14,2) not null,
  balance_zar   numeric(14,2),
  category      text,
  source_file   text,
  created_at    timestamptz default now()
);
create index if not exists idx_bz_date on public.hub_bankzero_transactions(txn_date desc);

-- ============================================================================
-- D. ROW-LEVEL SECURITY  —  authenticated users only on the NEW tables only
--    (existing hub_* tables already have RLS enabled and their own policies)
-- ============================================================================
do $$
declare t text;
declare new_tables text[] := array[
  'hub_daily_intentions',
  'hub_daily_reviews',
  'hub_reading_queue',
  'hub_links',
  'hub_notes_dump',
  'hub_quick_capture',
  'hub_marketing_leads',
  'hub_news_items',
  'hub_media_items',
  'hub_monthly_chronicles',
  'hub_whatsapp_messages',
  'hub_bankzero_transactions'
];
begin
  foreach t in array new_tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "auth_all_%1$s" on public.%1$I', t);
    execute format(
      'create policy "auth_all_%1$s" on public.%1$I
         for all
         to authenticated
         using (true)
         with check (true)',
      t
    );
  end loop;
end $$;

-- ============================================================================
-- DONE.  Pending: 002_seed_creditors.sql (24 rows from creditors-dashboard.html
--                                         → INSERT into hub_braveheart)
--                003_seed_integrations.sql (CONFIG dashboard known services
--                                           → UPSERT into hub_sync_status)
-- ============================================================================
