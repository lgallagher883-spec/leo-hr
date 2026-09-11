create table if not exists public.organisation_reminder_settings (
  organisation_id uuid primary key references public.organisations(id) on delete cascade,
  standard_days_before integer[] not null default array[30,7]::integer[],
  updated_at timestamptz not null default now(),
  updated_by uuid null references auth.users(id) on delete set null
);

alter table public.organisation_reminder_settings enable row level security;

comment on table public.organisation_reminder_settings is
  'Organisation-level reminder timing preferences. SAR statutory deadline milestones remain fixed in application logic.';

comment on column public.organisation_reminder_settings.standard_days_before is
  'Advance reminder thresholds in days for standard compliance and learning reminders. Due-day reminders are always retained.';
