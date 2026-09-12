-- Persist the Welcome Brief stage and conversation so employers can pause and resume.

create table if not exists public.welcome_brief_progress (
  organisation_id uuid primary key,
  stage text not null default 'business_overview',
  messages jsonb not null default '[]'::jsonb,
  started boolean not null default false,
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.welcome_brief_progress enable row level security;

drop policy if exists "welcome_brief_progress_select" on public.welcome_brief_progress;
drop policy if exists "welcome_brief_progress_write" on public.welcome_brief_progress;

create policy "welcome_brief_progress_select"
on public.welcome_brief_progress
for select
to authenticated
using (
  public.leo_has_permission(organisation_id, 'foundations.view', auth.uid())
  or public.leo_has_permission(organisation_id, 'foundations.manage', auth.uid())
);

create policy "welcome_brief_progress_write"
on public.welcome_brief_progress
for all
to authenticated
using (
  public.leo_has_permission(organisation_id, 'foundations.manage', auth.uid())
)
with check (
  public.leo_has_permission(organisation_id, 'foundations.manage', auth.uid())
);
