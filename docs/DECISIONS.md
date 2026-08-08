# LEO Architecture Decisions

## Related Architecture Documents

- [LEO System Architecture](LEO_SYSTEM_ARCHITECTURE.md)
- [LEO Architecture Map](LEO_ARCHITECTURE_MAP.md)
- [LEO Development Rules](LEO_DEVELOPMENT_RULES.md)
- [LEO Reporting Audit and Strategy](LEO_REPORTING_AUDIT_AND_STRATEGY.md)
- [LEO Architecture Decisions](DECISIONS.md)

---

## 5 August 2026

### Decision

Reminder and Expiry Intelligence is a stateless-first platform capability with minimal persistence.

### Implemented in Phase 1

- Scope includes Compliance reminders, SAR deadline reminders, and Leo Learn due and expiry reminders.
- Delivery channel is in-app only.
- Reminder status is calculated from existing source dates.
- Milestones are fixed:
	- Standard reminders: T-30, T-7, T0
	- SAR reminders: T-14, T-7, T-1, T0
- Each milestone is emitted once only.
- Daily repeated reminders are prohibited.
- Outstanding items remain visible in their operational workspace after reminder delivery.
- Source record changes automatically clear or recalculate reminder state.
- Reminder scope and recipients are resolved server-side only.
- Browser-supplied organisation, employee, and manager scope is never trusted.

### Minimal persistence model (approved)

- Keep deduplication checkpoints for emitted milestones.
- Keep user reminder state for dismiss and snooze.
- Keep read/acknowledgement only where naturally supported by existing notification state.
- Keep audit evidence for reminder lifecycle actions.
- Do not create a universal reminder ledger in Phase 1.

### Recipient and permission boundaries (approved)

- Owner and Senior: organisation oversight reminders within existing permission boundaries.
- Manager: reminders only for authorised team scope.
- Employee: personal actionable reminders only.
- Reminder content must not expose restricted medical, Occupational Health, or sensitive document content.

### Audit behavior (approved)

- Reminder lifecycle actions must write audit evidence with clear metadata and actor context.

### Deferred to later phases

- Email, Teams, Slack, push, and other non in-app channels.
- Advanced escalation chains beyond configured milestone progression.
- A universal reminder ledger.
- Cross-channel orchestration, digest optimisation, and adaptive notification intelligence.


ADR – Repository Consolidation

Date: 12 July 2026

Decision

LEO will be maintained as a single Git repository with the application and intelligence layers versioned together.

Reason

A nested Git repository caused development friction, commit confusion and version control complexity.

Outcome

The repository root is now:

C:\Users\liver\leo

The intelligence engine remains organised under:

leo/

but is now part of the same repository as the application.
---

## 7 July 2026

### Decision

The Matter is the centre of the LEO platform.

### Reason

Every capability provided by Leo should strengthen an active Matter.

Knowledge, Draft, Insight and future capabilities all operate around Matters.

---

## Decision

Leo leads the workflow.

### Reason

Employers should not need to decide what tool to use next.

Leo should recommend the next action.

---

## Decision

The conversation is the Matter.

### Reason

The conversation represents the evolving understanding of the workplace issue.

Every discussion should contribute towards the final outcome.

---

## Decision

Matter conversations are stored separately.

### Implementation

Dedicated database table:

matter_messages

### Reason

Supports:

- Audit trail
- Timeline
- Search
- Insight
- Reporting
- Future AI reasoning

---

## Decision

Every component has one responsibility.

### Reason

Large pages become difficult to maintain.

Matter Workspace will be built using reusable React components.

---

## Decision

Leo intelligence belongs inside leo/.

The UI presents Leo.

The UI never becomes Leo.

---

## Decision

Reporting ownership remains distributed across existing workspaces.

### Reason

Creating a separate reporting workspace would duplicate ownership and fragment accountability.

Reporting boundaries are now:

- Dashboard = command-centre aggregation
- Compliance = compliance operational reporting
- Insights = narrative interpretation and Executive Insight Brief
- Audit Logs = reporting lifecycle evidence
- Domain modules = source metrics and domain joins

### Constraint

All reporting endpoints must enforce server-side organisation isolation with explicit tenant scoping and must not trust browser-provided organisation IDs.