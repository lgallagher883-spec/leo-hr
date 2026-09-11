# Leo HR — Disaster Recovery, Backup & Rollback Runbook

**Status:** Operational runbook with non-destructive rehearsal evidence  
**Last reviewed:** 11 September 2026  
**Owner:** LEO HR LTD

## 1. Objective

Provide a repeatable response for:

- faulty application deployment;
- database/schema migration issue;
- accidental configuration change;
- provider outage;
- suspected data-loss event;
- security incident requiring containment.

This runbook deliberately distinguishes **application rollback** from **database recovery**. They are not interchangeable.

## 2. Recovery priorities

1. Protect customer data and prevent further damage.
2. Contain the affected component.
3. Preserve logs/evidence.
4. Restore a known-good application version where appropriate.
5. Assess database integrity before any database restore.
6. Validate authentication, organisation isolation, documents and critical HR workflows.
7. Communicate material incidents appropriately.
8. Record the incident and follow-up actions.

## 3. Application rollback — Vercel

### Trigger examples

- new deployment returns widespread 5xx errors;
- login or organisation access is broken;
- core employee/Matters workflows fail after release;
- a severe UI/API regression is clearly tied to the latest deployment.

### Procedure

1. Stop promoting further builds.
2. Identify the current production deployment and the most recent known-good READY deployment.
3. Review runtime errors/logs to confirm the issue is application-level rather than database/provider-level.
4. Promote the known-good deployment through Vercel.
5. Verify:
   - login;
   - dashboard;
   - employee list/profile;
   - Matters;
   - document open/upload where safe;
   - Ask Leo basic request;
   - billing guard;
   - employee portal.
6. Check production errors again.
7. Open a corrective branch from master rather than patching production manually.

### Rehearsal evidence — 11 September 2026

A non-destructive rollback-readiness check confirmed:

- current production deployment was READY;
- prior READY deployments remained available;
- Vercel identified the current promoted deployment as a rollback candidate;
- deployment metadata retained Git commit SHA and deployment lineage;
- promotion workflow has already been exercised repeatedly during controlled Leo releases.

**Result:** application rollback path is operationally available.

No deliberate production rollback was performed solely for testing because that would create unnecessary customer risk.

## 4. Database/schema recovery — Supabase

### Principles

- Never use application rollback as a substitute for reversing an incompatible database migration.
- Never delete or overwrite production data during diagnosis.
- Preserve migration history.
- Prefer forward corrective migrations where data integrity is intact.
- A point-in-time or backup restore should only be used after confirming provider capability, restore point and business impact.

### Current evidence — 11 September 2026

- Supabase migration history is present and queryable.
- Production migrations are recorded with ordered versions/names.
- No development database branch currently exists.
- Critical schema/security changes are represented through migrations.

### Database recovery decision tree

**Schema defect but data intact:**  
Create and test a corrective migration, then apply forward.

**Bad data write affecting a bounded set of records:**  
Preserve evidence, identify exact affected rows, prepare a reviewed corrective script and validate on non-production data before production use.

**Widespread corruption/data loss:**  
Stop affected writes, open provider recovery process, determine latest safe restore point, document expected data-loss window, obtain business approval, restore to isolated/non-production environment first where possible, validate, then decide production recovery.

## 5. Full restore test status

A destructive production database restore has **not** been performed.

A realistic full database restore test should be carried out using a Supabase development branch or separate non-production project. Creating a Supabase branch may incur provider cost and therefore requires explicit approval before creation.

Until that test is completed:

- do not publish a contractual RTO/RPO;
- do not state that full database restoration has been proven;
- describe the restore control as **planned/test pending** in procurement answers.

## 6. Minimum validation after recovery

### Authentication
- employer login;
- employee login;
- password recovery;
- invite flow.

### Tenant isolation
- active organisation resolves correctly;
- role/permission checks work;
- no cross-organisation data appears.

### Employee data
- employee list/profile;
- employment details;
- RTW/emergency contact;
- leave.

### Sensitive documents
- employee documents;
- candidate documents;
- Matter documents;
- company/policy documents.

### HR workflows
- Matters;
- Talent;
- HR Resources/Knowledge;
- reminders;
- audit logs.

### Integrations
Test only integrations relevant to the incident.

## 7. Incident classification

**P1 — Critical:** confirmed data exposure/loss, widespread inability to access Leo, broken tenant isolation.  
**P2 — High:** major feature unavailable to many customers with no reasonable workaround.  
**P3 — Medium:** bounded workflow fault with workaround.  
**P4 — Low:** cosmetic/minor issue.

## 8. Evidence to retain

- incident start/end time;
- affected deployment SHA;
- relevant Vercel logs/request IDs;
- Supabase error details;
- migration versions;
- affected organisations/workflows;
- containment action;
- recovery action;
- validation results;
- customer/regulatory communications where applicable;
- root cause and preventive action.

## 9. Review cadence

Review this runbook after:

- every P1/P2 incident;
- a material infrastructure change;
- a database restore rehearsal;
- a hosting/database provider change;
- at least annually.

## 10. Next controlled recovery exercise

Create an isolated Supabase development branch (subject to explicit cost approval), seed only synthetic data, and perform:

1. migration application;
2. intentional test-only schema/data change;
3. reset/recovery on the branch;
4. validation of critical tables and RLS;
5. measured elapsed time.

The result can then support an evidence-based internal RTO/RPO target.
