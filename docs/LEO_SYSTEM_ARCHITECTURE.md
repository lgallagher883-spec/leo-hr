# LEO System Architecture

**Version:** 1.1  
**Status:** Active  
**Purpose:** This document is the authoritative technical architecture for the LEO platform. It defines the responsibilities, interactions, and boundaries of every major component within the system.

**Last updated:** 5 August 2026

## Related Architecture Documents

- [LEO System Architecture](LEO_SYSTEM_ARCHITECTURE.md)
- [LEO Architecture Map](LEO_ARCHITECTURE_MAP.md)
- [LEO Development Rules](LEO_DEVELOPMENT_RULES.md)
- [LEO Reporting Audit and Strategy](LEO_REPORTING_AUDIT_AND_STRATEGY.md)
- [LEO Architecture Decisions](DECISIONS.md)

---

## Core Principle

LEO is an employment operating system, not a chatbot.

OpenAI provides natural language capabilities, but all reasoning, governance, workflows, and organisational intelligence belong to the LEO platform.

---

## Reporting Architecture Boundaries

### Platform rule

Reporting is a shared platform capability implemented through existing workspaces and APIs.

LEO must not introduce a separate reporting workspace that duplicates module ownership.

### Ownership model

- Dashboard is the command centre. It aggregates key signals and routes users to domain workspaces.
- Compliance owns compliance metrics, compliance intelligence, and compliance operational outputs.
- Insights owns cross-domain interpretation, narrative synthesis, period-aware analysis, and executive narrative outputs.
- Audit Logs owns evidence of reporting access, generation, and distribution events.
- Domain modules own their source metric definitions and operational joins.

### Executive Insight Brief

The Executive Insight Brief is an Insights-owned reporting output.

- Workspace: Insights
- Source: period-aware Insights API data
- Function: executive-ready narrative and supporting counts
- Evidence: generation and download events written to audit logs

Executive Insight Brief behavior must remain inside Insights and Audit Logs boundaries. It must not be reimplemented as a parallel report type in unrelated workspaces.

---

## Multi-Tenant Isolation Rules

All reporting and insight endpoints must enforce organisation isolation server-side.

### Mandatory controls

- Resolve active organisation on the server using authoritative membership context.
- Authorise access with permission RPC checks for the target organisation.
- Apply explicit organisation scoping to every query where the table includes organisation_id.
- Where a table has no organisation_id column, scope through organisation-owned linked IDs from already scoped tables.
- Never trust browser-supplied organisation IDs for report or audit operations.

### Implemented reference pattern

- Insights API now scopes employees by organisation_id.
- Matters and employee_sars are scoped via organisation-scoped employee IDs.
- knowledge_chunks are scoped directly by organisation_id.
- policy_register (no organisation_id in schema) is scoped via policy IDs referenced by organisation-scoped knowledge_chunks.
- Audit Logs API now filters audit_logs by active organisation_id and scopes linked matter/SAR lookup sets via organisation-scoped employee IDs.
- Executive Insight Brief audit events are now written by a server API that resolves organisation and permission context before insert.

---

## Future Development Contract

Any new reporting feature must satisfy all of the following before merge:

- Clear ownership assignment (Dashboard, domain workspace, Insights, Audit Logs).
- No duplicate workspace/function overlap with existing reporting surfaces.
- Server-side organisation resolution and permission checks.
- Explicit tenant scoping for all underlying data retrieval.
- Audit evidence for sensitive report actions.

If any requirement cannot be met, the feature is not architecture-compliant and must be redesigned.

---

## Reminder and Expiry Intelligence Standard

### Platform rule

Reminder and Expiry Intelligence is a stateless-first platform capability.

LEO must calculate reminder state from existing domain source data wherever possible and persist only the minimum state required for deduplication, user controls, and audit evidence.

### Implemented in Phase 1

- Modules in scope:
	- Compliance reminders
	- SAR deadline reminders
	- Leo Learn due and expiry reminders
- Delivery in scope:
	- In-app reminders only
- Milestone rules:
	- Standard reminders: T-30, T-7, T0
	- SAR reminders: T-14, T-7, T-1, T0
	- Each milestone is emitted once only
	- Daily repeated reminders are prohibited
- Deduplication behavior:
	- Milestone emissions are deduplicated by deterministic reminder keys
	- A later reminder is allowed only when a separate configured milestone is reached
- Source update behavior:
	- Source record renewal, completion, or date/status changes must clear or recalculate reminder state server-side
- Visibility contract:
	- After a reminder milestone is emitted, unresolved items remain visible in operational workspaces
	- Workspace visibility is independent from notification delivery and is driven by live source data
- Recipient and permission boundaries:
	- Owner and Senior receive organisation-level oversight reminders within existing permissions
	- Manager receives reminders only in authorised team scope
	- Employee receives personal actionable reminders only
- Sensitive data rules:
	- Reminder payloads must not expose restricted medical, Occupational Health, or sensitive document content
- Isolation and trust boundaries:
	- Organisation and recipient scope are resolved server-side only
	- Browser-supplied organisation, employee, and manager scope is never trusted

### Minimal persistence model

- Persist only:
	- milestone deduplication checkpoints
	- dismiss state
	- snooze state
	- read/acknowledgement where naturally supported
	- reminder audit evidence
- Explicitly out of scope in Phase 1:
	- universal reminder ledger
	- broad delivery-attempt infrastructure for multi-channel outbound delivery

### Audit behavior standard

- Reminder lifecycle actions must write audit evidence with actor, timestamp, reminder identity, and reason metadata.

### Deferred to later phases

- Email and other external reminder channels.
- Advanced escalation chains beyond milestone progression.
- Cross-channel orchestration and delivery-attempt expansion.
- Universal reminder ledger and advanced reminder analytics.

### Ownership model

- Domain modules own source dates and completion state.
- Reminder engine owns milestone emission and deduplication behavior.
- Operational workspaces own unresolved-item visibility.
- Audit Logs own reminder evidence visibility and traceability.