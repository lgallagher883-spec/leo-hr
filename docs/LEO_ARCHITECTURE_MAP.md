# LEO Architecture Map

*Last Updated: July 2026*

## Related Architecture Documents

- [LEO System Architecture](LEO_SYSTEM_ARCHITECTURE.md)
- [LEO Architecture Map](LEO_ARCHITECTURE_MAP.md)
- [LEO Development Rules](LEO_DEVELOPMENT_RULES.md)
- [LEO Reporting Audit and Strategy](LEO_REPORTING_AUDIT_AND_STRATEGY.md)
- [LEO Architecture Decisions](DECISIONS.md)

---

# Purpose

LEO HR is an employer-facing AI HR platform designed to guide employers through workplace matters.

LEO is not a generic chatbot.

LEO acts as an AI HR Director / Consultant that helps employers understand situations, identify risk, follow appropriate processes, and make informed decisions.

LEO provides:

* HR guidance
* Risk awareness
* Policy alignment
* Recommended next steps
* Document support
* Proactive HR insights

LEO does not make final decisions on behalf of employers.

LEO provides structured recommendations and guidance to help employers make better decisions.

---

# The Four LEO Components

LEO HR is built around four connected intelligence layers:

```
                LEO HR

                   |
     ---------------------------------
     |              |                |
     ▼              ▼                ▼

   CORE        KNOWLEDGE          DRAFT
(reasoning)   (information)    (creation)

                   |
                   ▼

                INSIGHT
             (intelligence)
```

---

# 1. LEO Core

## Purpose

LEO Core is the reasoning engine.

It interprets employer questions and determines how LEO should respond.

Core is responsible for:

* Understanding user intent
* Classifying HR situations
* Assessing risk
* Determining appropriate response pathways
* Identifying when a matter should be created
* Routing requests to the correct LEO capability

Current location:

```
leo/
└── core/
    ├── classifier.ts
    ├── intent.ts
    ├── risk.ts
    └── router.ts
```

Core contains:

## Intent

Determines what type of HR issue is being discussed.

Examples:

* Absence
* Disciplinary
* Grievance
* Redundancy
* Contract
* Pay
* Termination

---

## Risk

Assesses potential exposure.

Risk considers:

* Legal risk
* Employee risk
* Business risk
* Relationship risk

---

## Classification

Determines the type of support required.

Examples:

* Advice
* Policy guidance
* Escalation required
* Document needed

---

## Routing

Controls where the request goes next.

Core decides:

* Answer directly
* Create a matter
* Request more information
* Escalate
* Generate documentation

---

# 2. LEO Knowledge

## Purpose

LEO Knowledge provides the information needed to give accurate, company-specific guidance.

Knowledge allows LEO to understand:

* Company policies
* Employee handbook
* Procedures
* Contracts
* HR documents
* Legislation
* ACAS guidance

Knowledge is what allows LEO to move from:

"General HR advice"

to:

"Advice based on your organisation."

---

## Knowledge Principles

LEO should consider:

1. Company policy
2. Employment legislation
3. ACAS guidance
4. HR best practice

If company policy conflicts with legal obligations, LEO should identify the conflict and recommend the safer compliant approach.

---

# 3. LEO Draft

## Purpose

LEO Draft creates HR documentation based on the context of a matter.

Examples:

* Investigation invitations
* Disciplinary letters
* Grievance communications
* Outcome letters
* Meeting notes
* HR templates
* Employee communications

Draft does not decide what should happen.

Draft creates documents using:

* Core reasoning
* Knowledge sources
* Matter history

---

# 4. LEO Insight

## Purpose

LEO Insight provides proactive intelligence.

Insight moves LEO beyond answering questions.

It helps employers identify:

* Emerging risks
* HR patterns
* Compliance gaps
* Missing processes
* Workforce trends

Examples:

"Several absence matters are increasing."

"Your disciplinary process is missing a documented investigation stage."

"Your policy does not appear aligned with current guidance."

---

# Matters

Matters are the central workflow object inside LEO.

A matter represents a real HR situation.

Examples:

* Employee absence
* Disciplinary issue
* Grievance
* Flexible working request
* Performance concern

A matter should contain:

* Background
* Employee information
* Questions
* Leo guidance
* Risk assessment
* Recommended actions
* Documents
* History

---

# Data Flow

The intended flow is:

```
Employer Question

        ↓

LEO Core

        ↓

Intent Detection

        ↓

Risk Assessment

        ↓

Classification

        ↓

Knowledge Check

        ↓

Leo Recommendation

        ↓

Matter / Draft / Insight
```

---

# Reminder and Expiry Intelligence

## Purpose

Reminder and Expiry Intelligence provides proactive, milestone-based in-app reminders using existing source dates, without duplicating domain logic.

## Ownership Model

- Domain modules own source dates and completion state.
- Reminder orchestration owns milestone emission and deduplication.
- Operational workspaces own unresolved-item visibility after reminder delivery.
- Audit Logs own reminder lifecycle evidence.

## Implemented in Phase 1

- Compliance reminders
- SAR deadline reminders
- Leo Learn due and expiry reminders
- In-app delivery only
- Stateless-first source calculation
- Minimal persistence for dedupe, dismiss, snooze, natural read/ack, and audit evidence

## Milestone Rules

- Standard reminders: T-30, T-7, T0
- SAR reminders: T-14, T-7, T-1, T0
- Each milestone is sent once only
- Daily repeated reminders are prohibited

## Trust and Isolation Rules

- All organisation and recipient scope is resolved server-side.
- Browser-supplied organisation, employee, and manager scope is never trusted.
- Reminder content must not expose restricted medical, Occupational Health, or sensitive document content.

## Deferred to Later Phases

- Email and other non in-app channels
- Advanced escalation chains
- Universal reminder ledger
- Cross-channel orchestration and adaptive reminder intelligence

---

# Development Principle

The architecture must always be respected.

The UI displays LEO.

The UI does not contain LEO intelligence.

Business logic belongs inside the LEO architecture.

The four LEO components should remain separated:

* Core = reasoning
* Knowledge = information
* Draft = creation
* Insight = intelligence

---

# Reporting Ownership Map

Reporting is delivered through existing platform components, not a separate reporting workspace.

Ownership boundaries:

* Dashboard = command centre and navigation to reporting surfaces
* Compliance = compliance metrics and compliance operations reporting
* Insights = cross-domain interpretation, period-aware analysis, and Executive Insight Brief
* Audit Logs = evidence plane for report creation, viewing, and download lifecycle events
* Domain modules = source metric definitions and domain-specific joins

Executive Insight Brief location:

* Produced in Insights
* Uses period-aware Insights data
* Writes lifecycle events to Audit Logs

---

# Tenant Isolation Boundary

All reporting surfaces must enforce organisation isolation on the server.

Rules:

* Resolve active organisation using server-side membership context
* Validate permissions with organisation-aware RPC checks
* Apply explicit organisation filters on all tables that include organisation_id
* Where a table does not include organisation_id, scope through organisation-owned linked IDs
* Never trust client-provided organisation identifiers for reporting or audit writes

---

# Long-Term Vision

LEO becomes an AI HR Director that helps employers manage workplace issues from start to finish.

LEO should eventually be able to:

* Understand company context
* Analyse HR risks
* Guide managers
* Recommend next steps
* Create documentation
* Identify compliance issues
* Provide proactive HR insight

LEO supports employers.

The employer remains responsible for decisions.
