# Agentic Leo architecture

## Purpose

Agentic Leo is the coordination layer for Leo's specialist AI workforce. It does not replace Ask Leo, HR Resources, Foundations, audit logs or organisation knowledge. It coordinates specialist agents around those existing systems.

## Core flow

User or event -> Agent Orchestrator -> specialist agent -> skill -> approved tool -> result -> audit log and scoped memory.

## Initial specialist agents

- Business Administrator
- Procurement Manager
- Content Manager
- HR Resource Writer
- Ask Leo for HR reasoning only

Ask Leo remains the HR reasoning authority and must not be called internally by ChatGPT through a hidden loop. Where a dismissal or similarly high-risk employment decision is involved, Agentic Leo stops autonomous execution and routes the reasoning requirement to the authorised human/Ask Leo workflow.

## Safety and authority

- Owner and Senior are the intended authorising roles for significant actions.
- Manager access must remain narrower.
- Employee accounts do not operate the agent workforce.
- External sends, external submissions, financial actions and sensitive employee actions require explicit approval.
- Dismissal execution is blocked.
- Agent delegation is allowed only when the policy engine says the task may be delegated.
- Agent tables are service-only and have RLS enabled with no client policies.

## Shared memory

Agent memory is structured and scoped. It is not an unrestricted transcript store.

Scopes:
- organisation
- client
- project
- agent
- run

Sensitivity:
- internal
- confidential
- restricted

The existing organisation-memory and Foundations knowledge remain authoritative for approved organisational context. Agent memory stores operational working context, decisions, handoffs and useful reusable facts. Sensitive HR matter content should not be copied into general agent memory.

## Cost controls

Model choice is deterministic by action type.

- Deterministic: reads, calculations, writes that do not need generative reasoning.
- Economy: classification and routine drafting.
- Reasoning: genuine HR/legal reasoning.

Each run stores the selected model tier plus token and cost telemetry fields. This is intended to make cost per agent run measurable before autonomous execution is expanded.

## Approval lifecycle

A task that needs approval is stored as awaiting approval and gets an agent_approvals record. Execution must not continue until an authorised human explicitly approves the specific action.

The approval record records:
- run/task
- requested agent
- approval type
- summary
- approver
- decision note
- timestamps

## Auditability

Every created agent run is written to the existing Leo audit log with:
- agent
- goal
- risk
- model tier
- task count
- number of required approvals

Later execution stages should add completion, failure, approval and external-action audit events.

## Delivery phases

Phase 1: coordination tables, policy engine, orchestration primitives, cost telemetry.
Phase 2: owner/senior approval API and internal agent console.
Phase 3: tool adapters and specialist skill execution.
Phase 4: event/scheduled triggers and safe agent-to-agent handoffs.
Phase 5: measured autonomy expansion only where audit evidence supports it.
