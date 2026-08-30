-- Leo verified authority store
-- Global UK employment / HR / H&S / pensions authority cache.
-- This is deliberately separate from organisation knowledge.

create extension if not exists pgcrypto;

create table if not exists public.leo_authority_records (
  id uuid primary key default gen_random_uuid(),
  authority_key text not null unique,
  topic text not null,
  title text not null,
  source_url text not null,
  source_domain text not null,
  source_title text,
  authority_type text not null
    check (authority_type in (
      'legislation',
      'government',
      'acas',
      'hse',
      'pensions_regulator',
      'fair_work_agency',
      'tribunal',
      'appellate_case_law',
      'regulator'
    )),
  legal_status text not null
    check (legal_status in (
      'current',
      'future_enacted',
      'proposed',
      'historical',
      'superseded',
      'uncertain'
    )),
  jurisdiction text not null default 'england_wales',
  summary text not null,
  practical_effect text,
  effective_from date,
  effective_to date,
  source_published_at date,
  source_updated_at date,
  verified_at timestamptz not null default now(),
  expires_at timestamptz not null,
  search_terms text[] not null default '{}',
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leo_authority_records_topic_idx
  on public.leo_authority_records (topic);

create index if not exists leo_authority_records_status_idx
  on public.leo_authority_records (legal_status);

create index if not exists leo_authority_records_verified_at_idx
  on public.leo_authority_records (verified_at desc);

create index if not exists leo_authority_records_expires_at_idx
  on public.leo_authority_records (expires_at);

create index if not exists leo_authority_records_search_terms_gin_idx
  on public.leo_authority_records using gin (search_terms);

alter table public.leo_authority_records enable row level security;

-- No end-user RLS policies are created intentionally.
-- Reads/writes are server-side only through the Supabase service-role key.
