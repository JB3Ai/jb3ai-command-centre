/* eslint-disable */
// OS3 Command Centre — Developer Handoff Document Builder
// Generates a comprehensive .docx capturing the project's state, history,
// architecture, and open work as of 2026-05-23.

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
} = require('docx');

// ── Style helpers ───────────────────────────────────────────────────────
const ARIAL = 'Arial';
const MONO = 'Courier New';

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, ...opts, font: opts.font || ARIAL })],
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: ARIAL, bold: true })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: ARIAL, bold: true })],
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: ARIAL })],
  });
}
function num(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, font: ARIAL })],
  });
}
function code(text) {
  return new Paragraph({
    spacing: { after: 80 },
    shading: { fill: 'F4F4F4', type: ShadingType.CLEAR },
    children: [new TextRun({ text, font: MONO, size: 20 })],
  });
}

function tCell(text, width, opts = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: width, type: WidthType.DXA },
    shading: opts.header ? { fill: 'D5E8F0', type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: !!opts.header, font: opts.mono ? MONO : ARIAL, size: opts.mono ? 20 : 22 })],
      }),
    ],
  });
}

function table(rows, columnWidths, monoCols = []) {
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths,
    rows: rows.map((row, ri) =>
      new TableRow({
        children: row.map((cell, ci) =>
          tCell(cell, columnWidths[ci], { header: ri === 0, mono: monoCols.includes(ci) }),
        ),
      }),
    ),
  });
}

// ── Document structure ──────────────────────────────────────────────────
const children = [];

// Title block
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'OS³ COMMAND CENTRE', font: ARIAL, bold: true, size: 44 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Developer Handoff Document', font: ARIAL, size: 28 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [
      new TextRun({ text: 'Status snapshot — 2026-05-23', font: ARIAL, italics: true, size: 22, color: '666666' }),
    ],
  }),
);

// 1. Identity
children.push(h1('1. Project identity'));
children.push(p('OS³ Command Centre is the canonical operations surface for JB³Ai, owned and operated by Jono Blackburn (jono@jonoblackburn.com), based in Pretoria, Gauteng, South Africa.'));
children.push(p('It is one React application replacing a previously scattered set of HTML dashboards and a partial React app. It is the system of engagement; Supabase is the system of record.'));

children.push(h2('Brand reminders (must)'));
children.push(bullet('All product references use JB³Ai and OS³ with the superscript ³. No JB3Ai, no OS3.'));
children.push(bullet('Cyan #2AF1FF is the accent, capped at ~15% pixel coverage.'));
children.push(bullet('Premium Gold #D4AF37 is reserved for money/exposure callouts only.'));
children.push(bullet('Orbitron for headlines and key metric numbers; Inter for body; JetBrains Mono for code/monospace.'));
children.push(bullet('No gradients, no glow, no ornament for ornament’s sake.'));

// 2. Architecture
children.push(h1('2. Architecture overview'));
children.push(p('A single Vite + React 19 + TypeScript SPA, deployed to Vercel, talking to one Supabase project for auth, data and RLS, with Anthropic Claude Sonnet 4.6 for AI briefings, Kestra for orchestration of ingest pipelines, and a small constellation of MCPs (apple-mcp, whatsapp-bridge, filesystem-mcp) for native-app and messaging integrations.'));

children.push(table([
  ['Layer', 'Technology', 'Notes'],
  ['Frontend', 'React 19, Vite 8, TypeScript ~6, Tailwind 3.4', 'Path alias @/* -> ./src/*. Brand tokens in tailwind.config.js.'],
  ['UI primitives', 'Radix (shadcn-style), lucide-react, cmdk, date-fns', 'Resizable component removed (incompatible with react-resizable-panels v4).'],
  ['Auth/DB', 'Supabase JS 2.103, project uxeolplwhtyyefpmwktw (eu-west-1)', 'Magic-link login. RLS enforced on every new table.'],
  ['Hosting', 'Vercel (team Jono’s projects)', 'GitHub-Vercel webhook auto-deploys on push to main.'],
  ['AI', 'Anthropic claude-sonnet-4-6 for briefings; Ollama (Gemma 3n / Qwen 3) locally for experimentation', 'Azure OpenAI is used elsewhere; not used inside Command Centre yet.'],
  ['Workflows', 'Kestra in paperclip docker-compose stack — container paperclip-kestra-1 on localhost:8080; internal Postgres in paperclip-kestra-db-1', 'NOT n8n. NOT the standalone KESTRA-FLOWS path (dead code). Secrets in paperclip/.env. Phase 3 verified GREEN on 2026-05-23.'],
  ['Native bridge', 'apple-mcp on iMac via Cloudflare Tunnel; WhatsApp Go bridge + Python MCP', 'Always-on infra dependency.'],
], [2200, 3500, 3660]));

// 3. Repos & deploy
children.push(h1('3. Repositories and deployment'));
children.push(table([
  ['Concern', 'Where'],
  ['GitHub repo (this project)', 'https://github.com/JB3Ai/jb3ai-command-centre — private'],
  ['Local working tree', 'C:\\Apps in Dev Visual Code Folder\\Claude Working Folder\\PROJECTS\\jb3ai-command-centre'],
  ['Sibling repo (separate, untouched)', 'C:\\Apps in Dev Visual Code Folder\\jb3ai-os3 -> https://github.com/JB3Ai/jb3ai-os3'],
  ['Vercel team', 'team_Ad0clhIFpEafbbmJozJ4a7zz (slug jonos-projects-cdacc0ad)'],
  ['Vercel project', 'prj_ee5aX5JwEw0RO0RpfE21swpYf88Z'],
  ['Production URL', 'https://jb3ai-command-centre-jonos-projects-cdacc0ad.vercel.app'],
  ['Branch alias (always points at main)', 'https://jb3ai-command-centre-git-main-jonos-projects-cdacc0ad.vercel.app'],
  ['Latest production deploy (2026-04-29)', 'dpl_C4pxrbGmbWmunE47tZqXJDUZRhGX (commit a1f984b)'],
  ['Custom domain', 'Originally planned: command.jb3ai.com. DROPPED on 2026-04-28 — we ship on the auto Vercel domain.'],
], [3000, 6360]));

children.push(h2('vercel.json (root of repo)'));
children.push(p('Pinning the framework, the SPA rewrite, security headers, and immutable cache for /assets/*. The SPA rewrite is critical — React Router uses BrowserRouter, so any deep-link to /config or /braveheart 404s without the rewrite. Re-read this file when modifying build config.'));
children.push(code('{\n  "$schema": "https://openapi.vercel.sh/vercel.json",\n  "framework": "vite",\n  "buildCommand": "npm run build",\n  "outputDirectory": "dist",\n  "installCommand": "npm install",\n  "rewrites": [\n    { "source": "/((?!assets/).*)", "destination": "/index.html" }\n  ],\n  "headers": [\n    { "source": "/(.*)", "headers": [\n        { "key": "X-Frame-Options",        "value": "DENY" },\n        { "key": "X-Content-Type-Options", "value": "nosniff" },\n        { "key": "Referrer-Policy",        "value": "strict-origin-when-cross-origin" },\n        { "key": "Permissions-Policy",     "value": "camera=(), microphone=(), geolocation=()" }\n    ] },\n    { "source": "/assets/(.*)", "headers": [\n        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }\n    ] }\n  ]\n}'));

// 4. Env vars
children.push(h1('4. Environment variables'));
children.push(p('Three Vite-prefixed variables are required for both local dev and prod. The Supabase anon key is safe to publish (RLS gates everything); the file src/lib/supabase.ts also keeps a hardcoded fallback for the URL and anon key so the app boots even without .env.local.'));
children.push(table([
  ['Variable', 'Purpose', 'Example'],
  ['VITE_SUPABASE_URL', 'Supabase project endpoint', 'https://uxeolplwhtyyefpmwktw.supabase.co'],
  ['VITE_SUPABASE_ANON_KEY', 'Public anon JWT (RLS-gated)', 'eyJ… (paste from .env.local)'],
  ['VITE_AUTH_ALLOWED_EMAILS', 'Comma-separated whitelist for magic-link', 'jono@jonoblackburn.com'],
], [3200, 3600, 2560]));
children.push(p('Set the same three in Vercel -> Settings -> Environment Variables, applied to Production + Preview + Development. Vercel changes do not retro-apply — a redeploy is needed for new values to land.'));

children.push(h2('Supabase Auth URL configuration'));
children.push(bullet('Site URL: https://jb3ai-command-centre-jonos-projects-cdacc0ad.vercel.app'));
children.push(bullet('Additional Redirect URLs: prod URL/auth/callback, branch-alias URL/auth/callback, http://localhost:5173/auth/callback'));
children.push(bullet('Auth -> Providers -> Email -> Allow signups OFF, invite-only — only addresses on the allowed-emails list can ever sign in.'));

// 5. Schema
children.push(h1('5. Database schema'));
children.push(p('Project: uxeolplwhtyyefpmwktw (eu-west-1). Schema lives in supabase/migrations/ and is applied via the Supabase SQL editor (not yet automated via supabase-cli). All migrations are additive — they extend existing hub_* tables rather than dropping or rewriting columns.'));

children.push(h2('Existing tables (extended in 001, kept)'));
children.push(p('hub_tasks, hub_calendar, hub_emails, hub_deploys, hub_braveheart, hub_subscriptions, hub_subscriptions_meta, hub_briefings, hub_productivity_sessions, hub_sync_status, hub_automation_log.'));
children.push(p('Notably, hub_braveheart was extended (not forked) with: account_ref, priority (Critical/High/Medium/Low), response_status (red/amber/green/unknown), on_credit_record, imed_status, action_status, attorney_name, attorney_meta (jsonb), last_correspondence_at, updated_at.'));
children.push(p('hub_sync_status was extended with: display_name, category (mcp/api/script/scheduler/tunnel/db/ingest/other), enabled, endpoint, latency_ms.'));

children.push(h2('New tables (created in 001)'));
children.push(table([
  ['Table', 'Powers panel', 'Key columns'],
  ['hub_daily_intentions', 'HOME / Productivity', 'for_date (unique), intention'],
  ['hub_daily_reviews', 'Productivity', 'for_date (unique), win_1, win_2, win_3, lesson, mood'],
  ['hub_reading_queue', 'Productivity', 'title, url, source, read_at, archived, tags[]'],
  ['hub_links', 'Links', 'label, url, category, pinned, sort_order, notes'],
  ['hub_notes_dump', 'Notes', 'body, source, source_ref, pinned, archived, tags[]'],
  ['hub_quick_capture', 'HOME quick-capture (-> ClickUp Inbox)', 'body, pushed_to_clickup, clickup_task_id'],
  ['hub_marketing_leads', 'Marketing', 'name, email, company, source, stage, exposure_zar'],
  ['hub_news_items', 'News', 'title, url, source (rss:* or gmail:ai-news), summary'],
  ['hub_media_items', 'Media kanban', 'title, kind, status (idea->done), prompt, asset_url'],
  ['hub_monthly_chronicles', 'Chronicle', 'for_month (unique), title, highlights, body_md'],
  ['hub_whatsapp_messages', 'WhatsApp', 'jid, direction, body, sent_at'],
  ['hub_bankzero_transactions', 'BankZero (Phase 4)', 'txn_date, description, amount_zar, balance_zar'],
], [2400, 2400, 4560]));

children.push(h2('Migration files'));
children.push(table([
  ['File', 'What it does'],
  ['001_initial_os3_schema.sql', 'Adds columns to hub_braveheart and hub_sync_status; creates 12 new tables; enables RLS + auth-only policies on the new tables only.'],
  ['002_seed_creditors.sql', 'UPSERTs 24 creditor rows into hub_braveheart from creditors-dashboard.html.'],
  ['003_seed_integrations.sql', 'UPSERTs 21 integrations into hub_sync_status (4 MCPs, 8 APIs, 1 tunnel, 2 schedulers, 1 db, 5 ingest pipelines). Idempotent.'],
], [3200, 6160]));
children.push(p('Sensitive-data rule: creditor names, account numbers, claim amounts, BankZero balances, and attorney details NEVER appear in code, commits, memory files, or cross-conversation context. They live only in Supabase, RLS-protected.'));

// 6. Routes & panels
children.push(h1('6. Routes and panels'));
children.push(p('14 routes in the left-nav, all wrapped in <ProtectedRoute><Layout/>. Plus /productivity (separate panel, not in nav), /login (public), /auth/callback (public).'));

children.push(table([
  ['Route', 'Status', 'Phase', 'Source tables'],
  ['/home', 'Built (Phase 2)', '2', 'hub_calendar, hub_emails, hub_tasks, hub_daily_intentions, hub_briefings'],
  ['/braveheart', 'Built (Phase 2)', '2', 'hub_braveheart (24 seeded rows)'],
  ['/bankzero', 'Placeholder', '4', 'hub_bankzero_transactions'],
  ['/whatsapp', 'Placeholder', '3', 'hub_whatsapp_messages'],
  ['/subscriptions', 'Built (Phase 2)', '2', 'hub_subscriptions, hub_subscriptions_meta'],
  ['/ecosystem', 'Built (Phase 2)', '2', 'hub_sync_status'],
  ['/projects', 'Built (Phase 2)', '2', 'hub_deploys'],
  ['/chronicle', 'Placeholder', '3', 'hub_monthly_chronicles'],
  ['/media', 'Placeholder', '3', 'hub_media_items'],
  ['/marketing', 'Placeholder', '3', 'hub_marketing_leads'],
  ['/news', 'Placeholder', '3', 'hub_news_items'],
  ['/notes', 'Built (Phase 2)', '2', 'hub_notes_dump'],
  ['/links', 'Built (Phase 2)', '2', 'hub_links'],
  ['/config', 'Built (Phase 1)', '1', 'hub_sync_status'],
  ['/productivity', 'Built (legacy)', '—', 'hub_productivity_sessions, hub_briefings, hub_tasks'],
], [1800, 1800, 800, 4960]));

children.push(h2('Panel pattern (used by all Phase 2 + CONFIG panels)'));
children.push(bullet('Brand-aligned card layout (Tailwind utilities, not inline styles).'));
children.push(bullet('Top: icon halo + Orbitron title + description; right side has manual Refresh and last-sync pill.'));
children.push(bullet('Summary strip with key counts; gold callouts for money/exposure only.'));
children.push(bullet('Inline error banner (rose) when a Supabase query errors.'));
children.push(bullet('Manual refresh only — no auto-polling — except ProductivityPanel which still polls every 5 minutes.'));
children.push(bullet('Reads via supabase.from(‘hub_*’).select(...). Most panels also support write-back where it makes sense (Notes, Links, HOME daily intention, CONFIG enable toggle).'));
children.push(bullet('Empty/loading/error states for every list.'));

children.push(h2('Productivity (separate)'));
children.push(p('src/components/ProductivityPanel.tsx is older code that uses inline styles and a COLORS object instead of Tailwind utility classes. It works and is shipped. Do not refactor it just for consistency — wait until a real change is needed there.'));

// 7. File map
children.push(h1('7. File map (src/)'));
children.push(code('src/\n  App.tsx                        <- LEGACY\n  main.tsx                       Route tree, AuthProvider wrap, BrowserRouter\n  index.css                      Tailwind directives + Inter/Orbitron/JetBrains Mono Google Font links\n  components/\n    PlaceholderPage.tsx          Used by every Phase 3/4 route still on hold\n    ProductivityPanel.tsx        Older inline-style component, mounted at /productivity\n    ProtectedRoute.tsx           Redirects to /login if no Supabase session\n    layout/\n      Layout.tsx                 Sidebar + Topbar + StatusBar wrapping <Outlet/>\n      Sidebar.tsx                Reads NAV_ITEMS from src/lib/nav-config.ts (14 entries)\n      Topbar.tsx                 User menu, logout\n      StatusBar.tsx              Bottom strip\n    ui/                          shadcn components; resizable.tsx was REMOVED on 2026-04-28\n  lib/\n    supabase.ts                  Single client instance + Hub* row types\n    auth-context.tsx             AuthProvider + useAuth hook\n    nav-config.ts                NAV_ITEMS array — source of truth for sidebar\n    utils.ts                     cn() helper for Tailwind class composition\n  pages/\n    home/                        Phase 2 panel (rebuilt 2026-04-29)\n    braveheart/                  Phase 2 panel\n    subscriptions/               Phase 2 panel\n    projects/                    Phase 2 panel\n    links/                       Phase 2 panel\n    notes/                       Phase 2 panel\n    ecosystem/                   Phase 2 panel\n    config/                      Phase 1 panel\n    bankzero/                    Phase 4 placeholder\n    whatsapp/                    Phase 3 placeholder\n    chronicle/                   Phase 3 placeholder\n    media/                       Phase 3 placeholder\n    marketing/                   Phase 3 placeholder\n    news/                        Phase 3 placeholder\n    login/                       Public, magic-link entry\n    auth-callback/               Public, magic-link landing\nsupabase/migrations/\n  001_initial_os3_schema.sql\n  002_seed_creditors.sql\n  003_seed_integrations.sql\nvercel.json                      Build + SPA rewrite + security headers\ntsconfig.json                    "ignoreDeprecations": "6.0" + baseUrl + paths\ntsconfig.app.json                Same fix; React app build\ntsconfig.node.json               vite.config.ts only\ntailwind.config.js               Brand tokens (matte/graphite/steel/edge/cyan/gold/ink) + animations'));

// 8. Build pipeline lessons
children.push(h1('8. Build pipeline — lessons baked into the repo'));
children.push(p('These are gotchas that have already been solved; the fixes are committed. They are listed here so you don’t accidentally undo them or get caught by them in a fresh checkout.'));

children.push(h2('TypeScript 6 baseUrl deprecation'));
children.push(p('TypeScript 6 still warns when baseUrl is set, and Vercel’s CI escalates that warning to an error, failing the build. Fixed by adding "ignoreDeprecations": "6.0" to both tsconfig.json and tsconfig.app.json. Don’t remove baseUrl — the @/* path alias depends on it.'));

children.push(h2('shadcn resizable.tsx vs react-resizable-panels v4'));
children.push(p('shadcn’s default resizable component imports ResizablePrimitive.PanelGroup/PanelResizeHandle, which were removed in react-resizable-panels v4. Since nothing in the app actually uses Resizable, the file was deleted on 2026-04-28. If you ever need a resizable layout: npx shadcn@latest add resizable will drop a v4-compatible version.'));

children.push(h2('Vercel “Require Verified Commits” gate'));
children.push(p('Jono’s Vercel team has Require Verified Commits enabled at the team level. Every webhook-triggered deploy with an unsigned commit is INSTANTLY canceled with empty build logs — a confusing failure mode. Fixed by overriding to Disabled at the project level (Settings -> Git). Future hardening: set up SSH-signed commits and re-enable.'));

children.push(h2('Vercel Redeploy reuses the original SHA'));
children.push(p('Clicking Redeploy on an old failed deployment rebuilds that SAME commit — not the latest main. To rebuild against latest main: push a fresh commit (an empty commit is fine: git commit --allow-empty -m "trigger rebuild"), or in the dashboard pick the row whose SHA matches the latest main commit.'));

// 9. Phase status
children.push(h1('9. Phase status (as of 2026-04-29)'));

children.push(h2('Phase 1 — Foundation: DONE'));
children.push(bullet('Supabase auth wired (magic link), 3 env vars in prod.'));
children.push(bullet('Schema applied (migrations 001-003) including 24 creditor rows + 21 integration rows.'));
children.push(bullet('Vercel project + GitHub-Vercel webhook live.'));
children.push(bullet('Left-nav shell with 14 placeholder routes.'));
children.push(bullet('CONFIG / Integrations panel built with heartbeat + per-row toggle persisted to hub_sync_status.'));

children.push(h2('Phase 2 — Already-have-data panels: DONE'));
children.push(bullet('HOME (calendar/emails/tasks/intention/latest briefing).'));
children.push(bullet('BRAVEHEART (24 creditor rows with priority, exposure in gold, response status, credit-record flag, expandable detail).'));
children.push(bullet('Subscriptions (status lights, monthly + annual rollup in gold, grouped by category).'));
children.push(bullet('Projects (Vercel deploys grouped by project, state dots, build durations).'));
children.push(bullet('Links (CRUD + pin + category groups).'));
children.push(bullet('Notes (quick capture + tags + pin/archive filter chips).'));
children.push(bullet('Ecosystem (tile grid view of hub_sync_status, complementing CONFIG).'));
children.push(p('All seven shipped in commit a1f984b on 2026-04-29 — build green, deployed to production.'));

children.push(h2('Phase 3 — Kestra ingest pipelines: DONE (verified 2026-05-23)'));
children.push(p('All 5 ingest flows verified green:'));
children.push(bullet('news_rss_poller — hourly RSS pull into hub_news_items (5 feeds: HN, TechCrunch AI, Verge AI, VentureBeat AI, DeepLearning.AI The Batch)'));
children.push(bullet('chronicle_generator — monthly Claude narrative into hub_monthly_chronicles (1st of month @ 07:00)'));
children.push(bullet('media_kanban_refresh — weekly status escalation + archive in hub_media_items (Mon 08:00)'));
children.push(bullet('marketing_leads_ingest — 4-hourly scan of hub_emails into hub_marketing_leads with Claude extraction'));
children.push(bullet('whatsapp_logs_ingest — nightly 02:00 digest into hub_notes_dump (reduced from full flow — see migration note)'));
children.push(p('Kestra runs as part of the paperclip Docker Compose stack (container paperclip-kestra-1), NOT as a standalone container. Pulls Ollama models from the Mac host via host.docker.internal:11434. The standalone KESTRA-FLOWS\\restart-kestra.ps1 + kestra.secrets.env path is dead code from an earlier setup.'));
children.push(p('Every flow ships with a PostgREST error-printing wrapper (try/except urllib.error.HTTPError that decodes e.read()) and an Accept-Profile: public + Content-Profile: public header pair so PostgREST routes to the public schema (where the hub_* tables live).'));
children.push(p('WhatsApp flow note: the original flow design referenced columns responded, needs_reply, is_archived that do not exist in hub_whatsapp_messages. The flow was reduced to digest-only on 2026-05-23. To restore the unanswered-flagging + auto-archive features, run: alter table hub_whatsapp_messages add column responded boolean default false, add column needs_reply boolean default false, add column is_archived boolean default false; then revert the flow body.'));

children.push(h2('Phase 4 — Hard integrations: PENDING'));
children.push(bullet('BankZero: no public API — manual CSV upload only. UI not built.'));
children.push(bullet('cPanel UAPI: works but locked behind login — needs an authenticated bridge.'));
children.push(bullet('Meta FB/IG: requires app review with business verification (months of work) — deferred.'));

// 10. Locked decisions
children.push(h1('10. Locked decisions (in chronological order)'));
children.push(table([
  ['Date', 'Decision'],
  ['2026-04-25', 'One React app, one Supabase project, single Vercel deploy. No self-host.'],
  ['2026-04-25', 'Anthropic claude-sonnet-4-6 for briefings (NOT Azure OpenAI inside Command Centre).'],
  ['2026-04-25', 'Kestra for workflows. n8n explicitly excluded.'],
  ['2026-04-25', 'Productivity gadgets locked: Next-up, Quick capture, Daily intention, Daily review, Reading queue. Streak tracker dropped.'],
  ['2026-04-25', 'ClickUp is output-only on free tier. NOT the primary system of record.'],
  ['2026-04-26', 'Magic-link email login from Phase 1.'],
  ['2026-04-26', 'Existing hub_* tables KEPT and EXTENDED additively, never forked.'],
  ['2026-04-26', 'Creditor data lives in extended hub_braveheart, NOT a new hub_creditors table.'],
  ['2026-04-26', 'CONFIG dashboard reuses hub_sync_status, NOT a new hub_integrations_status.'],
  ['2026-04-28', 'GitHub repo is JB3Ai/jb3ai-command-centre (private) — NOT jb3ai-os3 which is a separate older repo.'],
  ['2026-04-28', 'Custom domain command.jb3ai.com DROPPED. Using Vercel auto-domain.'],
  ['2026-04-28', 'Vercel "Require Verified Commits" set to Disabled at project level.'],
  ['2026-04-29', '7 Phase 2 panels shipped to production.'],
  ['2026-05-22', 'Kestra runs from paperclip docker-compose stack (container paperclip-kestra-1). The standalone KESTRA-FLOWS\\restart-kestra.ps1 is dead code — NOT in use. Secrets live in paperclip/.env.'],
  ['2026-05-23', 'All Phase 3 Kestra flows ship with a mandatory PostgREST error-printing wrapper (try/except urllib.error.HTTPError that decodes and prints e.read()).'],
  ['2026-05-23', 'WhatsApp flow reduced to digest-only pending optional schema migration to restore responded / needs_reply / is_archived columns.'],
  ['2026-05-23', 'All 5 Phase 3 Kestra flows verified GREEN.'],
], [1800, 7560]));

// 11. Open issues
children.push(h1('11. Open issues / loose ends'));
children.push(num('NEXT PRIORITY: Phase 3 panels (/news, /chronicle, /media, /marketing, /whatsapp) are still PlaceholderPage components. All 5 ingest tables are now populated by Kestra — wire each panel to read from its hub_* table using the Phase 2 panel pattern.'));
children.push(num('Dead code in KESTRA-FLOWS\\: restart-kestra.ps1 + kestra.secrets.env target a standalone container that is NOT in use. Candidates for deletion (or rewrite to target the paperclip stack).'));
children.push(num('Supabase JWT Secret rotation verification pending — the secret was rotated on 2026-05-22 after an accidental paste in chat. Confirm rotation took effect in Supabase Dashboard -> Settings -> API.'));
children.push(num('WhatsApp flow optional restore: run the migration adding responded, needs_reply, is_archived boolean columns to hub_whatsapp_messages, then revert whatsapp_logs_ingest.yml to its full pre-2026-05-23 form.'));
children.push(num('Diagnostic row cleanup pending: delete from public.hub_sync_status where source = ‘test:diagnostic’; — left over from the 003 seed debugging session.'));
children.push(num('JS bundle size warning: 591 kB raw / 166 kB gzipped. Default Vite warning at 500 kB. Fix when convenient via route-level dynamic import() to code-split each panel.'));
children.push(num('Verified-commit gate currently disabled. Long-term hardening: set up SSH-signed commits on the Windows dev machine and re-enable the gate.'));
children.push(num('Legacy src/App.tsx still in repo, orphaned by the HOME rebuild. Safe to delete after smoke-test.'));
children.push(num('ProductivityPanel.tsx uses older inline-style pattern; other panels use Tailwind utility classes. Inconsistency, not a bug.'));
children.push(num('BankZero panel still PlaceholderPage. Phase 4.'));

// 12. Working with the repo
children.push(h1('12. Working with the repo'));
children.push(h2('Local development'));
children.push(code('cd "C:\\Apps in Dev Visual Code Folder\\Claude Working Folder\\PROJECTS\\jb3ai-command-centre"\nnpm install\ncp .env.example .env.local        # then fill in the 3 vars\nnpm run dev                       # http://localhost:5173'));

children.push(h2('Build verification'));
children.push(code('npm run build                     # tsc -b && vite build\n# Expected output (approx):\n# 2158 modules transformed.\n# dist/index.html                   0.92 kB\n# dist/assets/index-*.css            53.71 kB\n# dist/assets/index-*.js            591.26 kB\n# (warning about >500 kB is known; not blocking)'));

children.push(h2('Deploy'));
children.push(p('git push origin main — the GitHub-Vercel webhook auto-builds and promotes on success. To trigger a fresh build without code changes: git commit --allow-empty -m "trigger rebuild" && git push.'));

children.push(h2('Watching a Vercel build'));
children.push(p('The connected Vercel MCP exposes list_deployments, get_deployment, get_deployment_build_logs, get_runtime_logs, web_fetch_vercel_url. There is no env-var setter or domain creator — those still need a quick dashboard click.'));

// 13. Conversation log highlight (this session)
children.push(h1('13. This session’s build history (2026-04-29 chronological)'));
children.push(num('Started by writing 003_seed_integrations.sql (21 integration UPSERTs, atomic, idempotent, preserves live poller state).'));
children.push(num('Built CONFIG / Integrations panel: header, summary, sectioned heartbeat list, per-row enable toggle persisted, manual refresh.'));
children.push(num('Layout fix to CONFIG: stacked rows instead of cramped single-line meta strip; header collapses below md breakpoint.'));
children.push(num('Kicked off Vercel deploy: wrote vercel.json + .env.example + hardened .gitignore.'));
children.push(num('git init / first commit (a45febe) — push to GitHub. Vercel imported, framework auto-detected as Vite.'));
children.push(num('First deploy ERRORED on TS5101 baseUrl deprecation. Fix: ignoreDeprecations: 6.0 + remove unused shadcn resizable.tsx -> commit 9233d02.'));
children.push(num('9233d02 webhook deploy CANCELED with empty logs. Diagnosed as Require Verified Commits team policy. Disabled at project level.'));
children.push(num('Empty commit c8be187 -> first GREEN deploy. Production live.'));
children.push(num('Set 3 env vars in Vercel -> redeploy ed87b5c with vars baked in. Updated Supabase Auth Site URL + Redirect URLs. Magic-link confirmed working in prod.'));
children.push(num('Dropped the command.jb3ai.com custom domain plan in favour of the auto vercel.app URL.'));
children.push(num('Phase 2: built 7 panels (HOME, BRAVEHEART, Subscriptions, Projects, Links, Notes, Ecosystem). +2160 lines of TSX. Local build green. Commit a1f984b. Vercel auto-rebuild green.'));
children.push(num('Started Phase 3 Kestra. Wrote test flow gemma_test in jono.lab namespace. First execution failed: role: USER not recognised. Diagnosed the role/type mismatch and the gemma4 -> gemma3n typo. Re-execute attempted but Save step in Kestra UI was missed — same error returned. Currently blocked here.'));

// 14. Lessons learned — the 2026-05-22 to 23 debugging session
children.push(h1('14. Lessons from the 2026-05-22 → 23 debugging session'));
children.push(p('Two days of debugging to bring all 5 Phase 3 Kestra flows to green. The gotchas below are baked into the flows themselves and into the column-drift memory file, but documenting here for portability.'));

children.push(h2('PostgREST 400 errors have a body — Python urllib hides it'));
children.push(p('urllib.error.HTTPError swallows the response body. Without explicitly decoding e.read(), a "Bad Request" tells you nothing. Every Phase 3 flow now wraps urlopen() in a try/except that prints "PostgREST said: " + e.read().decode(). PostgREST then tells you the exact column name that does not exist.'));
children.push(code('def supabase_get(table, params=""):\n    url = f"{REST}/{table}?{params}"\n    req = urllib.request.Request(url, headers=HEADERS, method="GET")\n    try:\n        with urllib.request.urlopen(req) as r:\n            return json.loads(r.read())\n    except urllib.error.HTTPError as e:\n        body = e.read().decode("utf-8", errors="replace")\n        print(f"supabase_get FAILED - {e.code} on {table}?{params}")\n        print(f"  PostgREST said: {body[:600]}")\n        raise'));

children.push(h2('Schema-drift discovery SQL'));
children.push(p('In the Supabase SQL Editor, this one-liner dumps any table’s columns:'));
children.push(code("select column_name, data_type\nfrom information_schema.columns\nwhere table_schema = 'public' and table_name = 'hub_X'\norder by ordinal_position;"));

children.push(h2('Verified hub_* columns as of 2026-05-23'));
children.push(p('hub_emails: id, gmail_id, thread_id, subject, sender, sender_email, snippet, body_preview, is_unread, has_attachment, labels, received_at, synced_at, created_at.'));
children.push(p('hub_media_items: id, title, kind, status, prompt, asset_url, thumb_url, notes, tags, sort_order, created_at, updated_at. NO archived boolean — use status = ‘archived’ as the marker; filter active with status=neq.archived.'));
children.push(p('hub_whatsapp_messages: id, jid, display_name, direction, body, has_media, sent_at, flagged, created_at. NO responded, needs_reply, is_archived, phone_number, contact_name columns.'));

children.push(h2('Common column renames (chronicle_generator + marketing_leads_ingest)'));
children.push(bullet('hub_tasks.updated_at -> synced_at'));
children.push(bullet('hub_deploys.project -> project_name'));
children.push(bullet('hub_daily_reviews.review_date -> for_date; wins -> win_1/win_2/win_3; mood_score -> mood'));
children.push(bullet('hub_news_items.is_starred -> starred; source_feed -> source'));
children.push(bullet('hub_monthly_chronicles.month_label -> title; narrative -> body_md; column generated_by does not exist'));
children.push(bullet('hub_emails.from_email -> sender_email; from_name -> sender'));
children.push(bullet('hub_whatsapp_messages.phone_number -> jid; contact_name -> display_name'));

children.push(h2('Timestamp URL-encoding gotcha'));
children.push(p('datetime.now(timezone.utc).isoformat() produces "2026-05-23T10:00:00+00:00". The + character in a URL query string is interpreted as a space, breaking PostgREST timestamp parsing. Always format URL timestamps with strftime("%Y-%m-%dT%H:%M:%SZ") to get the Z suffix. Body payloads can use either format.'));

children.push(h2('PowerShell UTF-8 clipboard mangling'));
children.push(p('Get-Content file.yml | Set-Clipboard can drop UTF-8 to Windows-1252, mangling chars like ³, —, →. Symptom in Kestra: "Illegal Flow source: YAML parsing error: special characters are not allowed". Fixes: copy from VS Code (preserves UTF-8 to clipboard), import via curl --data-binary @file.yml, or keep YAML files ASCII-only outside the script: block.'));

children.push(h2('Schema routing — Accept-Profile header is mandatory'));
children.push(p('PostgREST defaults to routing to the api schema. To force routing to public (where hub_* tables live), every supabase_get and supabase_post must include Accept-Profile: public and Content-Profile: public headers, in addition to apikey + Authorization. Missing this returns PGRST205 schema cache 404s.'));

children.push(h2('Two-Supabase-project gotcha'));
children.push(p('Two Supabase projects exist in the team: uxeolplwhtyyefpmwktw (canonical, 23 hub_* tables) and achjqrfddxzfnfabveck (empty orphan). Flows pointing at the orphan return PGRST205 schema cache 404s on every table. Always verify the URL in env vars before debugging deeper.'));

children.push(h2('Kestra Postgres named-volume password lock-in'));
children.push(p('The kestra-pgdata Docker volume bakes the initial POSTGRES_PASSWORD into its data directory. If KESTRA_DB_PASSWORD env var changes later, Kestra crashes on boot with FATAL: password authentication failed. Recovery without data loss:'));
children.push(code("docker exec paperclip-kestra-db-1 psql -U kestra -d kestra -c \"ALTER USER kestra WITH PASSWORD 'kestra';\"\ndocker restart paperclip-kestra-1"));
children.push(p('Recovery with data loss (last resort, nukes Kestra metadata): docker compose -f docker-compose.kestra-stack.yml down -v && docker compose up -d.'));

children.push(h2('Two Kestra restart paths — one is dead'));
children.push(p('KESTRA-FLOWS\\restart-kestra.ps1 creates a standalone container named kestra. paperclip/docker-compose.kestra-stack.yml creates paperclip-kestra-1. Only the latter is live. Secrets edited in KESTRA-FLOWS\\kestra.secrets.env will NEVER reach the running Kestra. Always edit paperclip\\.env and restart the paperclip compose stack.'));

// 15. Suggested next-steps order
children.push(h1('15. Suggested next steps for the developer'));
children.push(num('Wire Phase 3 panels (/news, /chronicle, /media, /marketing, /whatsapp) to their now-populated hub_* tables. Follow the Phase 2 panel pattern: brand-aligned card, header with manual Refresh + last-sync pill, summary strip, error banner, empty/loading/error states.'));
children.push(num('Verify Supabase JWT Secret rotation took effect (Dashboard -> Settings -> API).'));
children.push(num('Clean up dead code: delete KESTRA-FLOWS\\restart-kestra.ps1 + kestra.secrets.env (or rewrite to target paperclip stack).'));
children.push(num('Optional: run the WhatsApp schema migration (responded, needs_reply, is_archived booleans) and restore full whatsapp_logs_ingest flow.'));
children.push(num('Phase 4: BankZero CSV upload UI -> hub_bankzero_transactions; cPanel auth bridge if/when needed.'));
children.push(num('Polish pass: route-level code-splitting; retire src/App.tsx; SSH commit signing + re-enable Verified Commits gate; clean up the test:diagnostic row in hub_sync_status.'));

// 16. Locations cheat sheet
children.push(h1('16. Locations cheat sheet'));
children.push(p('Every important path / URL / container name in one place.'));
children.push(table([
  ['Concern', 'Path or URL'],
  ['React app (this repo)', 'C:\\Apps in Dev Visual Code Folder\\Claude Working Folder\\PROJECTS\\jb3ai-command-centre'],
  ['Kestra flow YAML source files', 'C:\\Apps in Dev Visual Code Folder\\Claude Working Folder\\KESTRA-FLOWS\\'],
  ['Kestra Docker stack root', 'C:\\Apps in Dev Visual Code Folder\\paperclip\\'],
  ['Kestra compose file', 'paperclip\\docker-compose.kestra-stack.yml'],
  ['Kestra secrets', 'paperclip\\.env (SECRET_SUPABASE_SERVICE_KEY, SECRET_ANTHROPIC_API_KEY, SECRET_GEMINI_API_KEY)'],
  ['Kestra UI', 'http://localhost:8080'],
  ['Kestra container (app)', 'paperclip-kestra-1'],
  ['Kestra container (metadata DB)', 'paperclip-kestra-db-1 (Postgres 17, named volume kestra-pgdata)'],
  ['Sibling repo (separate, untouched)', 'C:\\Apps in Dev Visual Code Folder\\jb3ai-os3'],
  ['Claude Code global skills folder', 'C:\\Users\\jono\\.codex\\skills'],
  ['Claude per-session memory', 'C:\\Users\\jono\\AppData\\Roaming\\Claude\\local-agent-mode-sessions\\...\\spaces\\...\\memory\\'],
  ['Supabase project (CANONICAL)', 'https://supabase.com/dashboard/project/uxeolplwhtyyefpmwktw'],
  ['Supabase project (ORPHAN — DO NOT USE)', 'achjqrfddxzfnfabveck (empty DB, will 404 Kestra flows)'],
  ['Supabase SQL editor (canonical)', 'https://supabase.com/dashboard/project/uxeolplwhtyyefpmwktw/sql/new'],
  ['Production URL', 'https://jb3ai-command-centre-jonos-projects-cdacc0ad.vercel.app'],
  ['Vercel branch alias (main)', 'https://jb3ai-command-centre-git-main-jonos-projects-cdacc0ad.vercel.app'],
  ['GitHub repo', 'https://github.com/JB3Ai/jb3ai-command-centre (private)'],
  ['This handoff script', 'docs\\build_handoff.js (rebuild: node docs\\build_handoff.js)'],
  ['Generated handoff doc', 'docs\\OS3_Command_Centre_Handoff.docx'],
], [3200, 6160]));

// Closing
children.push(h2('Contact'));
children.push(p('Owner: Jono Blackburn — jono@jonoblackburn.com. WhatsApp 071 969 1848 (no unscheduled calls; bookings only).'));

// ── Build the document ──────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: { document: { run: { font: ARIAL, size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: ARIAL, color: '0E1116' },
        paragraph: { spacing: { before: 320, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: ARIAL, color: '151A22' },
        paragraph: { spacing: { before: 240, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: ARIAL, color: '374151' },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [
        { level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: '◦', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ] },
      { reference: 'numbers', levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ] },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: 'OS³ Command Centre — Developer Handoff', font: ARIAL, size: 18, color: '666666' })],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Page ', font: ARIAL, size: 18, color: '666666' }),
          new TextRun({ children: [PageNumber.CURRENT], font: ARIAL, size: 18, color: '666666' }),
          new TextRun({ text: ' — 2026-05-23', font: ARIAL, size: 18, color: '666666' }),
        ],
      })] }),
    },
    children,
  }],
});

const outPath = path.resolve(process.argv[2] || './OS3_Command_Centre_Handoff.docx');
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log('Wrote ' + outPath + ' (' + buffer.length + ' bytes)');
});
