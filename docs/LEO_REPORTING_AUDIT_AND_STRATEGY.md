# LEO Reporting Audit and Strategy

Last updated: 5 August 2026

## Related Architecture Documents

- [LEO System Architecture](LEO_SYSTEM_ARCHITECTURE.md)
- [LEO Architecture Map](LEO_ARCHITECTURE_MAP.md)
- [LEO Development Rules](LEO_DEVELOPMENT_RULES.md)
- [LEO Reporting Audit and Strategy](LEO_REPORTING_AUDIT_AND_STRATEGY.md)
- [LEO Architecture Decisions](DECISIONS.md)

## Purpose

This document audits the reporting capability currently present across the LEO HR platform and sets out a reporting strategy for the next stage of platform development.

This is an evidence-based audit. Findings are based on inspected module pages, API routes, intelligence engines, export handlers, and platform data access patterns already present in the codebase.

## Audit Method

The audit reviewed reporting-related behavior in:

- `app/dashboard/*`
- `app/api/*`
- `leo/insight/*`
- `lib/supabase/database.types.ts`
- platform documentation where it clarified table intent or architecture

The most important inspected surfaces included:

- Compliance registers and export handlers
- Employees registers, import/export handlers, and workforce summaries
- Talent registers, pipeline workspaces, and CSV exports
- Matters bundle generation for DOCX/PDF
- Audit log APIs and organisation audit exports
- Insights and Leo Learn intelligence endpoints
- HR resources, company documents, and knowledge preparation status
- Foundations connections jobs, permissions, and background activity records
- Billing, organisation, and self-service employment workspaces

## Executive Findings

### Overall position

LEO already has meaningful reporting capability. Reporting is not absent. It exists today in several forms:

- operational registers with filters and summary cards
- CSV and XLSX exports
- DOCX and PDF bundle generation
- AI-generated summaries and recommendations
- audit and activity histories
- module-specific management views

### Current maturity

The current platform is strongest in:

- Compliance reporting
- Talent operational reporting
- Employees workforce reporting
- Audit and administration evidence reporting
- AI narrative insight generation

The current platform is less mature in:

- cross-module executive reporting
- scheduled report delivery
- board-ready reporting packs
- historical trend analysis
- shared charting and visual analytics
- shared report orchestration and background generation

### Key architectural conclusion

Reporting should become a shared platform service.

However, that service should not own business logic for every metric. Domain modules should continue to own their source data, filters, and metric definitions. The shared service should provide common reporting infrastructure:

- report definitions and metadata
- output rendering to PDF, Excel, CSV, and executive summary formats
- scheduling and background execution
- delivery and download handling
- permission enforcement and audit logging
- AI narrative assembly using LEO INSIGHT™

## Implementation Update - 5 August 2026

Phase 1 reporting enhancement has been implemented with ownership and isolation boundaries aligned to platform architecture.

### Implemented now

- Period-aware Insights API consumption for reporting context windows.
- Executive Insight Brief in Insights workspace as the management narrative output.
- Executive Insight Brief lifecycle events (create/download) recorded in audit logs.
- Audit Logs workspace recognition of Executive Insight Brief actions.
- Explicit organisation scoping in reporting queries for organisation-owned tables.
- Server-mediated audit event writing for Executive Insight Brief with authoritative organisation resolution and permission checks.

### Ownership reaffirmed

- Dashboard remains the command-centre reporting surface.
- Insights remains the interpretation and executive narrative workspace.
- Audit Logs remains the mandatory evidence plane.
- Domain modules remain owners of source metric definitions.

No separate reporting workspace should be introduced while these ownership boundaries remain valid.

### Isolation implementation notes

- Use direct organisation_id scoping where available.
- For tables without organisation_id (for example policy_register in current schema), scope through organisation-scoped linking records.
- Never rely on browser-provided organisation identifiers for reporting reads or audit writes.

### Forward rule for all future reporting work

Every reporting feature must include:

- explicit owner workspace/module assignment,
- server-side organisation resolution,
- permission verification for the resolved organisation,
- explicit tenant scoping for each query path,
- audit evidence for sensitive report lifecycle actions.

## Status Labels

- `Already implemented`: clearly present in current code and usable now
- `Can be extended`: enough data or UI already exists that reporting can be added without new core entities
- `Requires new development`: the report would need new pipelines, tables, transformations, scheduling, or presentation layers

## Platform-Wide Reporting Patterns Found

### Already implemented

- XLSX exports in Employees and Compliance
- CSV exports across multiple Talent workspaces and Organisation Audit
- DOCX and PDF generation for Matter bundles
- AI summary and recommendation generation in Insights, Compliance Intelligence, and Leo Learn
- report-adjacent audit events for export actions in some modules
- permission checks using organisation membership and permission RPCs
- job-oriented processing patterns in Connections, plus generic job tables in Supabase types

### Can be extended

- current summary cards into trend reporting
- current register filters into reusable report parameter sets
- intelligence payloads into executive narrative summaries
- connection jobs and generic job queue tables into background report generation

### Requires new development

- a shared report catalogue
- scheduled report subscriptions
- central report execution and storage
- chart rendering service
- board packs combining data from multiple modules
- standardised report APIs and report metadata

## Module Audit

## 1. Dashboard

### Data already captured

- employee count
- live, urgent, and stale matter counts
- insight recommendations from `/api/insights`
- compliance readiness and risk metadata from compliance intelligence

### What can already be reported

- daily operational priority summary
- top recommended action
- live matter pressure
- compliance action count and readiness band

### Immediate management reports

- daily HR operational priority brief
- active matter and compliance risk snapshot
- first-line management action list

### Requires further development

- historical dashboard trend reporting
- dashboard export
- role-specific scheduled dashboard digests

### Reuse opportunities

- reuse Insights and Compliance Intelligence rather than create separate dashboard reporting logic

### Classification

- `Already implemented`: operational summary and prioritisation
- `Can be extended`: exportable dashboard summaries and trend views
- `Requires new development`: scheduled dashboard reports

## 2. Employees

### Data already captured

- employee master records: name, role, email, start date, status
- employment details: manager, probation end, employment end, leaving reason, annual leave allowance
- import history and row-level import results
- employee-specific supporting areas elsewhere in the platform: leave, training, compliance, documents, emergency contacts, medical, notes

### What can already be reported

- filtered employee register
- summary cards for workforce states
- XLSX export of the current employee view
- XLSX template and sample exports for data onboarding
- import result reporting and import history tracking

### Immediate management reports

- headcount by status
- starters and leavers by period
- probation end report
- employees by manager
- annual leave allowance report
- workforce directory by role

### Requires further development

- historical headcount movement over time
- absence and leave trend reporting rolled up at module level
- scheduled people reports
- executive people pack across employees, compliance, learning, and talent

### Reuse opportunities

- employees should remain the master reporting dimension for compliance, matters, SAR, learning, onboarding, and billing capacity reporting
- do not duplicate employee identity or organisation attribution into reporting-specific tables

### Classification

- `Already implemented`: workforce register export and import reporting
- `Can be extended`: management workforce analytics from existing employee and employment tables
- `Requires new development`: board-level workforce trends and scheduled reporting

## 3. Compliance

### Data already captured

- right to work records and review dates
- visa and permit metadata
- DBS checks, update service status, safeguarding training dates
- driving checks, DVLA check dates, insurance, MOT, licence expiry
- training logs and refresh dates
- probation end dates
- employee/site/department/manager dimensions

### What can already be reported

- compliance register
- training register
- summary counts for employees, expired items, due within 30 days, awaiting evidence, learning due
- XLSX export of current register view
- XLSX export of selected employee records
- compliance intelligence summary with readiness, risk, recommendations, and next step
- audit logging of exports

### Immediate management reports

- compliance exceptions report
- upcoming renewals report
- training due report
- site or department compliance heat map data
- manager action lists for expiring checks

### Requires further development

- historical compliance trend analysis
- month-on-month improvement reporting
- scheduled compliance packs
- board-level compliance posture pack
- visual charts rather than summary cards only

### Reuse opportunities

- use employee master data and sites data as shared dimensions
- reuse compliance intelligence for executive narrative rather than creating separate narrative logic
- reuse audit events for evidence of report generation and access

### Classification

- `Already implemented`: operational registers, XLSX exports, AI compliance intelligence
- `Can be extended`: management and executive compliance packs from current data model
- `Requires new development`: historical trending, scheduling, and board packs

## 4. Matters

### Data already captured

- matter records: title, status, description, employee link, matter type, subject, matter lead, created date
- matter messages and chronology
- matter documents
- linked SARs, employee documents, policy references, and audit records in bundle generation

### What can already be reported

- searchable matter register
- open and closed matter listing
- DOCX or PDF matter bundle generation including chronology and supporting records

### Immediate management reports

- open matters by type
- matters by employee
- matters by lead
- matters opened by period
- evidence bundle for a specific case

### Requires further development

- matter ageing and SLA reporting
- resolution outcomes and closure reporting
- trend analysis by matter type
- executive employee-relations pack

### Reuse opportunities

- reuse matters as the core employee-relations case dimension for Insights, SAR, and board risk reporting
- matter bundles should become one output type within a broader shared reporting service

### Classification

- `Already implemented`: matter register and DOCX/PDF bundle generation
- `Can be extended`: case volume and ageing reports
- `Requires new development`: executive and board employee-relations reporting

## 5. Leo Talent

### Data already captured

- vacancies, applications, candidates, interviews, offers, appointments, onboarding progress, and safer recruitment profiles
- stage, status, dates, candidate details, manager details, scores, recommendations, due diligence states
- analytics events in `talent_analytics_events`

### What can already be reported

- dashboard snapshot metrics
- application register export
- candidate register export
- interview register export
- offers export
- onboarding export
- vacancy export
- operational pipeline summaries and status counts

### Immediate management reports

- recruitment pipeline by stage
- active vacancies report
- candidate source and volume report
- offer acceptance and response report
- interview workload report
- onboarding readiness report
- safer recruitment exceptions report

### Requires further development

- time-to-hire and stage conversion trends
- source effectiveness analytics
- diversity reporting if required and permitted
- executive recruitment performance pack
- scheduled vacancy and hiring funnel reporting

### Reuse opportunities

- reuse talent records through to employees and onboarding rather than duplicate candidate-to-employee transition reporting
- reuse analytics event table for operational adoption reporting
- reuse safer recruitment and compliance structures for onboarding readiness reports

### Classification

- `Already implemented`: rich operational registers and CSV exports across the module
- `Can be extended`: management pipeline and hiring-performance reporting
- `Requires new development`: historical trend analytics and executive hiring packs

## 6. Leo Learn

### Data already captured

- learning modules, assignments, pathways, qualifications, certificates, AI projects, providers, categories, settings, permissions
- status, due dates, progress, verification, expiry, review rules, notification rules
- intelligence snapshots with counts for active learning, completion, overdue work, renewals, and reviews

### What can already be reported

- learning dashboard KPIs
- learning analytics intelligence narrative
- qualification and renewal counts
- draft learning plan outputs from intelligence
- permissions model includes `can_export_data`

### Immediate management reports

- assignments in progress
- overdue learning report
- qualifications due for renewal
- pathway review report
- module publication and review report
- team learning completion snapshot

### Requires further development

- actual export handlers for module-wide learning analytics
- time-series completion reporting
- manager/team scheduled learning packs
- executive capability and compliance learning report

### Reuse opportunities

- reuse employees, qualifications, and training/compliance records for mandatory learning and renewal reporting
- reuse AI-generated summaries already produced by the intelligence endpoint

### Classification

- `Already implemented`: intelligence-driven KPI and narrative reporting
- `Can be extended`: exports and management analytics from current data
- `Requires new development`: scheduled and board-level learning reporting

## 7. Insights

### Data already captured

- employees, matters, SARs, HR resources, knowledge section counts
- risk and recommendation synthesis via `buildLeoInsight`

### What can already be reported

- AI-generated summary narrative
- risks, trends, recommendations, early interventions
- period-based exploratory analysis in the UI

### Immediate management reports

- organisational risk snapshot
- proactive intervention report
- current matter and SAR pressure summary
- knowledge readiness summary

### Requires further development

- export of insight reports
- fixed report templates for executive and board use
- richer multi-period trend analysis
- charting and benchmarking views

### Reuse opportunities

- LEO INSIGHT™ should become the narrative layer for management, executive, and board reporting
- do not create separate AI summary engines per module

### Classification

- `Already implemented`: AI insight generation and narrative risk reporting
- `Can be extended`: reusable executive summary generation
- `Requires new development`: formal report outputs and scheduled insight packs

## 8. Audit Logs

### Data already captured

- user, action, category, entity, before/after values, metadata, source page, IP, user agent, created date
- category filtering and pagination
- organisation audit events in a second audit stream for organisation administration history

### What can already be reported

- searchable audit register
- date and category filtered audit history
- organisation audit CSV export
- evidence trail for exports and administrative actions

### Immediate management reports

- user activity report
- change history by entity
- security and access activity report
- export activity report
- audit exceptions and warnings report

### Requires further development

- formal audit packs by time period
- automated compliance audit schedules
- anomaly detection and alerting summaries

### Reuse opportunities

- use audit logs as the mandatory evidence plane for all future generated reports
- shared reporting service should automatically emit report-viewed, report-generated, and report-delivered events

### Classification

- `Already implemented`: audit registers and organisation audit CSV export
- `Can be extended`: compliance and security audit packs
- `Requires new development`: automated audit reporting and anomaly detection

## 9. Foundations

### Data already captured

- organisation foundation facts: section, key, value, source
- organisation memory and knowledge grounding in related services

### What can already be reported

- factual organisation context summaries
- grounding counts for intelligence outputs

### Immediate management reports

- foundation completeness report
- missing organisational context report
- policy and structure readiness report

### Requires further development

- a dedicated foundations reporting UI and exports
- completeness scoring over time

### Reuse opportunities

- foundations should supply common context to all AI narrative reporting
- do not duplicate organisation profile data inside each reporting module

### Classification

- `Already implemented`: shared factual context store
- `Can be extended`: readiness and completeness reports
- `Requires new development`: formal exports and governance reporting

## 10. HR Resources and Policies

### Data already captured

- policy register items and company documents
- register type, category, review date, responsible person, notes, file details, archived state, version numbers
- knowledge preparation status and section counts for resources

### What can already be reported

- resource library views
- review due listings
- archived and versioned resource status
- knowledge preparation coverage by resource

### Immediate management reports

- policies due for review
- documents by category
- responsible person review workload
- knowledge-prepared versus not-prepared resources
- archived resource report

### Requires further development

- export of resource review schedules
- policy review board pack
- legal update reporting and delta tracking

### Reuse opportunities

- reuse policy register and company documents as shared inputs for Knowledge and Insights
- report on resource readiness from existing knowledge section counts, not from duplicate reporting tables

### Classification

- `Already implemented`: resource registers and knowledge-preparation status views
- `Can be extended`: review and readiness reporting
- `Requires new development`: scheduled governance and legal review packs

## 11. Connections

### Data already captured

- providers, organisation connections, capabilities, module access, role permissions, health checks, jobs, external resources, activity history
- provider support flags for import, export, webhooks, background sync, disconnect, and approval requirements

### What can already be reported

- connection inventory
- capability and permission matrix
- connection health status
- synchronisation jobs and external resources history
- activity timeline and error history

### Immediate management reports

- integration health report
- failed sync and connection error report
- provider capability coverage report
- module-to-provider dependency map
- export-capable provider inventory

### Requires further development

- scheduled integration health packs
- cross-module data freshness reporting
- external export success and failure analytics

### Reuse opportunities

- `connection_jobs` and related activity history can be reused for background report execution patterns
- provider `supports_export` and `supports_background_sync` flags can inform future external report delivery

### Classification

- `Already implemented`: operational integration monitoring and job history
- `Can be extended`: data-freshness and export-delivery reporting
- `Requires new development`: unified external report distribution

## 12. Billing

### Data already captured

- subscriptions, trials, entitlements, invoices, billing metadata, employee capacity, active employee count

### What can already be reported

- current plan and status
- trial dates and conversion state
- invoice list and payment status
- entitlement capacity versus current employee count

### Immediate management reports

- subscription status report
- invoice ageing report
- capacity utilisation report
- trial conversion report

### Requires further development

- scheduled finance reporting
- revenue reporting and cohort analysis
- board commercial reporting pack

### Reuse opportunities

- use active employee counts from Employees rather than duplicating capacity calculations
- billing should consume shared organisation and employee dimensions

### Classification

- `Already implemented`: subscription, entitlement, and invoice visibility
- `Can be extended`: utilisation and invoice reporting
- `Requires new development`: executive commercial analytics and scheduled finance packs

## 13. Organisation Administration

### Data already captured

- organisation profile
- brand settings via organisation workspaces and matter bundle branding
- company documents, people and access, security, audit, and billing sub-workspaces

### What can already be reported

- organisation setup and administration state
- administration audit export
- document inventory and security activity surfaces

### Immediate management reports

- organisation readiness report
- people and access control review
- administration change history

### Requires further development

- consolidated governance reporting pack
- board governance summary

### Reuse opportunities

- organisation workspaces already aggregate cross-cutting reporting surfaces and should become one consumer of the shared reporting service

### Classification

- `Already implemented`: administrative reporting surfaces spread across organisation workspaces
- `Can be extended`: governance summaries
- `Requires new development`: formal governance packs

## 14. Ask Leo

### Data already captured

- conversation headers, message history, last activity timestamps, matter conversion link, optional SAR and resource context

### What can already be reported

- conversation history
- matter conversion visibility
- prompt-driven contextual reviews of resources and SARs

### Immediate management reports

- Ask Leo usage volume
- conversation-to-matter conversion report
- resource review request volume
- SAR advisory workload linked to Ask Leo prompts

### Requires further development

- conversation topic analytics
- usage trend reporting
- response quality or outcome scoring

### Reuse opportunities

- reuse Ask Leo conversation metadata for demand analysis and product adoption reporting
- narrative report generation can be exposed through Ask Leo as an interaction channel, but the report engine should remain shared

### Classification

- `Already implemented`: conversational history and contextual advisory traces
- `Can be extended`: operational usage reporting
- `Requires new development`: advanced analytics and trend reporting

## 15. SAR Requests

### Data already captured

- request title, dates, deadlines, assigned owner, status, lifecycle completion flags, linked employee and matter, timeline events

### What can already be reported

- SAR register
- open, due soon, overdue, and completed counts
- stage completion progress per request
- AI-supported SAR context for Ask Leo and intelligence use

### Immediate management reports

- overdue SAR report
- deadline compliance report
- stage bottleneck report
- SAR workload by owner

### Requires further development

- SLA trend reporting
- scheduled compliance reports
- board privacy and compliance summary

### Reuse opportunities

- reuse SAR deadlines and lifecycle flags in Insights and executive compliance summaries
- matter links should drive joined employee-relations and data-rights reporting where relevant

### Classification

- `Already implemented`: operational SAR registers and KPI counts
- `Can be extended`: compliance and owner workload reports
- `Requires new development`: executive privacy reporting and scheduling

## 16. My Employment and Employee Self-Service

### Data already captured

- employee-facing views of employment details, leave, learning, documents, reviews, emergency contacts, medical information, right to work, DBS, and other checks

### What can already be reported

- personal self-service summaries and downloadable/visible records in specific workspaces

### Immediate management reports

- limited direct management reporting from this workspace
- strongest value is as a consumer of centrally owned employee, learning, leave, and compliance data

### Requires further development

- employee self-service statement packs
- scheduled employee summaries

### Reuse opportunities

- no separate reporting data model should be built for self-service; reuse central employee, learning, and compliance sources

### Classification

- `Already implemented`: employee-facing record access
- `Can be extended`: generated employee statements and summaries
- `Requires new development`: scheduled self-service packs

## Reuse Model

The platform already has a strong base for reuse. Reporting should standardise around shared dimensions and shared context rather than copy data.

### Reuse these entities as platform reporting dimensions

- `organisations`
- `organisation_memberships`
- `employees`
- `employee_employment_details`
- `matters`
- `employee_sars`
- `policy_register`
- `company_documents`
- `organisation_foundations`
- `leo_organisation_memory_records`
- `knowledge_chunks`
- audit and job records

### Reuse these report-adjacent capabilities

- XLSX generation already used in Employees and Compliance
- CSV generation already used in Talent and Organisation Audit
- DOCX and PDF generation already used in Matters bundles
- LEO INSIGHT™ narrative synthesis
- permission RPCs and authoritative role resolution
- audit event writing for sensitive report generation
- connection jobs and generic job queue tables for asynchronous processing

## Shared Reporting Service Recommendation

## Decision

Reporting should become a shared platform service.

## Why

Current reporting concerns are repeated across modules:

- export file generation
- permission checks
- audit logging
- parameter handling and filters
- background execution
- delivery concerns
- AI narrative generation

Keeping these duplicated inside each module will slow down delivery and create inconsistent security, performance, and user experience.

## What remains domain-owned

Each module should continue to own:

- source tables
- business definitions for metrics
- report-specific joins unique to that domain
- UI filters specific to that workflow

## What becomes shared

The reporting platform service should own:

- report definition registry
- report request validation
- report execution orchestration
- reusable renderers for CSV, XLSX, PDF, and narrative summary
- chart image generation for report packs
- background jobs and status tracking
- delivery to browser download, email, and external destinations
- central audit trail for report access and generation

## Target Reporting Strategy

## 1. Operational reports

Purpose:

- support daily and weekly action-taking

Examples:

- compliance exceptions
- overdue SARs
- open matters by owner
- active recruitment pipeline
- overdue learning assignments
- integration failures

Preferred outputs:

- table-first UI views
- CSV and XLSX exports
- optional short AI action summary

Primary status:

- mostly `Already implemented` or `Can be extended`

## 2. Management reports

Purpose:

- support departmental oversight and manager accountability

Examples:

- monthly workforce report
- monthly compliance report by manager/site
- recruitment funnel and onboarding status
- learning completion and renewals
- policy review due schedule

Preferred outputs:

- XLSX
- PDF management pack
- charts with commentary
- scheduled email delivery

Primary status:

- mostly `Can be extended`

## 3. Executive reports

Purpose:

- summarise risk, readiness, trends, and decisions for senior leadership

Examples:

- organisational people and risk report
- executive compliance posture report
- talent acquisition performance report
- workforce capability and readiness report

Preferred outputs:

- concise PDF packs
- charts and heat maps
- AI executive summary using LEO INSIGHT™

Primary status:

- mostly `Can be extended`, with scheduling and cross-module rollups requiring additional development

## 4. Board reports

Purpose:

- provide a small set of high-signal trend and assurance measures

Examples:

- board people risk pack
- board compliance and governance pack
- board workforce growth and capability pack
- board privacy and data-rights pack

Preferred outputs:

- board-ready PDF
- fixed chart set
- one-page executive summary
- appendix tables where needed

Primary status:

- mostly `Requires new development`

## 5. Scheduled reports

Purpose:

- remove manual export effort and create reliable reporting cycles

Examples:

- weekly compliance actions
- monthly people report
- monthly recruitment pipeline report
- quarterly board packs

Preferred outputs:

- generated in background
- delivered by email or secure download center
- tracked with status, audit, and expiry

Primary status:

- `Requires new development`, but can build on existing job patterns

## 6. AI-generated reports using LEO INSIGHT™

Purpose:

- turn structured metrics into professional narrative reporting

Examples:

- operational commentary attached to a register export
- management summary for a monthly report
- executive narrative for leadership packs
- board narrative summarising movement, exceptions, and recommended attention points

Preferred outputs:

- narrative block embedded in PDF or HTML
- supporting evidence links or appendix references
- consistent prompt and grounding model using foundations, memory, and knowledge

Primary status:

- `Already implemented` in basic form for insights-style narrative
- `Can be extended` into formal reporting outputs

## Output Strategy

## PDF

Use for:

- executive reports
- board packs
- case bundles
- scheduled management packs

Current base:

- Matter bundles already generate PDF

Recommendation:

- central PDF renderer with shared branding, headers, confidentiality footers, and appendix support

## Excel and CSV

Use for:

- operational and management reporting
- detailed filters and data handoff
- further analysis by HR and operations teams

Current base:

- Employees and Compliance use XLSX
- Talent and Organisation Audit use CSV

Recommendation:

- standardise export metadata, column naming, sheet naming, filters, and audit events

## Charts

Use for:

- executive and board comprehension
- monthly trend reporting
- capacity and risk visuals

Current base:

- summary cards are common
- no shared charting library was found in the inspected application code or dependencies

Recommendation:

- add a shared chart rendering layer for line, bar, stacked bar, donut, and heat map outputs
- use the same chart spec for UI and PDF image generation

## Executive summaries and AI narrative

Use for:

- management, executive, and board readers who need signal over detail

Current base:

- Insights, Compliance Intelligence, and Leo Learn already generate summaries and recommendations

Recommendation:

- introduce report narrative templates by audience:
  - operational summary
  - management summary
  - executive summary
  - board summary

## Permissions and Security Strategy

The reporting platform must enforce:

- organisation scoping on every report query
- permission checks per report definition
- row-level filtering where a user may access some employees or modules but not others
- audit events for report requested, generated, downloaded, delivered, and viewed
- secure storage for generated files with expiry and revocation where appropriate

Note:

Some current routes rely on permission checks and likely RLS behavior rather than consistently applying explicit organisation filters to every domain query. The shared reporting layer should centralise tenant scoping rules so cross-module reporting does not depend on inconsistent route-by-route implementation.

## Performance and Scalability Strategy

### Immediate principles

- avoid large client-side report assembly for heavy datasets
- move anything beyond small operational exports to server-side generation
- paginate UI registers, but generate full reports in background jobs
- snapshot expensive cross-module reports at execution time

### Background generation

The platform already shows usable patterns:

- connection jobs
- generic job queue and job run table definitions

Recommendation:

- use a central `report_jobs` abstraction backed by the existing generic job model, not a separate bespoke scheduler per module

### Scalability patterns

- precompute common monthly aggregates where reports are repeatedly requested
- keep source-of-truth detail tables separate from report snapshot tables
- store report parameters and execution metadata for repeatability
- allow re-run using saved definitions rather than copying output logic per module

## Proposed Shared Reporting Service Design

## Core objects

### Report definition

- report key
- module owner
- audience
- required permission
- parameter schema
- default output formats
- supported schedules
- supported narrative templates

### Report request

- requested by user
- organisation
- parameters
- output format
- narrative mode on or off
- delivery targets

### Report run

- queued, running, completed, failed, expired
- execution time
- row count
- source snapshot metadata
- generated file references
- audit reference

### Report renderer

- CSV renderer
- XLSX renderer
- PDF renderer
- chart pack renderer
- AI narrative renderer

## Execution model

1. User chooses a report definition.
2. Shared service validates permissions and parameters.
3. Shared service dispatches background or synchronous execution based on size and format.
4. Domain provider loads source data from owned tables.
5. Shared service renders outputs.
6. Audit events are written.
7. Result is delivered to the UI, email, or external connection.

## Suggested First Wave Report Catalogue

## Operational first wave

- compliance exceptions report
- employee starters, leavers, and probation due report
- open matters by type and owner report
- overdue SARs report
- recruitment pipeline report
- learning overdue and renewal report
- integration health report

## Management first wave

- monthly people report
- monthly compliance pack
- monthly recruitment and onboarding pack
- monthly learning and qualifications pack
- monthly policy review pack

## Executive first wave

- executive workforce and risk report
- executive compliance and governance report
- executive recruitment and capability report

## Board first wave

- quarterly board people risk pack
- quarterly board compliance and governance pack
- quarterly board privacy and SAR assurance pack

## Delivery Roadmap

## Phase 1

- formalise report definitions for existing exports
- centralise audit event writing for report actions
- introduce shared report metadata model
- wrap existing Employees, Compliance, Talent, and Audit exports behind shared report definitions

## Phase 2

- add shared server-side CSV/XLSX/PDF rendering
- move larger exports off the client where appropriate
- add background report runs and a report history workspace

## Phase 3

- add executive and board report templates
- add chart rendering
- add scheduled delivery and report subscriptions
- add LEO INSIGHT™ audience-specific narratives

## Phase 4

- add cross-module trend snapshots and monthly aggregates
- add board packs and benchmark-style summaries
- add external delivery through approved Connections providers where suitable

## Final Recommendation

LEO should treat reporting as a platform capability, not a collection of separate module exports.

The codebase already contains enough real reporting behavior to justify that move:

- multiple export formats are live now
- multiple modules already expose operational reporting
- AI narrative reporting is already present in early form
- permissions and audit concepts already exist
- background job patterns already exist

The correct next step is not to rebuild reporting from scratch. It is to standardise what already exists, preserve module ownership of metrics, and introduce a shared reporting service for execution, security, output, scheduling, and LEO INSIGHT™ narrative generation.