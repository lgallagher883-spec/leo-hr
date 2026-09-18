-- Employer Support Matter lifecycle.
-- These fields are additive so the existing full Leo Matter engine remains compatible.

alter table public.matters
  add column if not exists product_source text not null default 'leo_hr',
  add column if not exists workflow_stage text null,
  add column if not exists completed_at timestamptz null,
  add column if not exists bundle_generated_at timestamptz null,
  add column if not exists retention_expires_at timestamptz null,
  add column if not exists purged_at timestamptz null;

alter table public.matters
  drop constraint if exists matters_product_source_check;

alter table public.matters
  add constraint matters_product_source_check
  check (product_source in ('leo_hr','employer_support'));

create index if not exists matters_employer_support_lifecycle_idx
  on public.matters (organisation_id, product_source, status, retention_expires_at);

comment on column public.matters.product_source is
  'Commercial route that created the Matter. employer_support identifies separately purchased Employer Support Matters.';

comment on column public.matters.workflow_stage is
  'Current process stage presented to the employer. Matter-type-specific workflow logic owns the allowed values.';

comment on column public.matters.retention_expires_at is
  'Per-Matter deletion deadline set only after completion policy is confirmed. No default is intentionally hard-coded.';

comment on column public.matters.purged_at is
  'Timestamp recorded by the controlled purge workflow. Purging must remove linked content and storage, not only this row.';
