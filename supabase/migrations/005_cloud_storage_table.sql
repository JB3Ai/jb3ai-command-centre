-- ============================================================================
-- Cloud Storage Integration Table (ADDITIVE)
-- Project: uxeolplwhtyyefpmwktw (eu-west-1)
-- Date:    2026-08-24
-- Auth:    Supabase magic-link email; RLS locked to authenticated users
--
-- This migration adds the hub_cloud_storage table for cloud storage integration
-- ============================================================================

-- ============================================================================
-- C. NEW TABLE: hub_cloud_storage  →  Cloud storage integration for Google Drive, OneDrive, iCloud
-- ============================================================================

create table if not exists public.hub_cloud_storage (
  id uuid primary key default gen_random_uuid(),
  platform text NOT NULL, -- 'google_drive', 'onedrive', 'icloud'
  file_id text UNIQUE NOT NULL,
  name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  modified_at timestamptz NOT NULL DEFAULT now(),
  last_accessed timestamptz,
  owner_email text,
  folder_path text,
  file_url text,
  storage_usage_mb numeric(10,2),
  access_count integer DEFAULT 0,
  tags text[],
  status text DEFAULT 'active',
  sync_status text DEFAULT 'pending',
  last_sync timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Indexes for performance
create index if not exists idx_cloud_storage_platform on public.hub_cloud_storage(platform);
create index if not exists idx_cloud_storage_file_id on public.hub_cloud_storage(file_id);
create index if not exists idx_cloud_storage_owner on public.hub_cloud_storage(owner_email);
create index if not exists idx_cloud_storage_modified_at on public.hub_cloud_storage(modified_at desc);
create index if not exists idx_cloud_storage_created_at on public.hub_cloud_storage(created_at desc);
create index if not exists idx_cloud_storage_status on public.hub_cloud_storage(status);
create index if not exists idx_cloud_storage_sync_status on public.hub_cloud_storage(sync_status);

-- Row Level Security
alter table public.hub_cloud_storage enable row level security;
drop policy if exists "auth_all_hub_cloud_storage" on public.hub_cloud_storage;
create policy "auth_all_hub_cloud_storage" on public.hub_cloud_storage
  as permissive
  for all
  to authenticated
  using (true)
  with check (true);