create table if not exists public.signature_envelopes (
  id uuid primary key default gen_random_uuid(),

  organisation_id uuid not null
    references public.organisations(id)
    on delete cascade,

  connection_id bigint not null
    references public.organisation_connections(id)
    on delete restrict,

  provider_key text not null default 'docusign',
  provider_envelope_id text not null,

  source_module text not null,
  source_record_id text not null,
  source_document_id text null,

  document_name text not null,
  recipient_summary jsonb not null default '[]'::jsonb,

  status text not null default 'created',
  provider_status text null,

  sent_at timestamptz null,
  delivered_at timestamptz null,
  completed_at timestamptz null,
  declined_at timestamptz null,
  voided_at timestamptz null,
  expires_at timestamptz null,

  completed_document_path text null,
  certificate_document_path text null,

  last_status_checked_at timestamptz null,
  last_error_code text null,
  last_error_message text null,

  metadata jsonb not null default '{}'::jsonb,

  created_by_user_id uuid null
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint signature_envelopes_status_check
    check (
      status in (
        'created',
        'sent',
        'delivered',
        'completed',
        'declined',
        'voided',
        'expired',
        'error'
      )
    ),

  constraint signature_envelopes_provider_unique
    unique (
      organisation_id,
      provider_key,
      provider_envelope_id
    )
);

create index if not exists signature_envelopes_org_created_idx
  on public.signature_envelopes (
    organisation_id,
    created_at desc
  );

create index if not exists signature_envelopes_source_idx
  on public.signature_envelopes (
    organisation_id,
    source_module,
    source_record_id
  );

create index if not exists signature_envelopes_status_idx
  on public.signature_envelopes (
    organisation_id,
    status,
    updated_at desc
  );

alter table public.signature_envelopes enable row level security;