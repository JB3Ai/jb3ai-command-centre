-- ============================================================================
-- OS³ Command Centre — Seed: CONFIG / Integrations dashboard (21 rows)
-- Project: uxeolplwhtyyefpmwktw  (eu-west-1)
-- File:    003_seed_integrations.sql
-- Date:    2026-04-27
-- Source:  derived from project memory + .env + 4-phase roadmap
--
-- Behaviour
--   • Adds a UNIQUE constraint on hub_sync_status(source) if missing — this
--     becomes the natural key the seed (and any future poller) UPSERTs
--     against. Idempotent: re-runnable, won't add a duplicate constraint.
--   • Wrapped in BEGIN…COMMIT — atomic.
--   • Every row uses INSERT … ON CONFLICT (source) DO UPDATE SET
--     display_name, category, enabled, endpoint.
--   • PRESERVES live poller state — last_synced_at, last_status, error_message,
--     latency_ms, record_count are NEVER touched. The 11 pre-existing rows
--     in hub_sync_status keep whatever pollers have written to them; only
--     their display fields get filled in (or refreshed).
--   • category check enforced by migration 001:
--       ('mcp','api','script','scheduler','tunnel','db','ingest','other')
--
-- Endpoint URLs are placeholders for now — refine via the CONFIG panel
-- once the integrations UI ships (Task #13).
--
-- Sanity check (run after applying):
--   select source, display_name, category, enabled
--     from hub_sync_status
--    order by category, source;
--
--   select category, count(*) from hub_sync_status group by category order by category;
--   -- seeded set:  mcp=4, api=8, tunnel=1, scheduler=2, db=1, ingest=5
--   -- (plus any pre-existing rows whose `source` doesn't collide)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Natural key — make `source` UNIQUE so ON CONFLICT (source) works.
--    Robust check: looks for ANY single-column unique constraint on `source`,
--    regardless of constraint name, so it stays idempotent even if the live
--    DB already has its own constraint with a different name.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
      from pg_constraint c
      join pg_attribute  a on a.attrelid = c.conrelid
                          and a.attnum   = any(c.conkey)
     where c.conrelid = 'public.hub_sync_status'::regclass
       and c.contype  = 'u'
       and a.attname  = 'source'
       and array_length(c.conkey, 1) = 1
  ) then
    alter table public.hub_sync_status
      add constraint hub_sync_status_source_key unique (source);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. UPSERT the 21 known integrations
-- ---------------------------------------------------------------------------
begin;

insert into public.hub_sync_status (source, display_name, category, enabled, endpoint) values
  -- ── MCPs (4) ─────────────────────────────────────────────────────────
  ('apple-mcp',         'Apple MCP — Notes + iMessage',  'mcp',       true,  'tunnel.jb3ai.com:8765'),
  ('whatsapp-mcp',      'WhatsApp Bridge',               'mcp',       true,  'localhost:8080'),
  ('filesystem-mcp',    'Filesystem MCP',                'mcp',       true,  'local'),
  ('supabase-mcp',      'Supabase MCP',                  'mcp',       true,  'hosted'),

  -- ── APIs (8) ─────────────────────────────────────────────────────────
  ('gmail',             'Gmail',                         'api',       true,  'gmail.googleapis.com'),
  ('gcal',              'Google Calendar',               'api',       true,  'calendar.googleapis.com'),
  ('clickup',           'ClickUp (output-only)',         'api',       true,  'api.clickup.com'),
  ('vercel',            'Vercel deploys',                'api',       true,  'api.vercel.com'),
  ('anthropic',         'Anthropic (claude-sonnet-4-6)', 'api',       true,  'api.anthropic.com'),
  ('azure-openai',      'Azure OpenAI',                  'api',       true,  'env-driven'),
  ('github',            'GitHub commits',                'api',       true,  'api.github.com'),
  ('cpanel',            'cPanel UAPI (Phase 4)',         'api',       false, 'login-gated'),

  -- ── Tunnels (1) ──────────────────────────────────────────────────────
  ('cloudflare-tunnel', 'Cloudflare Tunnel (Mac→Win)',   'tunnel',    true,  'tunnel.jb3ai.com'),

  -- ── Schedulers (2) ───────────────────────────────────────────────────
  ('vercel-cron',       'Vercel Cron',                   'scheduler', true,  'vercel.json'),
  ('kestra',            'Kestra (Phase 3)',              'scheduler', false, 'localhost:8080'),

  -- ── DB (1) ───────────────────────────────────────────────────────────
  ('supabase-db',       'Supabase Postgres',             'db',        true,  'uxeolplwhtyyefpmwktw'),

  -- ── Ingest pipelines — Phase 3 (5) ───────────────────────────────────
  ('ingest:news-rss',          'News RSS poller (Phase 3)', 'ingest', false, 'Kestra flow'),
  ('ingest:monthly-chronicle', 'Monthly Chronicle gen',     'ingest', false, 'Kestra flow'),
  ('ingest:media-kanban',      'Media kanban refresh',      'ingest', false, 'Kestra flow'),
  ('ingest:marketing-leads',   'Marketing leads ingest',    'ingest', false, 'Kestra flow'),
  ('ingest:whatsapp-logs',     'WhatsApp logs ingest',      'ingest', false, 'Kestra flow')
on conflict (source) do update set
  display_name = excluded.display_name,
  category     = excluded.category,
  enabled      = excluded.enabled,
  endpoint     = excluded.endpoint;

commit;

-- ============================================================================
-- DONE.  Phase 1 schema seeding complete (002 creditors + 003 integrations).
--        Next P1: Task #13 — build the CONFIG / Integrations panel UI to
--        consume hub_sync_status rows seeded above.
-- ============================================================================
