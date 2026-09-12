# Leo HR — Security & Procurement Evidence Pack

**Document status:** Working procurement evidence pack  
**Product:** Leo HR  
**Supplier:** LEO HR LTD  
**Jurisdiction:** England & Wales  
**Last reviewed:** 12 September 2026

## Purpose

This pack gives procurement teams, customers and assessors a concise, evidence-led description of Leo HR's technical and security controls. It is intended to support supplier due diligence, security questionnaires, public-sector procurement and future G-Cloud submissions.

This document does **not** claim ISO 27001, Cyber Essentials, SOC 2 or other certification unless separately evidenced.

## Service overview

Leo HR is a multi-tenant HR software platform for employers. Core areas include employee records, compliance, employee relations Matters, HR resources, learning, talent/recruitment, audit logging, employee self-service and AI-assisted HR workflows.

Primary application stack:

- Next.js / React application.
- Vercel application hosting and deployment.
- Supabase for PostgreSQL, authentication and object storage.
- OpenAI for language-model functionality controlled by Leo application logic.
- Stripe for subscription billing.
- Optional customer-authorised integrations include DocuSign, Microsoft/Google services and Zoom where configured.
- Help Scout is used for support/help-centre functionality.

## Identity and authentication

Leo uses Supabase authentication and organisation membership controls.

Controls evidenced in the application include:

- authenticated user resolution on protected server routes;
- active organisation membership checks;
- access start/end-date checks where applicable;
- organisation-scoped server queries;
- role and permission evaluation;
- protected password recovery with a genuine recovery session requirement;
- password-reset completion signs the user out before re-authentication.

Current platform roles are Owner, Senior, Manager and Employee.

## Authorisation and tenant isolation

Leo applies organisation-level access controls in application routes and database policies.

Current safeguards include:

- organisation identifiers resolved server-side rather than trusted from browser input;
- permission checks on sensitive routes;
- Row Level Security on protected Supabase data;
- private storage for sensitive HR-document buckets;
- signed or checked server-side document access rather than unrestricted public URLs;
- role/permission checks for sensitive areas including Matters, Talent, HR resources and Ask Leo.

The September 2026 security-hardening review removed broad anonymous/authenticated storage access from sensitive employee, candidate, matter, company and policy document storage.

## Sensitive document storage

The following HR-document storage areas are private:

- employee documents;
- candidate documents;
- Matter documents;
- company documents;
- policy documents.

Direct anonymous access and generic authenticated access to those sensitive stores have been removed. Access is mediated through authorised application workflows.

## Auditability

Leo records audit information for significant application activity. Relevant controls include:

- organisation and user context;
- action/category/entity references;
- timestamps;
- previous/new values where appropriate;
- source module/page metadata.

Employee leave writes also have database-triggered audit protection so the database does not silently accept a leave write while omitting its trigger-based audit event.

## Secure development and change control

Current software change controls include:

- GitHub source control;
- isolated branches for changes;
- pull-request review workflow;
- Vercel preview deployments;
- automated regression tests;
- automated production-build check before merge;
- controlled promotion of successful master deployments.

The repository contains a standard `npm test` command and a GitHub Actions quality gate.

## AI controls

OpenAI provides language-model capability, while Leo retains application-side control over:

- organisation context;
- permissions;
- workflow routing;
- HR knowledge/context selection;
- persistence;
- audit and action boundaries.

AI capability does not replace Leo's access-control model.

The ChatGPT connection is designed around explicit organisation authorisation and restricted tool/data scopes. Significant employer actions are intended to remain permission-controlled.

## Integration security

External integrations are optional and organisation-scoped.

Examples include:

- DocuSign OAuth/token workflow, with encrypted token handling in application code and webhook HMAC verification;
- Zoom OAuth;
- Microsoft/Google connection workflows;
- Stripe signed webhook processing for billing.

Customers are not required to connect optional integrations to use the core HR platform.

## Data protection approach

Leo is designed for UK employment-data processing and uses:

- organisation-scoped records;
- least-privilege role/permission controls;
- private sensitive-document storage;
- auditable actions;
- controlled deletion/retention workflows where implemented;
- restricted handling of sensitive HR material.

A customer-specific controller/processor position, retention schedule and Data Processing Agreement should be confirmed contractually for procurement.

## Availability, continuity and recovery

Leo is deployed using managed cloud infrastructure (Vercel and Supabase). A detailed operational disaster-recovery/backup/rollback runbook is maintained separately. The application rollback path has been rehearsed non-destructively; a full isolated database restore test remains pending.

Until that test is completed, Leo should not state a contractual RTO/RPO that has not been verified.

## Vulnerability and security review

A bounded independent AI-assisted source/database review was performed in September 2026. Critical/high storage-policy findings were remediated, followed by post-change checks.

This was not a penetration test or formal security certification.

## Procurement evidence available

Evidence that can be supplied during due diligence includes:

- architecture documentation;
- role/permission model;
- automated test/build workflow;
- storage/privacy configuration evidence;
- audit-log design;
- integration architecture;
- AI architecture;
- security remediation history;
- business continuity/DR runbook and current rehearsal status;
- draft G-Cloud service definition and pricing documents;
- G-Cloud readiness tracker and evidence gaps;
- draft subprocessor register pending provider verification.

## Claims that require separate evidence before use

Do not claim the following unless separately obtained and current:

- ISO 27001 certification;
- Cyber Essentials or Cyber Essentials Plus;
- SOC 2;
- NHS DSPT status;
- penetration-test certification;
- guaranteed uptime percentage;
- guaranteed RTO/RPO;
- UK-only data residency for every subprocessor;
- formal G-Cloud listing.

## Procurement response principle

Where a buyer asks a yes/no security question, answer from deployed evidence rather than aspiration. If a control is planned but not yet tested, state **planned / in progress**, not **implemented**.
