# LEO HR Resources Architecture and Autonomy Audit

Date: 2026-08-05
Scope: Read-only architecture audit before runtime code changes.

## 1. Current-State Audit Against Requested Checks

### A. Resource model and registration

| Check | Finding | Classification |
|---|---|---|
| 1. Every resource is currently registered manually in an index-page array | Factsheets, Guides, Forms, Toolkits and some Letters use hard-coded published arrays in page files. Checklists and many detail pages are also hard-coded as route files with per-page constants and embedded content. | Partially implemented |
| 2. New resources require repeated edits to catalogue pages, export logic or routes | Adding a resource currently requires at least one or more of: updating a category array, creating/editing a route page, copying per-page preview/Word/PDF logic, and wiring Ask Leo return links. | Partially implemented |
| 3. Search, categories, counters and filters are fully data-driven | Organisation resources (policy_register and company_documents) are data-backed with runtime counts and filters. LEO library categories and published resources are still static in UI code. | Partially implemented |
| 4. Preview, Word, PDF and Ask Leo work consistently for every resource | Patterns are inconsistent. Some pages open generated DOC/PDF, some route back to page, and some Ask Leo links use incorrect resource type/return routes. Dynamic preview route uses hard-coded sample metadata. | Partially implemented |
| 5. Related resources are hard-coded or generated from shared metadata | Related resources are currently hard-coded (for example the previewResources map in the category/slug preview route). | Requires new development |
| 6. LEO-owned resources are stored separately from organisation-uploaded resources | Organisation resources are stored separately in company_documents and policy_register paths. LEO library content is mostly embedded in code pages rather than in a dedicated shared resource table. Separation exists, but LEO resource storage is not yet a first-class data model. | Partially implemented |
| 7. Ask Leo can securely use both LEO resources and approved organisation documents | Permission and tenant checks exist in endpoints. However, Ask Leo document-policy loading currently maps policy_register chunks only, not company_documents chunks in that path. There is also no full "approved" lifecycle gate for organisation docs beyond active/archived status. | Security or architecture concern |
| 8. Resources can be versioned, reviewed, superseded and archived without losing history | Organisation document replacement and archive flows exist, and hr_resource_versions exists for preservation during replace. But delete permanently removes resource and versions, review/superseded governance is not complete, and LEO library content versioning is not metadata-driven. | Partially implemented |
| 9. LEO can identify resources affected by legal changes, prepare updated versions and request approval where required | No end-to-end legal-change impact pipeline is implemented for resource inventory, targeted redraft, approval workflow and controlled publish for HR resources. | Requires new development |
| 10. Architecture supports hundreds/thousands of resources without duplicated page logic | Current LEO library route architecture duplicates page and export logic per resource. Organisation resource APIs can scale better, but library rendering model will not scale to large catalogues without consolidation. | Security or architecture concern |

### B. Proactive autonomy capabilities

| Capability | Current position | Classification |
|---|---|---|
| Detecting changes in legislation or official guidance | Authority modules include structured legal/regulatory reasoning sources, but no automated ingestion/watcher pipeline for external change detection tied to resource lifecycle. | Requires new development |
| Identifying affected policies, contracts, letters, guides and knowledge | No implemented impact graph that maps legal change -> affected resources across catalogue and organisation docs. | Requires new development |
| Preparing revised drafts | Draft generation capability exists in broader platform, but no integrated HR resource maintenance workflow that auto-prepares candidate revisions against affected resources. | Requires new development |
| Showing changes or comparisons | Version history exists for some organisation resources, but no standard diff/compare presentation for policy text changes across all resource types. | Partially implemented |
| Preserving previous versions | Replace flow preserves prior versions in hr_resource_versions. Hard delete removes history. | Partially implemented |
| Requesting employer approval only where needed | Approval concepts exist in other modules, but HR resource approval workflow is not yet implemented as a policy-controlled publish gate. | Requires new development |
| Publishing approved updates | No unified approved-to-published state machine for HR resources across all source types. | Requires new development |
| Re-indexing updated content into LEO Knowledge | DOCX replace and prepare flows reprocess knowledge chunks. Non-DOCX support is not available in knowledge reader v1. | Partially implemented |
| Notifying relevant users | No HR resource change notification workflow was found tied to approvals/publish/review outcomes. | Requires new development |
| Recording every action in Audit Logs | Audit logs infrastructure exists, but resource lifecycle endpoints reviewed do not consistently write audit events for all resource actions. | Security or architecture concern |

## 2. Confirmed Current Position

1. The platform has two parallel resource worlds:
- Organisation-owned resources (database-backed, permission-checked APIs, some version/archive handling).
- LEO library resources (primarily code-embedded content and category arrays in UI routes).

2. Tenant and permission controls are broadly present in resource and knowledge endpoints through organisation resolution and permission RPC checks.

3. Knowledge indexing is operational for organisation resources, but automated text extraction currently supports DOCX only.

4. Ask Leo does not yet consume both main organisation resource sources consistently in its current HR document loader path.

5. The architecture documentation describes a strong target-state, but implementation is still mixed between static page-era patterns and newer data-driven APIs.

## 3. Genuine Gaps

1. No single shared LEO resource catalogue table for factsheets, guides, checklists, letters, forms, policies and toolkits.
2. No unified metadata model driving page generation, preview, related resources, export strategy and Ask Leo context.
3. No unified publish/review/approval/version state machine for all resource types.
4. Inconsistent Ask Leo linkage and resource typing in some page routes.
5. No end-to-end legal-change impact detection and autonomous maintenance loop.
6. No complete HR resource action audit coverage.
7. Hard-delete behavior can remove version history.
8. Scalability risk from duplicated route logic for each library resource.

## 4. Exact Files and Database Areas Likely Affected

### A. Key frontend/workspace files

- app/dashboard/policies/page.tsx
- app/dashboard/policies/factsheets/page.tsx
- app/dashboard/policies/guides/page.tsx
- app/dashboard/policies/forms/page.tsx
- app/dashboard/policies/letters/page.tsx
- app/dashboard/policies/toolkits/page.tsx
- app/dashboard/policies/checklists/page.tsx
- app/dashboard/policies/[category]/[slug]/page.tsx
- app/dashboard/policies/**/page.tsx (resource detail pages)
- app/dashboard/ask-leo/page.tsx
- app/dashboard/organisation/company-documents/components/CompanyDocumentsLibrary.tsx

### B. Key API/backend files

- app/api/hr-resources/route.ts
- app/api/company-documents/route.ts
- app/api/company-documents/upload/route.ts
- app/api/company-documents/[id]/route.ts
- app/api/company-documents/[id]/open/route.ts
- app/api/knowledge/process/route.ts
- app/api/knowledge/resources/route.ts
- app/api/knowledge/resources/manage/route.ts
- app/api/knowledge/resources/versions/route.ts
- app/api/knowledge/search/route.ts
- app/api/ask-leo/route.ts
- app/api/audit-logs/route.ts

### C. Core LEO knowledge and reasoning files

- leo/knowledge/index.ts
- leo/knowledge/processor.ts
- leo/knowledge/store.ts
- leo/knowledge/retrieve.ts
- leo/authority/router.ts
- leo/authority/legislation/**
- leo/authority/acas/**
- leo/authority/regulators/**

### D. Database areas (Supabase)

- policy_register
- company_documents
- hr_resource_versions
- knowledge_chunks
- leo_organisation_memory_records
- audit_logs
- storage buckets: policy-documents, company-documents
- permission and organisation resolution RPCs used by endpoints:
  - leo_current_organisation_id
  - leo_has_permission

## 5. Smallest Enterprise-Grade Target Architecture

Design goal: keep each module as source-owner, while introducing one shared resource catalogue and metadata model that removes duplicate page/export logic and supports proactive LEO maintenance.

### A. Ownership model

1. Source owners remain unchanged:
- Organisation workspace owns organisation_uploaded resources.
- LEO content owner workflow owns leo_managed resources.
- Knowledge module owns indexing/retrieval state.
- Ask Leo owns runtime retrieval and answer orchestration.

2. Shared catalogue becomes the cross-module contract:
- One catalogue row per resource identity.
- Separate version rows and source pointers.
- No module duplicates content-routing logic.

### B. Minimal shared data model

1. hr_resource_catalogue
- id (uuid)
- organisation_id (nullable for global LEO resources, required for tenant resources)
- ownership_scope (leo_global | organisation)
- source_system (leo_library | company_documents | policy_register | generated)
- source_record_id (nullable)
- resource_type (factsheet | guide | checklist | letter | template | form | policy | toolkit)
- category
- title
- slug
- status (draft | under_review | approved | published | superseded | archived)
- active_version_id
- confidentiality_classification
- created_at, updated_at

2. hr_resource_versions
- keep and extend existing table to include:
- catalogue_id
- version_number
- file_format
- file_path/file_url or structured body reference
- change_summary
- supersedes_version_id
- approved_by, approved_at
- published_at
- archived_at

3. hr_resource_relationships
- source_catalogue_id
- related_catalogue_id
- relationship_type (related | prerequisite | replacement | legal_dependency)

4. hr_resource_review_tasks
- trigger_source (legal_change | scheduled_review | manual)
- status
- assigned_to
- findings_summary
- draft_version_id (nullable)

5. hr_resource_impact_events
- external_change_source
- authority_reference
- detected_at
- impacted_catalogue_ids (or join table)
- action_state

### C. Shared service boundaries

1. Resource Catalogue Service
- read/write shared metadata and relationship graph.

2. Resource Render Service
- one render path for preview, Word, PDF from version payloads.

3. Resource Knowledge Service
- unified prepare/reindex interface for all supported formats.

4. Resource Governance Service
- review, approval, publish, supersede, archive lifecycle.

5. Resource Audit Service
- mandatory structured audit event for each lifecycle transition.

## 6. Recommended Implementation Phases

### Phase 1: Stabilise and unify metadata (smallest safe foundation)

1. Introduce shared catalogue tables and map existing resources.
2. Keep existing pages, but read resource lists from shared catalogue API.
3. Add strict source ownership fields and tenant guardrails.
4. Add mandatory audit logging for resource lifecycle endpoints.

Exit: all category pages can be generated from catalogue metadata, without changing content generation yet.

### Phase 2: Consolidate render and Ask Leo wiring

1. Replace per-page Word/PDF/preview duplication with shared render endpoint.
2. Standardise Ask Leo resource context payload contract.
3. Ensure Ask Leo retrieval includes both policy_register and company_documents sources with source-status checks.
4. Add related-resource generation from metadata relationships.

Exit: consistent preview/export/Ask Leo behavior across all resource types.

### Phase 3: Governance lifecycle and history hardening

1. Implement status workflow: draft -> review -> approved -> published -> superseded/archived.
2. Replace hard-delete with retention-safe soft delete policy for governed resources.
3. Add compare/diff UI and version audit timeline.
4. Add review schedules and overdue review queues.

Exit: full governance lifecycle with preserved history and controlled publishing.

### Phase 4: Proactive legal-change autonomy

1. Introduce legal/official guidance change ingestion pipeline.
2. Build impact mapping from authority topics to resource metadata/tags/clauses.
3. Auto-open review tasks and optionally prepare revision drafts.
4. Route for human approval where policy requires.
5. Publish approved updates, re-index, notify target users, and audit every step.

Exit: end-to-end proactive LEO resource maintenance loop operational.

## 7. Smallest Safe First Development Step

Implement a read-only shared catalogue API that overlays current resources without replacing existing routes:

1. Create catalogue tables and ingestion script that maps:
- existing LEO library resources (from static route metadata), and
- organisation resources (policy_register and company_documents).

2. Add a new API endpoint that returns category/resource metadata from the shared catalogue.

3. Switch one low-risk page (for example policies/factsheets) to read list metadata from this endpoint while keeping current detail route rendering unchanged.

Why this is the smallest safe step:
- no runtime behavior removal,
- no destructive migration,
- immediate reduction in manual registration drift,
- establishes contract for later render/governance/autonomy phases.

## 8. Clear Completion Criteria

1. Registration and discovery
- 100% of resource listings are generated from shared catalogue metadata.
- no category page contains hard-coded published arrays.

2. Consistency
- preview, Word, PDF and Ask Leo use shared resource identity and version metadata.
- no route-specific Ask Leo type/return mismatch.

3. Governance
- all resources use the same lifecycle states.
- superseded versions remain queryable and immutable.
- deletion policy preserves required history.

4. Security and isolation
- all retrieval paths enforce organisation isolation and permission checks.
- Ask Leo can retrieve both approved organisation docs and eligible LEO resources by policy.

5. Proactive autonomy
- legal/guidance change event can create impacted-resource tasks,
- draft revision can be generated,
- approval gate can be applied,
- approved version can be published,
- knowledge re-index executes,
- notifications send,
- audit logs capture every transition.

6. Scale
- architecture is validated with load and indexing tests at >= 10,000 organisations and high resource counts without per-resource page duplication.
