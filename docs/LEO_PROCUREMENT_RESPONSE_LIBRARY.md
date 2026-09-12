# Leo HR — Procurement Response Library

**Last reviewed:** 12 September 2026

Use these answers as reusable starting points for supplier questionnaires. Adapt the wording to the buyer's exact question and do not upgrade a qualified answer into an absolute claim.

## Hosting and architecture

**Where is the service hosted?**  
Leo HR is a cloud-hosted SaaS application using Vercel for the application layer and Supabase for database, authentication and object storage.

**Is Leo multi-tenant?**  
Yes. Customer data is separated by organisation context. Protected application routes resolve the active organisation server-side and enforce membership/permission checks. Database Row Level Security and private storage controls provide additional isolation.

## Access control

**Do you support role-based access?**  
Yes. Leo uses Owner, Senior, Manager and Employee roles alongside permission checks.

**Can ordinary authenticated users access another customer's HR files?**  
The intended and tested design prevents generic authenticated access to sensitive employee, candidate, Matter, company and policy document buckets. Sensitive document access is mediated by authorised workflows.

**Are privileged actions audited?**  
Significant HR and administrative actions are recorded in Leo's audit architecture. Coverage is being continually expanded and verified through regression testing.

## Passwords and account recovery

**Is password recovery protected?**  
Yes. Password reset requires a valid recovery flow/session. A normal logged-in session alone cannot use the reset page to arbitrarily change a password through that recovery path.

## Secure development

**Do you test changes before production?**  
Yes. Changes use isolated Git branches and preview deployments. The repository has automated regression tests and a CI quality gate that executes critical tests and a production application build.

**Do you use production secrets in CI?**  
The CI build uses non-production placeholder values where build-time configuration is required.

## Encryption and secrets

**How are secrets handled?**  
Application secrets are supplied through managed environment configuration rather than committed source code. Integration credentials/tokens are handled server-side; individual integrations may apply additional encryption controls.

**Is all customer data encrypted?**  
Managed cloud providers supply encryption controls for hosted infrastructure. Precise at-rest/in-transit contractual wording should be verified against the current Vercel, Supabase and relevant subprocessor terms before answering a tender that requires named algorithms or residency guarantees.

## AI

**Does Leo use AI?**  
Yes. Leo uses OpenAI language-model services for AI-assisted functions.

**Does the AI decide who can see HR data?**  
No. Access control, organisation context and workflow permissions are enforced by Leo application/database logic.

**Can AI perform significant HR actions without permission?**  
Leo is designed so significant actions remain governed by application permissions and explicit workflows. Dismissal and similarly sensitive employment decisions should remain employer-controlled.

## Documents

**Are HR documents public?**  
Sensitive HR document buckets are private. Broad anonymous and generic authenticated access to the relevant employee, candidate, Matter, company and policy stores was removed during the September 2026 hardening review.

## Billing

**How are payments handled?**  
Subscription billing uses Stripe. Leo does not need to store raw card details in its own application database to operate the Stripe checkout flow.

## Integrations

**What third parties can a customer connect?**  
Optional integrations implemented or under active product support include services such as DocuSign, Microsoft/Google services and Zoom. Integration availability should be confirmed against the current Connections screen at the time of procurement.

## Security incidents

**Do you have an incident response process?**  
Yes. Leo maintains an operational disaster-recovery, backup and rollback runbook with incident priorities, severity classification, evidence requirements and recovery validation steps. The application rollback path has been rehearsed non-destructively; a full isolated database restore test remains pending.

## Backups and disaster recovery

**What are your RTO and RPO?**  
Do not provide unverified figures. The correct current answer is: Leo uses managed cloud infrastructure and is formalising and testing its recovery/rollback procedure. Contractual RTO/RPO values will only be published once recovery tests support them.

## Certifications

**Are you ISO 27001 / Cyber Essentials / SOC 2 certified?**  
Do not answer yes unless certification has actually been obtained. Current technical controls and evidence can support buyer due diligence independently of certification.

## Penetration testing

**Have you had a penetration test?**  
Do not describe the September 2026 source/database security review as a penetration test. It was a bounded security review that identified and led to remediation of storage/access-control weaknesses.

## Data processing

**Are you a processor or controller?**  
This depends on the processing activity. For customer workforce data handled on the customer's instructions, Leo would ordinarily be expected to act as a processor, while Leo may be an independent controller for limited supplier/account administration purposes. Final wording should match the executed DPA/privacy documentation.

## Subprocessors

Maintain a current customer-facing subprocessor register before formal procurement submission. At minimum, review the roles of:

- Vercel;
- Supabase;
- OpenAI;
- Stripe;
- Help Scout;
- email delivery provider;
- optional integration providers where customer data is transmitted.

Do not list an optional connector as a mandatory subprocessor if data is only transmitted when that customer enables it.
