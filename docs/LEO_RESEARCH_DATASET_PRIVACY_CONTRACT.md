# Leo Research Dataset — Privacy and Event Contract

Status: branch-only design foundation. Do not deploy to production without review.

## Purpose

Create a privacy-safe, deterministic first-party research layer for aggregate product insight, original research, PR, SEO and AI-search citations.

This layer is deliberately separate from `audit_logs`. Audit logs contain operational identifiers and descriptive fields that are appropriate for accountability but are not suitable as a research publication source.

## Prohibited data

Research events must never contain:
- names, email addresses, phone numbers or postal addresses
- user IDs, employee IDs, candidate IDs, Matter IDs or document IDs
- free-text Ask Leo prompts or responses
- Matter narratives, allegations, evidence or document contents
- medical/absence narrative or diagnosis information
- protected-characteristic data
- free-text manager/employee notes
- raw audit-log metadata
- any field whose value can directly identify a person

No AI/model call may be introduced solely to classify a research event.

## Allowed dimensions

Only deterministic, pre-approved dimensions may be written:
- event type
- approved event category
- broad organisation size band
- broad industry group
- occurrence time
- schema version
- restricted enumerated properties explicitly approved in code

If organisation-level deduplication is later required, use a non-public pseudonymous key generated server-side. Never expose that key in research outputs.

## Initial event vocabulary

- `ask_leo_category_requested` — only when an existing safe structured category exists; never infer from prompt text
- `matter_opened`
- `matter_completed`
- `rtw_completed`
- `probation_review_completed`
- `probation_extended`
- `compliance_gap_identified`
- `compliance_gap_resolved`
- `onboarding_completed`
- `workflow_started`
- `workflow_completed`
- `learning_or_certificate_admin_completed`
- `recruitment_or_new_starter_workflow_completed`

## Size bands

Use stable broad bands rather than exact employee counts:
- `1-9`
- `10-49`
- `50-249`
- `250+`
- `unknown`

## Industry groups

Use only broad organisation-level categories already known deterministically. Initial allowed values:
- `early_years`
- `care`
- `professional_services`
- `other`
- `unknown`

Do not derive industry from employee records or sensitive/free text.

## Publication suppression

Aggregate outputs must default to suppression unless BOTH thresholds are met:
- at least 10 distinct organisations
- at least 30 events in the reported slice

A public statistic must always retain enough metadata to state:
- reporting period
- population
- number of organisations
- number of events/records forming the denominator
- methodology/event definition
- applicable exclusions and suppression rule

Never extrapolate from a suppressed or small cohort.

## Architecture decision

The existing `audit_logs` system is useful as evidence that deterministic application events already exist, but it is not safe to expose as the research dataset because it supports user names/emails, entity IDs/names, descriptions, previous/new values and arbitrary metadata.

Implement the research layer as an additive, minimised table plus a single server-side writer. Application code should emit only typed, allow-listed research events. Do not copy arbitrary audit records into the research table.

## Proposed table

`research_events`
- `id uuid primary key default gen_random_uuid()`
- `event_type text not null`
- `event_category text null`
- `organisation_key text null` (pseudonymous; only if required)
- `organisation_size_band text not null default 'unknown'`
- `industry_group text not null default 'unknown'`
- `properties jsonb not null default '{}'`
- `schema_version integer not null default 1`
- `occurred_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

No employee/user/candidate/Matter/document foreign keys.

## First implementation batch

Prefer high-confidence completion events already represented by structured application state:
1. `probation_review_completed`
2. `probation_extended`
3. `onboarding_completed`
4. `matter_opened`
5. `matter_completed`

Before instrumenting each event, confirm the exact successful state transition in the current route/service. Do not infer completion from page views.

## Tests required before merge

- event_type rejects values outside the allow-list
- properties reject unknown keys
- strings resembling email addresses are rejected
- prohibited key names such as name, email, employee_id, user_id, matter_id, notes, description, prompt, response, evidence and medical fields are rejected recursively
- no arbitrary free-text property can be written
- organisation size is banded before storage
- aggregate query suppresses slices below either threshold
- public aggregate result contains no organisation key
