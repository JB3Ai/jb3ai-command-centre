-- BRAVEHEART v2 normalized schema
-- No creditor seed data belongs in this migration.
-- Source-of-truth data is imported from the reviewed V2.3 reconciliation layer.

begin;

create extension if not exists pgcrypto;

create table if not exists public.braveheart_creditors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  creditor_group text,
  category text,
  default_priority text check (default_priority in ('Critical','High','Medium','Low')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (normalized_name)
);

create table if not exists public.braveheart_accounts (
  id uuid primary key default gen_random_uuid(),
  creditor_id uuid not null references public.braveheart_creditors(id) on delete restrict,
  entity_type text not null check (entity_type in ('Personal','IMED','Business','Unknown')) default 'Unknown',
  product_type text,
  account_ref text,
  temporary_key text,
  on_credit_report boolean,
  credit_report_balance numeric(14,2),
  latest_balance numeric(14,2),
  arrears numeric(14,2),
  amount_due numeric(14,2),
  instalment numeric(14,2),
  settlement_amount numeric(14,2),
  arrangement_amount numeric(14,2),
  legal_fees numeric(14,2),
  stage text,
  priority text check (priority in ('Critical','High','Medium','Low')),
  waiting_on text check (waiting_on in ('US','CREDITOR','HANDLER','UNKNOWN')) default 'UNKNOWN',
  next_action text,
  next_action_due date,
  reconciliation_status text check (reconciliation_status in ('CONFIRMED','REVIEW','CONFLICT','NO_EVIDENCE')) default 'REVIEW',
  confidence text check (confidence in ('HIGH','MEDIUM','LOW')) default 'LOW',
  source_system text,
  source_run_id text,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint braveheart_accounts_identity_chk check (account_ref is not null or temporary_key is not null)
);

create unique index if not exists uq_braveheart_accounts_ref
  on public.braveheart_accounts(entity_type, creditor_id, account_ref)
  where account_ref is not null;

create unique index if not exists uq_braveheart_accounts_temp
  on public.braveheart_accounts(temporary_key)
  where temporary_key is not null;

create index if not exists idx_braveheart_accounts_priority on public.braveheart_accounts(priority);
create index if not exists idx_braveheart_accounts_stage on public.braveheart_accounts(stage);
create index if not exists idx_braveheart_accounts_waiting on public.braveheart_accounts(waiting_on);
create index if not exists idx_braveheart_accounts_recon on public.braveheart_accounts(reconciliation_status);

create table if not exists public.braveheart_contacts (
  id uuid primary key default gen_random_uuid(),
  creditor_id uuid references public.braveheart_creditors(id) on delete cascade,
  account_id uuid references public.braveheart_accounts(id) on delete cascade,
  contact_type text not null check (contact_type in ('Attorney','Collections','Creditor','Internal','Other')),
  organisation text,
  person_name text,
  email text,
  phone text,
  is_primary boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_braveheart_contacts_account on public.braveheart_contacts(account_id);
create index if not exists idx_braveheart_contacts_creditor on public.braveheart_contacts(creditor_id);

create table if not exists public.braveheart_balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.braveheart_accounts(id) on delete cascade,
  balance numeric(14,2),
  arrears numeric(14,2),
  amount_due numeric(14,2),
  instalment numeric(14,2),
  settlement_amount numeric(14,2),
  arrangement_amount numeric(14,2),
  legal_fees numeric(14,2),
  as_of_date timestamptz not null,
  source_type text,
  source_reference text,
  confidence text check (confidence in ('HIGH','MEDIUM','LOW')) default 'LOW',
  created_at timestamptz not null default now()
);

create index if not exists idx_braveheart_balances_account_date
  on public.braveheart_balance_snapshots(account_id, as_of_date desc);

create table if not exists public.braveheart_communications (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.braveheart_accounts(id) on delete cascade,
  channel text not null check (channel in ('Email','SMS','WhatsApp','Phone','Letter','Other')),
  direction text check (direction in ('INBOUND','OUTBOUND','INTERNAL','UNKNOWN')) default 'UNKNOWN',
  occurred_at timestamptz not null,
  subject text,
  summary text,
  sender text,
  recipient text,
  external_message_id text,
  external_thread_id text,
  stage_detected text,
  requires_reply boolean,
  source_system text,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_braveheart_comm_external
  on public.braveheart_communications(source_system, external_message_id)
  where external_message_id is not null;
create index if not exists idx_braveheart_comm_account_date
  on public.braveheart_communications(account_id, occurred_at desc);

create table if not exists public.braveheart_legal_matters (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.braveheart_accounts(id) on delete cascade,
  legal_stage text,
  matter_ref text,
  attorney_name text,
  attorney_email text,
  attorney_phone text,
  section_129 boolean not null default false,
  summons boolean not null default false,
  judgment boolean not null default false,
  court_name text,
  court_date date,
  deadline date,
  status text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_braveheart_legal_account on public.braveheart_legal_matters(account_id);
create index if not exists idx_braveheart_legal_deadline on public.braveheart_legal_matters(deadline) where deadline is not null;

create table if not exists public.braveheart_documents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.braveheart_accounts(id) on delete set null,
  communication_id uuid references public.braveheart_communications(id) on delete set null,
  file_name text not null,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  document_type text,
  document_date date,
  extraction_status text check (extraction_status in ('PENDING','EXTRACTED','FAILED','NOT_REQUIRED')) default 'PENDING',
  priority text check (priority in ('Critical','High','Medium','Low')) default 'Medium',
  source_message_id text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_braveheart_docs_account on public.braveheart_documents(account_id);
create index if not exists idx_braveheart_docs_pending on public.braveheart_documents(extraction_status, priority);

create table if not exists public.braveheart_reconciliation_queue (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.braveheart_accounts(id) on delete cascade,
  candidate_key text,
  issue_type text not null,
  severity text check (severity in ('Critical','High','Medium','Low')) default 'Medium',
  status text check (status in ('OPEN','REVIEWING','RESOLVED','IGNORED')) default 'OPEN',
  details text,
  proposed_change jsonb,
  source_system text,
  source_run_id text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_braveheart_recon_open
  on public.braveheart_reconciliation_queue(status, severity);

create table if not exists public.braveheart_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  source_run_id text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text check (status in ('RUNNING','COMPLETE','FAILED','PARTIAL')) default 'RUNNING',
  rows_received integer not null default 0,
  rows_inserted integer not null default 0,
  rows_updated integer not null default 0,
  rows_rejected integer not null default 0,
  notes text
);

create or replace view public.braveheart_account_dashboard as
select
  a.id as account_id,
  c.name as creditor,
  c.creditor_group,
  a.entity_type,
  a.product_type,
  a.account_ref,
  a.latest_balance,
  a.arrears,
  a.amount_due,
  a.instalment,
  a.stage,
  a.priority,
  a.waiting_on,
  a.next_action,
  a.next_action_due,
  a.on_credit_report,
  a.reconciliation_status,
  a.confidence,
  a.last_verified_at,
  (
    select max(comm.occurred_at)
    from public.braveheart_communications comm
    where comm.account_id = a.id
  ) as last_communication_at,
  exists (
    select 1
    from public.braveheart_legal_matters lm
    where lm.account_id = a.id
      and coalesce(lm.status, '') not in ('Closed','Resolved')
  ) as has_open_legal_matter
from public.braveheart_accounts a
join public.braveheart_creditors c on c.id = a.creditor_id;

create or replace view public.braveheart_dashboard_summary as
select
  count(*)::integer as account_count,
  coalesce(sum(latest_balance), 0)::numeric(14,2) as total_known_exposure,
  coalesce(sum(latest_balance) filter (where entity_type = 'Personal'), 0)::numeric(14,2) as personal_exposure,
  coalesce(sum(latest_balance) filter (where entity_type in ('IMED','Business')), 0)::numeric(14,2) as business_exposure,
  count(*) filter (where priority = 'Critical')::integer as critical_count,
  count(*) filter (where waiting_on = 'US')::integer as waiting_on_us_count,
  count(*) filter (where waiting_on in ('CREDITOR','HANDLER'))::integer as waiting_on_external_count,
  count(*) filter (where reconciliation_status <> 'CONFIRMED')::integer as unresolved_reconciliation_count
from public.braveheart_accounts;

-- RLS: authenticated dashboard users only. Service-role/server imports bypass RLS.
do $$
declare t text;
declare tables text[] := array[
  'braveheart_creditors',
  'braveheart_accounts',
  'braveheart_contacts',
  'braveheart_balance_snapshots',
  'braveheart_communications',
  'braveheart_legal_matters',
  'braveheart_documents',
  'braveheart_reconciliation_queue',
  'braveheart_sync_runs'
];
begin
  foreach t in array tables loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "auth_all_%1$s" on public.%1$I', t);
    execute format(
      'create policy "auth_all_%1$s" on public.%1$I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

commit;
