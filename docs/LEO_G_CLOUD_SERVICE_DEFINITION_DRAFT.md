# Leo HR — G-Cloud Service Definition (Draft)

**Service:** Leo HR  
**Supplier:** LEO HR LTD  
**Proposed lot:** Lot 2 — Cloud Software  
**Last reviewed:** 12 September 2026

## Service overview

Leo HR is a cloud-based HR management platform for UK employers. It combines employee records, compliance tracking, employee relations case management, HR resources, recruitment and onboarding, learning records, audit logs, reporting, employee self-service and AI-assisted HR guidance in one browser-accessed service.

Leo is designed for organisations that need practical HR infrastructure without operating a large in-house HR function. The service supports employer decision-making and record keeping; the employer remains responsible for its decisions and legal obligations.

## Core capabilities

- employee records and permission-controlled document storage;
- right-to-work, DBS, driving, training and expiry tracking;
- leave, absence and probation records;
- employee relations Matters, actions, evidence and chronology;
- Ask Leo AI-assisted HR guidance informed by organisation context and controlled knowledge;
- policies, letters, factsheets, checklists and practical HR resources;
- recruitment, due diligence, offers and onboarding workflows;
- learning, qualifications and certificates;
- dashboards, reminders, reports and audit logs;
- employee self-service;
- optional integrations where enabled by the customer.

## Access

The service is accessed through a supported modern web browser. No customer-managed server installation is required. Current application roles are Owner, Senior, Manager and Employee, with additional permission checks around sensitive functions.

## Security and data separation

Leo is a multi-tenant service. Organisation context is resolved on protected server routes, and application permissions, database Row Level Security and private storage controls are used to protect customer records and sensitive HR documents. Significant application activity is recorded through Leo's audit architecture.

Detailed, evidence-qualified information is provided in `LEO_PROCUREMENT_SECURITY_EVIDENCE_PACK.md`. Certifications or service-level guarantees are not implied where they have not been obtained or tested.

## Hosting and suppliers

The application layer is hosted on Vercel. Supabase provides PostgreSQL, authentication and object storage. OpenAI provides language-model capability for AI-assisted features under Leo's application controls. Stripe supports subscription billing. Other providers may support email, customer help and customer-enabled integrations.

A verified customer-facing subprocessor register will be supplied before contracting.

## AI use

Ask Leo provides HR guidance, drafting and contextual decision support. Leo's application and database controls—not the language model—determine user access, organisation scope and permitted workflow actions. Employers remain responsible for reviewing advice and making employment decisions. Significant actions remain subject to application permissions and explicit employer workflows.

## Onboarding

Standard onboarding is intended to include:

1. account and organisation creation;
2. completion of the organisation's employment framework and company profile;
3. user and role setup;
4. employee import or manual record creation;
5. policy/resource upload where required;
6. administrator orientation and initial checks.

Exact onboarding times, included migration assistance and any chargeable support must be confirmed in the order documentation.

## Support

Support is provided through Leo's customer-support channels and help centre. Final G-Cloud wording must state the agreed service hours, severity definitions, response targets, escalation route and any premium support charges. No response or resolution target should be inserted until operationally approved.

## Service management and change

Application changes use GitHub source control, isolated development branches, automated tests, preview deployments and controlled Vercel promotion. Managed infrastructure providers supply platform-level hosting services. Material service changes will be managed through the applicable customer and framework terms.

## Backup, continuity and recovery

Leo maintains an application rollback and disaster-recovery runbook. Application rollback capability has been rehearsed non-destructively. A full isolated database restore exercise remains pending, so no contractual RTO or RPO is stated in this draft.

## Data export and exit

Leo will provide a proportionate exit process covering customer-data export, account closure and deletion/retention obligations. The supported export formats, request method, completion target, post-termination access period and deletion timetable must be confirmed before submission and reflected consistently in the DPA and call-off documentation.

## Ordering and invoicing

The public service price will be set out in the G-Cloud pricing document and call-off order. Public-sector customers will be invoiced separately against purchase orders and will pay by bank transfer rather than through Stripe. LEO HR LTD is not currently VAT-registered, so VAT is not currently charged; VAT will be applied if and when legally required. The recommended commercial basis is a 12-month subscription invoiced annually in advance, with quarterly invoicing available where agreed.

## Technical requirements and constraints

- internet access and a supported modern browser are required;
- service availability depends in part on managed infrastructure providers;
- optional integrations may require the customer's own third-party account and authorisation;
- functionality and capacity depend on the purchased subscription tier;
- the service does not replace professional legal advice where specialist advice is required.

## Trial and demonstration

Leo currently supports a seven-day free trial for standard commercial access. The availability and conditions of any public-sector trial, sandbox or demonstration must be confirmed in the G-Cloud listing.
