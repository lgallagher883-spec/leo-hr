# LEO Date-Driven Reminder Audit and Architecture

## Status Update (5 August 2026)

This document now serves as the permanent Reminder and Expiry Intelligence standard baseline.

The original audit sections remain as design history. Where design options conflict with implemented architecture, the implemented Phase 1 standard in this status section and in the platform architecture documents is authoritative.

### Implemented in Phase 1

- Scope:
	- Compliance reminders
	- SAR deadline reminders
	- Leo Learn due and expiry reminders
- Delivery:
	- In-app only
- Philosophy:
	- Stateless-first reminder calculation from existing source dates
	- Minimal persistence only for dedupe, dismiss, snooze, natural read/ack, and audit evidence
- Milestone rules:
	- Standard items: T-30, T-7, T0
	- SAR items: T-14, T-7, T-1, T0
	- Each milestone is emitted once only
	- Daily repeated reminders are prohibited
- Recipient and permission boundaries:
	- Owner and Senior: organisation oversight within existing permissions
	- Manager: authorised team scope only
	- Employee: personal actionable reminders only
- Safety and isolation:
	- All reminder scope and recipient resolution is server-side
	- Browser-supplied organisation, employee, and manager scope is never trusted
	- Restricted medical, Occupational Health, and sensitive document content is excluded from reminder payloads
- Source-update recalculation behavior:
	- Source record renewal, completion, or relevant date/status change clears or recalculates reminder state automatically
- Audit behavior:
	- Reminder lifecycle actions produce audit evidence

### Deferred to later phases

- Email and non in-app delivery channels
- Advanced escalation chains beyond configured milestone progression
- Universal reminder ledger
- Cross-channel orchestration and adaptive reminder intelligence

## 1) Executive Summary

This audit reviewed date-driven capabilities across Employees, Compliance, Matters, SAR Requests, Leo Talent, Leo Learn, Foundations, HR Resources, Dashboard, Audit Logs, Billing, Connections, and Organisation Settings.

The current platform has strong date capture and date-aware visibility, but no single reminder execution layer. In practice, the system does the following today:

- Stores and displays critical dates in many modules.
- Computes due/overdue state in APIs and UI workspaces.
- Allows manual actions (for example, invitation resend and manual sync).
- Records many user actions into audit or analytics tables.

What is missing is an organisation-aware reminder engine that:

- Schedules and executes reminders automatically.
- Delivers through a governed channel model.
- Prevents duplicate reminders across modules.
- Persists reminder state and delivery attempts.
- Provides first-class reminder observability and auditability.

Single best architecture for Phase 1: centralise reminder orchestration as a stateless-first service with minimal persistence and in-app delivery only, while preserving existing module ownership of business dates.

## 2) Existing Reminder Capability

### What is implemented today

- Date-rich domain models are implemented and actively used for status and risk views.
- Some modules compute due and overdue states from those dates.
- UI and API layers surface deadlines, review windows, and expiry statuses.
- Manual communications exist in specific flows (for example, invitation resend).
- Role-based access and organisation boundaries are strong and reusable.

### What was not implemented at audit time

- A central multi-channel scheduler/runner was not implemented.
- Generic retry backoff for outbound channels was not implemented.
- Cross-channel preference models were not implemented.
- Universal delivery ledger behavior was not implemented.

## 3) Module-by-Module Findings

Status key:

- Already implemented
- Can be extended
- Requires new development

### Employees and Compliance

- Evidence:
	- app/api/compliance/route.ts
	- app/dashboard/compliance/page.tsx
	- app/api/employees/[id]/probation/route.ts
	- app/api/employees/[id]/training/route.ts
- Finding:
	- Extensive date fields and due-state rendering exist (probation, checks, expiry, renewals).
	- Probation review schedules are generated as records, but no reminder dispatch is triggered.
- Status:
	- Already implemented: date models, risk-state calculations.
	- Can be extended: convert current due-state logic into reminder rule sources.
	- Requires new development: automatic multi-channel reminders and delivery logging.

### SAR Requests

- Evidence:
	- app/api/sar-requests/route.ts
	- app/dashboard/sar-requests/page.tsx
	- app/dashboard/sar-requests/[id]/page.tsx
- Finding:
	- Response due and extended due dates are calculated and displayed with due/overdue filters.
	- No autonomous reminder execution to assignees or escalation roles.
- Status:
	- Already implemented: deadline computation and exposure.
	- Can be extended: deadline classifier can feed a shared reminder source adapter.
	- Requires new development: reminder cadences and escalations.

### Matters

- Evidence:
	- app/api/matters/[id]/bundle/route.ts
- Finding:
	- Matter-adjacent deadline usage is present (especially SAR-linked contexts), but reminder workflows are not orchestrated.
- Status:
	- Can be extended: source extraction for deadline-based reminders.
	- Requires new development: matter reminder policy and delivery flows.

### Leo Talent

- Evidence:
	- app/api/talent/interviews/route.ts
	- app/api/talent/offers/route.ts
	- app/api/talent/onboarding/route.ts
	- app/api/talent/due-diligence/route.ts
- Finding:
	- Date-driven lifecycle management is mature (scheduled interviews, offer response windows, onboarding due dates).
	- Automation exists for progression and checklist generation, not for central reminder dispatch.
	- Calendar sync exists for interview events, but this is integration synchronization, not unified reminder orchestration.
- Status:
	- Already implemented: lifecycle dates + partial operational automation.
	- Can be extended: onboarding/checklist/interview milestones are high-quality reminder signal sources.
	- Requires new development: shared reminder channeling and policy governance.

### Leo Learn

- Evidence:
	- app/api/leo-learn/intelligence/route.ts
	- app/api/leo-learn/qualifications/route.ts
	- app/dashboard/leo-learn/components/settings/LearningSettingsWorkspace.tsx
- Finding:
	- Strong due and expiry intelligence exists for assignments, pathways, and qualifications.
	- Notification settings are configurable in workspace settings, but currently function as configuration state, not proven runtime dispatch.
- Status:
	- Already implemented: detection and policy intent fields.
	- Can be extended: existing settings can become first-class reminder rule inputs.
	- Requires new development: execution runtime that honours those settings and logs deliveries.

### Foundations and Connections

- Evidence:
	- app/api/foundations/connections/[id]/actions/route.ts
	- app/api/foundations/connections/[id]/route.ts
	- app/dashboard/foundations/connections/page.tsx
- Finding:
	- Connection jobs and health checks exist; manual sync and test actions are implemented.
	- This is operational job control, not date-triggered reminder orchestration.
- Status:
	- Already implemented: job/event primitives and health telemetry.
	- Can be extended: job infrastructure can run reminder tasks.
	- Requires new development: reminder-specific queue semantics, retry, dedupe, and recipient targeting.

### HR Resources and Policy Review

- Evidence:
	- app/api/hr-resources/route.ts
	- app/dashboard/policies/page.tsx
- Finding:
	- Policy next review dates are captured and ordered.
	- No automated review reminder emissions for owners/reviewers.
- Status:
	- Already implemented: review-date persistence and visibility.
	- Can be extended: straightforward rule source for reminder orchestration.
	- Requires new development: reviewer notification and escalation workflow.

### Dashboard and Insights

- Evidence:
	- app/dashboard/page.tsx
	- app/api/compliance/intelligence/route.ts
	- app/api/insights/route.ts
- Finding:
	- Dashboard and intelligence endpoints consume date/risk outputs and provide guidance.
	- They are decision-support outputs, not reminder execution components.
- Status:
	- Already implemented: prioritisation and guidance surfaces.
	- Can be extended: dashboard can show reminder queue health and failure states.
	- Requires new development: reminder operations visibility panels.

### Billing

- Evidence:
	- app/dashboard/billing/page.tsx
	- app/api/stripe/checkout/route.ts
	- app/api/stripe/portal/route.ts
	- app/api/stripe/webhook/route.ts
- Finding:
	- Subscription period dates and invoice due dates are synchronised and visible.
	- No internal reminder orchestration layer for billing lifecycle communications.
- Status:
	- Already implemented: billing date ingestion and subscription event syncing.
	- Can be extended: renewal and payment-risk reminders via central engine.
	- Requires new development: reminder policy definitions and dispatch logic.

### Organisation Settings and Invitations

- Evidence:
	- app/api/organisation/invitations/route.ts
	- app/api/organisation/invitations/[invitationId]/route.ts
	- app/api/organisation/invitations/accept/route.ts
- Finding:
	- Invitation expiry lifecycle exists, including expiry marking and manual resend.
	- No autonomous reminder sequence (for example, pre-expiry or non-response nudges).
- Status:
	- Already implemented: expiry controls and manual resend.
	- Can be extended: invitation state transitions provide ideal reminder triggers.
	- Requires new development: automated cadence and opt-out safeguards.

### Audit Logs

- Evidence:
	- app/api/audit-logs/route.ts
	- app/api/insights/brief-audit/route.ts
	- app/api/employees/[id]/leave/route.ts
	- app/api/employees/[id]/training/route.ts
- Finding:
	- Audit logging is broad for user actions.
	- There is no dedicated reminder-delivery ledger with idempotency keys, attempts, outcomes, and provider message references.
- Status:
	- Already implemented: action-oriented audit scaffolding.
	- Can be extended: reuse pattern for reminder event recording.
	- Requires new development: canonical reminder run/delivery schema.

## 4) Missing Reminder Opportunities

Highest-value missing opportunities:

1. Compliance critical expiry reminders.
2. SAR statutory deadline reminders and escalations.
3. Policy review-date reminders to responsible owners.
4. Qualification and certificate renewal reminders.
5. Learning assignment due and overdue reminders.
6. Offer response deadline reminders.
7. Interview confirmation/reschedule reminders.
8. Onboarding task due reminders.
9. Invitation pre-expiry and final-day reminders.
10. Billing renewal and payment-risk reminders.

Cross-cutting gap: no shared deduplication strategy. The same person can receive multiple non-coordinated prompts if each module implements reminders separately.

## 5) Recommended Reminder Architecture

Single best architecture: stateless-first reminder orchestration with minimal persistence.

### Core design

- Source adapters:
	- Each module publishes reminder candidates from authoritative date fields.
	- Example sources: compliance checks, SAR deadlines, policy reviews, learning due dates, onboarding items, invitations, billing renewal windows.

- Rule engine:
	- Applies organisation-aware rules (for example, T-30, T-7, T-1, overdue + escalation).
	- Reads module-level and organisation-level preferences.

- Delivery providers:
	- Initial channel: in-app only.
	- Future channels: email, Teams, Slack, webhook.

- Minimal persistence:
	- Dedupe checkpoints
	- Dismiss and snooze state
	- Natural read/ack state
	- Reminder audit evidence

- Explicitly avoided in Phase 1:
	- Universal reminder ledger

- Governance and controls:
	- Quiet hours, digest modes, priority bands, and role-based escalations.
	- Strong organisation scoping at every stage.

### Why this is best

- Prevents duplicated logic in every module.
- Provides consistency for users and administrators.
- Increases observability and incident response capability.
- Scales to new modules without reinventing reminder infrastructure.

## 6) Quick Wins

1. Define a canonical reminder event shape and idempotency key convention.
2. Implement read-only reminder candidate views for three high-risk domains:
	 - Compliance expiry
	 - SAR deadlines
	 - Policy next review
3. Build in-app reminder centre using existing auth and org-scoping patterns.
4. Add reminder health KPIs to dashboard (queued, sent, failed, overdue unsent).
5. Wire Leo Learn notification settings into a no-op validation pipeline first (prove policy mapping before channel dispatch).

## 7) Development Phases

### Phase 1: Implemented baseline

- In-app milestone reminders for Compliance, SAR, and Leo Learn.
- Stateless-first source calculation.
- Minimal persistence for dedupe, user controls, and audit evidence.

### Phase 2: Channel Expansion (deferred)

- Add email provider integration and retry semantics.
- Add digest mode and quiet-hour controls.
- Add delivery observability and failure triage views.

### Phase 3: Module Coverage (deferred)

- Integrate Leo Learn, Talent onboarding, invitations, and policy review.
- Add cross-module deduplication and escalation routing.

### Phase 4: Intelligence and Optimisation (deferred)

- Adaptive cadences based on completion behavior.
- Outcome analytics (acknowledged, acted, ignored).
- Intelligent bundling to reduce notification fatigue.

## 8) Risks

1. Notification fatigue if cadences are not constrained.
2. Duplicate messages without robust idempotency and dedupe keys.
3. Cross-tenant leakage risk if any reminder query omits organisation scoping.
4. False urgency if date fields are incomplete or stale.
5. Operational blind spots if delivery outcomes are not centrally logged.
6. Integration fragility if channel providers fail without graceful fallback.

Mitigations:

- Enforce org-scoped queries and recipient resolution.
- Require dedupe keys per reminder event.
- Add dead-letter queue and alerting for failed sends.
- Add administrator controls for cadence, channel, and escalation.

## 9) Long-Term Vision

LEO should evolve from date visibility to proactive deadline governance.

Target state:

- One platform reminder service across all workspaces.
- Consistent user experience for due, overdue, and escalated events.
- Predictable and auditable delivery trails for operational and compliance assurance.
- Embedded intelligence that recommends cadence tuning and identifies systemic deadline risk.

In long-term maturity, date-driven operations become measurable: the platform should track reduction in missed deadlines, faster completion of required actions, and lower risk exposure across compliance, talent, learning, and legal workflows.
