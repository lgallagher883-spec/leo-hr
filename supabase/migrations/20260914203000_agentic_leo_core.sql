-- Agentic Leo coordination layer.
-- Stores orchestration state, approval gates, shared operational memory and cost telemetry.
-- Service-only by default. End-user access must go through authorised server routes.

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  requested_by uuid null references auth.users(id) on delete set null,
  agent_key text not null,
  goal text not null,
  status text not null default 'queued'
    check (status in ('queued','running','awaiting_approval','completed','failed','cancelled')),
  risk_level text not null default 'low'
    check (risk_level in ('low','medium','high','restricted')),
  model_tier text not null default 'deterministic'
    check (model_tier in ('deterministic','economy','reasoning')),
  estimated_cost_gbp numeric(12,6) not null default 0,
  actual_cost_gbp numeric(12,6) not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_runs_org_created_idx
  on public.agent_runs (organisation_id, created_at desc);

create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  agent_key text not null,
  skill_key text null,
  action_key text not null,
  status text not null default 'pending'
    check (status in ('pending','running','awaiting_approval','completed','failed','skipped')),
  requires_approval boolean not null default false,
  approval_reason text null,
  tool_key text null,
  input jsonb not null default '{}'::jsonb,
  output jsonb null,
  sequence integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create index if not exists agent_tasks_run_sequence_idx
  on public.agent_tasks (run_id, sequence, created_at);

create table if not exists public.agent_approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  task_id uuid null references public.agent_tasks(id) on delete cascade,
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  requested_by_agent text not null,
  approval_type text not null,
  summary text not null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','expired','cancelled')),
  decided_by uuid null references auth.users(id) on delete set null,
  decision_note text null,
  requested_at timestamptz not null default now(),
  decided_at timestamptz null
);

create index if not exists agent_approvals_pending_idx
  on public.agent_approvals (organisation_id, status, requested_at desc);

create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  scope text not null default 'organisation'
    check (scope in ('organisation','client','project','agent','run')),
  scope_ref text null,
  memory_type text not null,
  title text not null,
  content text not null,
  keywords text[] not null default '{}',
  sensitivity text not null default 'internal'
    check (sensitivity in ('internal','confidential','restricted')),
  source text not null,
  source_ref text null,
  active boolean not null default true,
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_memory_lookup_idx
  on public.agent_memory (organisation_id, active, scope, memory_type);

alter table public.agent_runs enable row level security;
alter table public.agent_tasks enable row level security;
alter table public.agent_approvals enable row level security;
alter table public.agent_memory enable row level security;

revoke all on table public.agent_runs from anon, authenticated;
revoke all on table public.agent_tasks from anon, authenticated;
revoke all on table public.agent_approvals from anon, authenticated;
revoke all on table public.agent_memory from anon, authenticated;

comment on table public.agent_runs is
  'Agentic Leo orchestration runs, model/cost telemetry and status. Service-only.';
comment on table public.agent_tasks is
  'Ordered work units delegated between Leo agents and skills. Service-only.';
comment on table public.agent_approvals is
  'Explicit human approval gates for significant, external, financial or restricted agent actions. Service-only.';
comment on table public.agent_memory is
  'Permission-aware shared operational memory for Agentic Leo. Service-only.';
