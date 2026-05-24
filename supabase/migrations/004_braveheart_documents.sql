-- Migration 004: BRAVEHEART document catalog
--
-- Catalogs files in C:\Users\jono\OneDrive\BACKUP AND MASTER COPIES\BRAVEHEART
-- without storing the file content itself. The script
-- scripts\braveheart_catalog.py writes here; the /braveheart panel reads from it.
--
-- Design:
--   - file_hash (sha256) is the dedup key. Changed files get a new hash and
--     therefore a new row, preserving history of revisions.
--   - file_path is local Windows path; click-to-open via computer:// link.
--   - braveheart_id is nullable so bulk-import works before manual linking.
--   - PII content never enters this table; only metadata + filename hints.
--
-- RLS: same authenticated-only pattern as other hub_* tables.

create extension if not exists "pgcrypto";  -- for gen_random_uuid()

create table if not exists hub_braveheart_documents (
  id              uuid primary key default gen_random_uuid(),
  file_path       text not null,
  file_name       text not null,
  file_hash       text not null unique,
  file_size_bytes bigint,
  doc_type        text,
  doc_date        date,
  creditor_hint   text,
  braveheart_id   uuid references hub_braveheart(id) on delete set null,
  page_count      integer,
  text_extracted  boolean default false,
  scanned_at      timestamptz not null default now(),
  notes           text
);

create index if not exists hub_braveheart_documents_braveheart_id_idx
  on hub_braveheart_documents(braveheart_id);
create index if not exists hub_braveheart_documents_doc_date_idx
  on hub_braveheart_documents(doc_date desc nulls last);
create index if not exists hub_braveheart_documents_doc_type_idx
  on hub_braveheart_documents(doc_type);

alter table hub_braveheart_documents enable row level security;

create policy "auth read" on hub_braveheart_documents
  for select using (auth.role() = 'authenticated');

create policy "auth insert" on hub_braveheart_documents
  for insert with check (auth.role() = 'authenticated');

create policy "auth update" on hub_braveheart_documents
  for update using (auth.role() = 'authenticated');

create policy "auth delete" on hub_braveheart_documents
  for delete using (auth.role() = 'authenticated');

comment on table hub_braveheart_documents is
  'Catalog of BRAVEHEART legal document files. Written by scripts\braveheart_catalog.py. Metadata only — no file content.';

comment on column hub_braveheart_documents.file_hash is
  'sha256 of file content. Unique. Changed files get a new row.';

comment on column hub_braveheart_documents.file_path is
  'Local Windows path. Used for click-to-open in /braveheart UI via computer:// link.';

comment on column hub_braveheart_documents.braveheart_id is
  'FK to hub_braveheart. Nullable so bulk-imported docs can be manually linked to a creditor later.';
