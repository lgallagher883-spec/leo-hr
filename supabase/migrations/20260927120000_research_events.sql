-- Privacy-safe first-party research event layer.
-- Additive only. No production deployment is implied by this migration existing in source control.

create extension if not exists pgcrypto;

create table if not exists public.research_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_category text null,
  organisation_key text null,
  organisation_size_band text not null default 'unknown',
  industry_group text not null default 'unknown',
  properties jsonb not null default '{}'::jsonb,
  schema_version integer not null default 1,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint research_events_event_type_check check (
    event_type in (
      'ask_leo_category_requested',
      'matter_opened',
      'matter_completed',
      'rtw_completed',
      'probation_review_completed',
      'probation_extended',
      'compliance_gap_identified',
      'compliance_gap_resolved',
      'onboarding_completed',
      'workflow_started',
      'workflow_completed',
      'learning_or_certificate_admin_completed',
      'recruitment_or_new_starter_workflow_completed'
    )
  ),
  constraint research_events_size_band_check check (
    organisation_size_band in ('1-9','10-49','50-249','250+','unknown')
  ),
  constraint research_events_industry_group_check check (
    industry_group in ('early_years','care','professional_services','other','unknown')
  ),
  constraint research_events_schema_version_check check (schema_version >= 1),
  constraint research_events_properties_object_check check (jsonb_typeof(properties) = 'object')
);

create index if not exists research_events_occurred_at_idx
  on public.research_events (occurred_at);
create index if not exists research_events_type_time_idx
  on public.research_events (event_type, occurred_at);
create index if not exists research_events_dimensions_idx
  on public.research_events (organisation_size_band, industry_group, occurred_at);

alter table public.research_events enable row level security;

-- Deliberately create no authenticated/browser policies.
-- Writes and aggregate reporting must go through reviewed server-side code/service credentials.
revoke all on table public.research_events from anon, authenticated;

comment on table public.research_events is
  'Minimised non-identifying product research events. Never store employee/user/candidate/matter/document identifiers or free text.';

create or replace view public.research_event_safe_aggregates
with (security_invoker = true)
as
select
  date_trunc('month', occurred_at) as period_month,
  event_type,
  event_category,
  organisation_size_band,
  industry_group,
  count(*)::bigint as event_count,
  count(distinct organisation_key)::bigint as organisation_count
from public.research_events
group by 1,2,3,4,5
having count(*) >= 30
   and count(distinct organisation_key) >= 10;

revoke all on table public.research_event_safe_aggregates from anon, authenticated;
