-- Harden internal security/migration inventory tables.
-- These tables are service-only. They currently grant privileges only to postgres/service_role,
-- so enabling RLS without end-user policies preserves service access while preventing accidental client exposure.

alter table public.leo_schema_migrations enable row level security;
alter table public.leo_matter_security_inventory enable row level security;

revoke all on table public.leo_schema_migrations from anon, authenticated;
revoke all on table public.leo_matter_security_inventory from anon, authenticated;

comment on table public.leo_schema_migrations is
  'Internal migration inventory. Service-only; RLS enabled with no client policies.';

comment on table public.leo_matter_security_inventory is
  'Internal matter-security inventory. Service-only; RLS enabled with no client policies.';
