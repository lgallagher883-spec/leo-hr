# LEO Architecture Decisions


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