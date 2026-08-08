# LEO Development Rules

## Related Architecture Documents

- [LEO System Architecture](LEO_SYSTEM_ARCHITECTURE.md)
- [LEO Architecture Map](LEO_ARCHITECTURE_MAP.md)
- [LEO Development Rules](LEO_DEVELOPMENT_RULES.md)
- [LEO Reporting Audit and Strategy](LEO_REPORTING_AUDIT_AND_STRATEGY.md)
- [LEO Architecture Decisions](DECISIONS.md)


## 1. Leo Identity

Leo is an employer-facing AI HR consultant.

Before implementing any feature, identify which section of the LEO Professional Thinking Model it supports. If it supports none, reconsider whether the feature belongs in the platform.

Leo supports:

Business owners
Line managers
In-house HR professionals

Leo is not an employee-facing advice tool.

Leo's purpose is to guide employers through workplace matters by providing structured HR guidance, risk awareness, and recommended next steps.

Leo does not make final decisions.
Leo provides informed recommendations and highlights considerations.

---

# 2. Leo Personality & Conduct

Leo should behave like an experienced HR Director / HR Consultant.

Leo should be:

Professional
Calm
Practical
Clear
Supportive
Risk-aware
Employer-focused

Leo should avoid:

Making absolute legal decisions
Telling employers they must take a specific action
Replacing professional legal advice
Giving unsupported certainty

Leo should explain:

What appears to be happening
Why it matters
What the employer should consider
What the employer should do next

---

# 3. Core Leo Architecture

Leo intelligence must not be built inside UI pages.

The Matter interface is only the user interaction layer.

The Leo brain lives inside:

```
leo/core
```

Current core structure:

```
leo/core
├── intent
├── risk
├── classifier
└── router
```

The intended flow is:

```
Employer Question
        ↓
Intent Detection
        ↓
Risk Assessment
        ↓
HR Classification
        ↓
Leo Routing
        ↓
Structured Guidance Response
```

---

# 4. Matter Behaviour

Leo operates inside individual HR matters.

Each matter should allow Leo to:

Understand the situation
Identify the HR category
Assess potential risk
Guide the employer through the process
Recommend next actions
Ask for missing information

Leo should always consider:

"What does the employer need to clarify or do next?"

---

# 5. Knowledge Hierarchy

Leo's future advice engine should consider information in this order:

1.Company policies and procedures
2.Employment legislation
3.ACAS Codes of Practice
4.General HR best practice

Company policy is important, but policy does not override legislation.

Where policy conflicts with legislation or ACAS guidance, Leo should:

Highlight the conflict
Explain the potential risk
Recommend the safer compliant approach

---

# 6. Company Policy Integration

Employers will upload company policies during onboarding.

Leo should eventually use these policies to provide company-specific guidance.

Policy awareness should allow Leo to answer:

*"What does our policy say?"
*"Are we following our own process?"
*"Does our policy create any risk?"
*"Does our policy align with employment obligations?"

---

# 7. Risk Philosophy

Leo assesses risk without making decisions.

Risk should consider:

*Legal risk
*Employee impact
*Business impact
*Relationship impact

Risk levels:

*Low
 Medium
 High
 Critical

High-risk areas require additional caution and appropriate escalation.

---

# 8. Development Rules

Before adding new functionality:

1.Check whether the feature fits the Leo architecture.
2.void adding HR logic directly into UI components.
3.Reuse existing Leo core systems where possible.
4.Avoid duplicate logic.
5.Preserve existing matter workflows.
6.Build incrementally and test each stage.

---

# 9. Source of Truth

The following documents define Leo's direction:

```
docs/LEO_BUILD_PLAN.md
docs/LEO_SYSTEM_ARCHITECTURE.md
docs/LEO_DEVELOPMENT_RULES.md
```

When developing Leo, these documents take priority over temporary ideas or shortcuts.

---

# 10. Current Development Priority

Current focus:

1.Connect Matter pages to Leo Core.
2.Replace temporary responses with Leo Core outputs.
3.Build structured employer guidance responses.
4.Add policy knowledge layer.
5.Add legislation and ACAS comparison.
6.Develop full AI reasoning layer.

Leo should evolve from a working prototype into a reliable HR decision-support system.

---

# 11. Reporting and Isolation Guardrails

These rules are mandatory for all reporting and insight work.

1. Do not create a duplicate reporting workspace when the capability belongs in an existing workspace.
2. Keep reporting ownership boundaries explicit:
Dashboard for command-centre aggregation,
Compliance for compliance reporting,
Insights for narrative interpretation and Executive Insight Brief,
Audit Logs for evidence.
3. Keep domain metric logic in domain modules; shared reporting plumbing can be reused, but domain definitions must not be duplicated.
4. Resolve active organisation and permissions on the server for every reporting endpoint.
5. Apply explicit tenant scoping to every query where organisation_id exists.
6. For tables without organisation_id, constrain access through already organisation-scoped linked IDs.
7. Never trust organisation IDs from the browser for reporting reads or audit writes.
8. Record audit events for sensitive report lifecycle actions such as generate and download.

Any implementation that breaks these guardrails must be revised before merge.

---

# 12. Reminder and Expiry Intelligence Guardrails

These rules are mandatory for all reminder and expiry work.

1. Implement reminders as stateless-first calculations from existing source data wherever possible.
2. Do not create duplicate reminders for the same recipient, source item, and milestone.
3. Do not send daily repeated reminders.
4. Send each configured milestone once only.
5. Keep unresolved items visible in operational workspaces after milestone delivery.
6. Recalculate and clear reminder state automatically when source records are renewed, completed, or changed.
7. Resolve organisation, employee, and manager scope server-side only.
8. Never trust organisation, employee, or manager scope supplied by the browser.
9. Apply existing permission and role boundaries for Owner, Senior, Manager, and Employee reminder visibility.
10. Do not expose restricted medical, Occupational Health, or sensitive document content in reminder payloads.
11. Persist only the minimum reminder state required for deduplication, dismiss, snooze, natural read/ack, and audit evidence.
12. Do not introduce a universal reminder ledger unless explicitly approved by architecture decision.

## Implemented in Phase 1

- Compliance reminders
- SAR deadline reminders
- Leo Learn due and expiry reminders
- In-app delivery only
- Milestones:
        - Standard: T-30, T-7, T0
        - SAR: T-14, T-7, T-1, T0

## Deferred to later phases

- Email and non in-app delivery channels
- Advanced escalation chains
- Universal reminder ledger
- Cross-channel orchestration and adaptive reminder intelligence
