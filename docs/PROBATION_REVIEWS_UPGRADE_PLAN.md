# Probation & Reviews Upgrade Plan

Branch: `feature/probation-reviews-upgrade`

## Purpose

Upgrade the existing probation capability without replacing or destabilising the current Reviews/Development areas.

The build must support Owner, Senior and authorised Manager workflows, employee self-service, desktop and mobile, audit/compliance visibility, printing, and DocuSign. Ask Leo and probation policy/guidance access remain employer-side only.

## Existing foundations to preserve

- `employee_probations`
- `probation_reviews`
- `probation_decisions`
- `probation_documents`
- `signature_envelopes`
- employee self-service API at `/api/my-employment/reviews`
- employer probation API at `/api/employees/[id]/probation`
- central role/permission resolver
- existing employee record RLS functions
- existing audit event architecture
- existing DocuSign connection/webhook/envelope service
- existing Development navigation and existing generic Reviews workspace

## Safety rules

1. Do not remove or rename existing Reviews functionality.
2. Do not change production data destructively.
3. Prefer additive schema/API changes.
4. Keep employee access read/self-service scoped; no Ask Leo or employer policy controls on employee accounts.
5. Keep employer management actions permission-gated.
6. Every material probation action must create an audit event.
7. Build and review on this feature branch before merge to `master`.
8. Preserve mobile navigation and current employee dashboard behaviour.

## Target employer experience

### Probation overview
- Status
- Start date
- Standard/current end date
- final decision deadline
- progress/timeline
- next review
- clear action state

### Employer-only tools
- Ask Leo with employee/probation/review context
- shortcut to Probation Periods & Reviews guidance/policy resource
- Add ad-hoc review
- review forms
- Print review
- Send for signature via DocuSign
- extension/final outcome controls

### Review timeline
Existing scheduled reviews remain:
- Initial Check-in
- First Review
- Progress Review
- Final Review

Add:
- Ad-hoc Review, with no fixed review week and a user-selected date/reason

### Review record/form
A review should support:
- actual review date
- manager
- attendees
- review reason where ad-hoc
- progress summary
- employee comments
- manager comments
- support required
- agreed actions
- next review date
- signature/document status

## Target employee experience

Employee self-service should show a dedicated `Your Probation` experience rather than only a raw review list.

Employee can see:
- probation status and dates
- upcoming/completed reviews
- objectives/actions shared with them
- employee reflection/preparation fields where enabled
- agreed support/actions
- signature status and completed documents they are permitted to access

Employee must not see:
- Ask Leo
- employer-only policy/guidance controls
- internal manager-only notes
- decision controls
- DocuSign administration controls

## Audit/compliance events

At minimum record:
- probation_started
- probation_review_created
- probation_review_updated
- probation_review_completed
- probation_ad_hoc_review_created
- probation_document_generated
- probation_signature_sent
- probation_signature_completed
- probation_extended
- probation_outcome_recorded

Events should identify organisation, employee, source record, actor, module and relevant changed fields/metadata using the existing audit architecture.

## DocuSign

Use the existing envelope service and `signature_envelopes` table.

Preferred change: add `Probation` as a valid `SignatureSourceModule` so probation envelopes are explicitly identifiable rather than being treated as generic Employees/Other envelopes.

The employer initiates the envelope. Employee only sees signing/status/output relevant to them.

## Data changes

### No destructive changes
Existing probation tables are sufficient for the core upgrade and ad-hoc reviews.

### Likely additive changes
Structured objectives/preparation may require an additive table or fields after the UI/API design is finalised. Do not alter production schema until required and reviewed.

For ad-hoc reviews, use the existing `probation_reviews` table with `review_type = 'Ad-hoc Review'`, `review_week = null`, a selected `scheduled_date`, and existing review fields wherever possible.

## Implementation order

1. Preserve current Development/Reviews navigation.
2. Enhance employer ProbationWorkspace presentation and timeline.
3. Add ad-hoc review API action and form.
4. Add employer-only Ask Leo and probation resource shortcuts.
5. Improve employee self-service probation page/API while preserving access boundaries.
6. Add print-ready review rendering.
7. Integrate DocuSign envelope creation/status for completed review documents.
8. Complete audit event coverage for every new action.
9. Add responsive/mobile treatment for employer and employee views.
10. Run build/type checks and review diff before opening a PR.

## Acceptance checks before merge

- Existing generic Reviews section still opens and works.
- Existing probation records and four scheduled review types still load.
- Starting probation still works.
- Saving standard reviews still works.
- Final review/extension/outcome behaviour still works.
- Owner works.
- Senior works according to permissions.
- Manager works only where authorised.
- Employee can only access own permitted probation data.
- Ask Leo is absent from employee self-service.
- probation policy/guidance control is absent from employee self-service.
- ad-hoc review creation works and appears in timeline.
- print action produces a clean review record.
- DocuSign sends to intended signers and status returns through the existing webhook.
- audit events appear for all material actions.
- desktop layout remains usable.
- iPhone/mobile layout remains stable with working links/buttons.
- no unrelated files changed.
