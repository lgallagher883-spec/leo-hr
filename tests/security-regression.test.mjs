import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const askLeo = read("app/api/ask-leo/route.ts");
const matterBundle = read("app/api/matters/[id]/bundle/route.ts");
const leave = read("app/api/my-employment/leave/route.ts");
const knowledgeHealth = read("app/api/knowledge/health/route.ts");
const secureResources = read("app/api/knowledge/resources/file/route.ts");
const employeeChangeWorkflow = read("lib/agentic/employeeChangeWorkflow.ts");
const agenticLeaveWorkflow = read("lib/agentic/leaveWorkflow.ts");
const employeeLeaveRoute = read("app/api/my-employment/leave/route.ts");

test("Ask Leo enforces the explicit product permission", () => {
  assert.match(askLeo, /target_permission_key:\s*"ask_leo\.use"/);
  assert.match(askLeo, /leo_has_permission/);
});

test("Matter bundle generation requires export permission", () => {
  assert.match(matterBundle, /requirePermission\("matters\.export"\)/);
  assert.doesNotMatch(matterBundle, /requirePermission\("matters\.view"\)/);
});

test("future leave bank holidays are bounded by the requested dates", () => {
  assert.match(leave, /event\.date >= startDate/);
  assert.match(leave, /event\.date <= endDate/);
  assert.match(leave, /employmentStart/);
  assert.match(leave, /employmentEnd/);
});

test("knowledge health count is organisation scoped", () => {
  assert.match(knowledgeHealth, /\.eq\("organisation_id", organisationId\)/);
});

test("secure HR resource uploads require manage while reads require view", () => {
  assert.match(secureResources, /authorisedContext\("hr_resources\.manage"\)/);
  assert.match(secureResources, /authorisedContext\("hr_resources\.view"\)/);
});


const reminderEngine = read("app/api/reminders/_engine.ts");
const reminderSettings = read("app/api/reminders/settings/route.ts");

test("standard reminder timing is organisation configurable while SAR timing stays fixed", () => {
  assert.match(reminderEngine, /organisation_reminder_settings/);
  assert.match(reminderEngine, /standardReminderDays/);
  assert.match(reminderEngine, /if \(days <= 1\) return "T-1"/);
  assert.match(reminderEngine, /if \(days <= 14\) return "T-14"/);
  assert.match(reminderSettings, /notifications\.manage/);
  assert.match(reminderSettings, /standardDaysBefore/);
  assert.match(reminderSettings, /sarDaysBefore:\s*\[14, 7, 1\]/);
});


const employeeImportPage = read("app/dashboard/employees/page.tsx");
const employeeImportApi = read("app/api/employees/import/route.ts");

test("employee import supports basic RTW, working pattern, emergency contact and continuous service data", () => {
  assert.match(employeeImportPage, /Right to Work Check Date/);
  assert.match(employeeImportPage, /Continuous Service Date/);
  assert.match(employeeImportPage, /Emergency Contact Phone/);
  assert.match(employeeImportPage, /Working Days/);
  assert.doesNotMatch(employeeImportPage, /DBS Expiry Date/);
  assert.doesNotMatch(employeeImportPage, /Driving Licence Expiry/);
  assert.match(employeeImportApi, /employee_right_to_work/);
  assert.match(employeeImportApi, /employee_emergency_contacts/);
  assert.match(employeeImportApi, /continuous_service_date/);
});


const mcpRoute = read("app/api/mcp/route.ts");

test("ChatGPT MCP accepts legacy read-only tool names", () => {
  assert.match(mcpRoute, /leo_get_employee:\s*"leo_get_employee_overview"/);
  assert.match(mcpRoute, /leo_list_employees:\s*"leo_search_employees"/);
  assert.match(mcpRoute, /leo_attention:\s*"leo_get_attention_summary"/);
  assert.match(mcpRoute, /legacyToolAliases\[requestedToolName\] \|\| requestedToolName/);
});


const onboardingTemplates = read("lib/onboarding/templates.ts");
const talentOnboarding = read("app/api/talent/onboarding/route.ts");
const newStarterReadiness = read("lib/onboarding/newStarterReadiness.ts");
const newStarterReadinessApi = read("app/api/employees/[id]/new-starter-readiness/route.ts");

test("Talent and direct employee readiness share one onboarding template source", () => {
  assert.match(talentOnboarding, /@\/lib\/onboarding\/templates/);
  assert.match(talentOnboarding, /getOnboardingTemplates/);
  assert.match(onboardingTemplates, /right_to_work/);
  assert.match(onboardingTemplates, /contract_issue/);
  assert.match(onboardingTemplates, /mandatory_learning/);
});

test("new starter readiness is deterministic and organisation scoped", () => {
  assert.match(newStarterReadiness, /\.eq\("organisation_id", organisationId\)/);
  assert.match(newStarterReadiness, /employee_right_to_work/);
  assert.match(newStarterReadiness, /employee_dbs_checks/);
  assert.match(newStarterReadiness, /employee_probations/);
  assert.match(newStarterReadiness, /organisation_invitations/);
  assert.doesNotMatch(newStarterReadiness, /OpenAI|chat\.completions|responses\.create/);
});

test("new starter readiness API requires workforce view permission and blocks employee accounts", () => {
  assert.match(newStarterReadinessApi, /employees\.view/);
  assert.match(newStarterReadinessApi, /role === "employee"/);
  assert.match(newStarterReadinessApi, /leo_current_organisation_id/);
});

const newStarterPlan = read("lib/onboarding/newStarterPlan.ts");
const newStarterAgent = read("lib/onboarding/newStarterAgent.ts");
const newStarterAutoActions = read("lib/onboarding/newStarterAutoActions.ts");
const promptBuilder = read("leo/prompt/builder™.ts");

test("new starter action planning stays deterministic and keeps consequential actions gated", () => {
  assert.doesNotMatch(newStarterPlan, /OpenAI|chat\.completions|responses\.create/);
  assert.match(newStarterPlan, /Prepare probation schedule/);
  assert.match(newStarterPlan, /kind: "automatic"/);
  assert.match(newStarterPlan, /employee portal invitation/);
  assert.match(newStarterPlan, /standard Employee portal invitation automatically/);
  assert.match(newStarterPlan, /must not infer whether DBS is required/);
});

const employeeProfilePage = read("app/dashboard/employees/[id]/page.tsx");
const employeeDashboardPage = read("app/dashboard/employee/page.tsx");
const employeeDocumentsRoute = read("app/api/employees/[id]/documents/route.ts");
const agenticDocumentWorkflow = read("lib/agentic/documentWorkflow.ts");
const agenticDocumentText = read("lib/agentic/documentText.ts");
const agenticDocumentFacts = read("lib/agentic/documentFacts.ts");
const agenticEmployeeChangeWorkflow = read("lib/agentic/employeeChangeWorkflow.ts");
const agenticAttentionRoute = read("app/api/agentic/attention/route.ts");
const employmentRoute = read("app/api/employees/[id]/employment/route.ts");
const askLeoPage = read("app/dashboard/ask-leo/page.tsx");
const dashboardPage = read("app/dashboard/page.tsx");

test("new starter readiness is surfaced consistently without bypassing the server readiness API", () => {
  assert.match(employeeProfilePage, /new-starter-readiness/);
  assert.doesNotMatch(employeeProfilePage, /Ask Leo to get/);
  assert.match(employeeProfilePage, /Leo needs your help/);
  assert.match(dashboardPage, /new-starter-readiness/);
  assert.match(dashboardPage, /Leo Needs Your Help/);
  assert.match(dashboardPage, /Review actions/);
});


test("future-dated active employees are treated as upcoming starters", () => {
  assert.match(employeeProfilePage, /isUpcomingStarter/);
  assert.match(employeeProfilePage, /start_date/);
  assert.match(dashboardPage, /employee\.start_date/);
  assert.match(dashboardPage, /former employee/);
  assert.match(dashboardPage, /archived/);
});


test("new starter workflow starts deterministically and avoids an unnecessary model call", () => {
  assert.doesNotMatch(newStarterAgent, /OpenAI|chat\.completions|responses\.create/);
  assert.match(newStarterAgent, /When you have that information, let me know so I can continue getting/);
  assert.match(askLeo, /contextType === "new_starter"/);
  assert.match(askLeo, /newStarterWorkflowStart/);
  assert.match(askLeo, /buildNewStarterWorkflowStartReply/);
});

test("new starter AI follow-up is constrained to the readiness workflow", () => {
  assert.match(promptBuilder, /AGENTIC NEW STARTER WORKFLOW/);
  assert.match(promptBuilder, /Do not invent a separate onboarding checklist/);
  assert.match(promptBuilder, /Always end the response/);
  assert.match(askLeoPage, /contextType: sarContext/);
  assert.match(askLeoPage, /"new_starter"/);
});

test("completed starter work disappears and generic lifecycle AI panels are removed", () => {
  assert.match(employeeProfilePage, /requiresEmployerAttention/);
  assert.match(dashboardPage, /starter\.attentionCount > 0/);
  const employeeLifecycleFiles = [
    "app/dashboard/employees/[id]/components/EmploymentDetails.tsx",
    "app/dashboard/employees/[id]/components/EmployeeDocuments.tsx",
    "app/dashboard/employees/[id]/components/LeaveAbsence.tsx",
    "app/dashboard/employees/[id]/components/ComplianceSummary.tsx",
    "app/dashboard/employees/[id]/components/EmployeeMatters.tsx",
    "app/dashboard/employees/[id]/components/EmployeeNotes.tsx",
    "app/dashboard/employees/[id]/components/EmployeeWarnings.tsx",
  ];
  for (const file of employeeLifecycleFiles) {
    assert.doesNotMatch(read(file), /EmployeeLifecycleIntelligence/);
  }
});


test("learning stays out of new starter readiness", () => {
  assert.doesNotMatch(newStarterReadiness, /mandatory_learning/);
  assert.doesNotMatch(newStarterReadiness, /employee_training_logs/);
});

test("Leo automatically handles probation, employee invitation and contract preparation context", () => {
  assert.match(newStarterAutoActions, /employee_probations/);
  assert.match(newStarterAutoActions, /probation_reviews/);
  assert.match(newStarterAutoActions, /role: "employee"/);
  assert.match(newStarterAutoActions, /inviteUserByEmail/);
  assert.match(newStarterAutoActions, /company_documents/);
  assert.match(newStarterAutoActions, /organisation_foundations/);
  assert.match(newStarterAutoActions, /Contract Preparation/);
  assert.match(askLeo, /runNewStarterAutomaticActions/);
  assert.match(newStarterAutoActions, /missing_fields/);
});

test("Leo Needs Your Help uses a symbol rather than an action count", () => {
  assert.match(dashboardPage, /summaryHelpSymbolStyle/);
  assert.match(dashboardPage, /needsHelp \? "✦" : "✓"/);
  assert.doesNotMatch(dashboardPage, /\{totalActions\}/);
});


test("new starter updates accept verified passport wording without inferring British nationality", () => {
  const employerUpdate = read("lib/onboarding/newStarterEmployerUpdate.ts");
  assert.match(employerUpdate, /extractVerifiedPassportRtw/);
  assert.match(employerUpdate, /hasPassport/);
  assert.match(employerUpdate, /isBritishPassport/);
  assert.match(employerUpdate, /existingNationality \|\| "Not specified"/);
  assert.match(employerUpdate, /nationality,/);
});

test("shared emergency contact email can satisfy both supplied contacts", () => {
  const employerUpdate = read("lib/onboarding/newStarterEmployerUpdate.ts");
  assert.match(employerUpdate, /sharedEmail/);
  assert.match(employerUpdate, /for \(const contact of contacts\) contact\.email = contact\.email \|\| sharedEmail/);
});


test("new starter automation is decoupled from Ask Leo UI", () => {
  assert.doesNotMatch(employeeProfilePage, /dashboard\/ask-leo\?employeeId/);
  assert.doesNotMatch(employeeProfilePage, /Ask Leo to get/);
  assert.match(employeeProfilePage, /method: "POST"/);
  assert.match(dashboardPage, /attentionCount/);
});

test("contract gaps are surfaced as explicit employer confirmations", () => {
  assert.match(newStarterAutoActions, /Salary \/ pay/);
  assert.match(newStarterAutoActions, /Contracted hours/);
  assert.match(newStarterAutoActions, /Place of work/);
  assert.match(newStarterReadiness, /Confirm:/);
  assert.match(employeeProfilePage, /Contract information to confirm/);
});


test("employee self-service work stays out of employer help", () => {
  assert.doesNotMatch(
    employeeProfilePage,
    /"starter_details", "manager", "right_to_work", "dbs", "emergency_contact"/,
  );
  assert.doesNotMatch(
    dashboardPage,
    /"starter_details", "manager", "right_to_work", "dbs", "emergency_contact"/,
  );
  assert.match(employeeDashboardPage, /Complete your emergency contact/);
  assert.match(employeeDashboardPage, /\/api\/my-employment\/emergency-contacts/);
  assert.match(employeeDashboardPage, /Add emergency contact/);
});


test("agentic document handling stays silent and evidence-safe", () => {
  assert.match(employeeDocumentsRoute, /classifyEmployeeDocument/);
  assert.match(employeeDocumentsRoute, /Agentic Document Handling/);
  assert.match(employeeDocumentsRoute, /source_module: "Agentic Leo"/);
  assert.doesNotMatch(employeeDocumentsRoute, /dashboard\/ask-leo/);
  assert.match(agenticDocumentWorkflow, /receiving it does not itself verify right to work/);
  assert.match(agenticDocumentWorkflow, /suitability and verification remain human-controlled/);
  assert.match(agenticDocumentWorkflow, /canAdvanceWorkflow: false/);
});


test("document filing advances safe workflow continuity", () => {
  assert.match(employeeDocumentsRoute, /canonicalDocumentType/);
  assert.match(employeeDocumentsRoute, /Absence Evidence Linked/);
  assert.match(employeeDocumentsRoute, /No medical judgement was made/);
  assert.match(newStarterReadiness, /Right to work evidence is already on file/);
  assert.match(newStarterReadiness, /DBS evidence is already on file/);
  assert.match(newStarterReadiness, /authorised person still needs to verify/);
});


test("document classification prefers deterministic extraction before AI", () => {
  assert.match(agenticDocumentText, /mammoth\.extractRawText/);
  assert.match(agenticDocumentText, /TextDecoder/);
  assert.match(employeeDocumentsRoute, /extractEmployeeDocumentText/);
  assert.match(employeeDocumentsRoute, /contentText: extracted\.text/);
  assert.doesNotMatch(agenticDocumentText, /OpenAI|chat\.completions|responses\.create/);
});


test("approved employee changes prepare downstream administration silently", () => {
  assert.match(agenticEmployeeChangeWorkflow, /detectApprovedEmploymentChanges/);
  assert.match(agenticEmployeeChangeWorkflow, /contract_variation/);
  assert.match(agenticEmployeeChangeWorkflow, /payroll_change_pack/);
  assert.match(agenticEmployeeChangeWorkflow, /role_assignments_review/);
  assert.match(employmentRoute, /Agentic Employee Change/);
  assert.match(employmentRoute, /ask_leo_involved: false/);
  assert.doesNotMatch(agenticEmployeeChangeWorkflow, /OpenAI|chat\.completions|responses\.create/);
});


test("labelled document facts remain non-destructive", () => {
  assert.match(agenticDocumentFacts, /extractDocumentFacts/);
  assert.match(agenticDocumentFacts, /certificate_issue_date/);
  assert.match(agenticDocumentFacts, /document_expiry/);
  assert.match(employeeDocumentsRoute, /agentic_extracted_facts/);
  assert.doesNotMatch(agenticDocumentFacts, /\.from\(|insert\(|update\(/);
});

test("change-it-once prepares reusable downstream packs without external submission", () => {
  assert.match(agenticEmployeeChangeWorkflow, /buildEmployeeChangePacks/);
  assert.match(employmentRoute, /Contract Variation Prepared/);
  assert.match(employmentRoute, /Payroll Change Pack Prepared/);
  assert.match(employmentRoute, /submission_status: "not_submitted"/);
  assert.match(employmentRoute, /issue_status: "not_issued"/);
  assert.match(employmentRoute, /employer_reentry_required: false/);
});


test("Agentic Leo exceptions derive from current records and stay out of Ask Leo", () => {
  assert.match(agenticAttentionRoute, /source_module", "Agentic Leo"/);
  assert.match(agenticAttentionRoute, /status", "Needs Review"/);
  assert.match(agenticAttentionRoute, /employee_right_to_work/);
  assert.match(agenticAttentionRoute, /employee_dbs_checks/);
  assert.match(agenticAttentionRoute, /employee_driving_checks/);
  assert.doesNotMatch(agenticAttentionRoute, /ask-leo|Ask Leo/);
  assert.match(dashboardPage, /\/api\/agentic\/attention/);
  assert.match(employeeProfilePage, /AgenticAttentionBanner/);
  assert.match(employeeProfilePage, /Leo needs your help/);
});


test("Agentic probation only reschedules untouched standard schedules", () => {
  assert.match(newStarterAutoActions, /Agentic Probation Created/);
  assert.match(newStarterAutoActions, /syncAgenticProbationToApprovedStartDate/);
  assert.match(newStarterAutoActions, /Probation was not created by Agentic Leo/);
  assert.match(newStarterAutoActions, /A probation review has already progressed/);
  assert.match(newStarterAutoActions, /extension_end_date \|\| probation\.data\.final_outcome/);
  assert.match(employmentRoute, /probationSync/);
  assert.match(newStarterAutoActions, /approved employee start date changed/);
});


test("Agentic probation manager sync only touches untouched reviews", () => {
  assert.match(newStarterAutoActions, /syncAgenticProbationManager/);
  assert.match(newStarterAutoActions, /There are no untouched probation reviews to update/);
  assert.match(newStarterAutoActions, /review\.completed_date/);
  assert.match(newStarterAutoActions, /\["Scheduled", "Pending", ""\]/);
  assert.match(newStarterAutoActions, /Agentic Probation Manager Updated/);
  assert.match(employmentRoute, /probationManagerSync/);
  assert.match(newStarterAutoActions, /approved line-manager change/);
});


test("Agentic contract preparation refreshes only while unissued", () => {
  assert.match(newStarterAutoActions, /refreshUnissuedAgenticContractPreparation/);
  assert.match(newStarterAutoActions, /issue_status !== "not_issued"/);
  assert.match(newStarterAutoActions, /contract preparation is no longer unissued/);
  assert.match(newStarterAutoActions, /refreshed_by: "agentic_leo_change_it_once"/);
  assert.match(newStarterAutoActions, /Agentic Contract Preparation Refreshed/);
  assert.match(employmentRoute, /contractPreparationRefresh/);
  assert.match(employmentRoute, /refreshUnissuedAgenticContractPreparation/);
});


test("approved leave configuration propagates without a duplicate balance write", () => {
  assert.match(agenticEmployeeChangeWorkflow, /part_year_worker/);
  assert.match(agenticEmployeeChangeWorkflow, /holiday_year_start_month/);
  assert.match(agenticEmployeeChangeWorkflow, /leave_entitlement_basis/);
  assert.match(agenticEmployeeChangeWorkflow, /bank_holiday_treatment/);
  assert.match(employmentRoute, /Agentic Leave Configuration Updated/);
  assert.match(employmentRoute, /separate_balance_write_required: false/);
  assert.match(employmentRoute, /leave workspace will use the updated configuration automatically/);
});


test("approved role changes assign only explicit published mandatory pathways", () => {
  assert.match(agenticEmployeeChangeWorkflow, /syncPublishedMandatoryRolePathways/);
  assert.match(agenticEmployeeChangeWorkflow, /\.eq\("status", "Published"\)/);
  assert.match(agenticEmployeeChangeWorkflow, /\.eq\("assignment_type", "Mandatory"\)/);
  assert.match(agenticEmployeeChangeWorkflow, /\.ilike\("target_role", targetRole\)/);
  assert.match(agenticEmployeeChangeWorkflow, /without duplicating existing active assignments/);
  assert.match(agenticEmployeeChangeWorkflow, /assignment_source: "Agentic Leo - approved role"/);
  assert.match(employmentRoute, /mandatoryRolePathways/);
  assert.match(employmentRoute, /syncPublishedMandatoryRolePathways/);
});


test("Agentic new starter portal invitation avoids existing organisation access", () => {
  assert.match(newStarterAutoActions, /organisation_memberships/);
  assert.match(newStarterAutoActions, /getUserById/);
  assert.match(newStarterAutoActions, /already has organisation access/);
  assert.match(newStarterAutoActions, /Agentic Portal Invitation Sent/);
  assert.match(newStarterAutoActions, /role: "employee"/);
  assert.match(newStarterAutoActions, /ask_leo_involved: false/);
});


test("received contracts close only matching unissued Agentic preparation", () => {
  assert.match(employeeDocumentsRoute, /classification\.category === "contract"/);
  assert.match(employeeDocumentsRoute, /event_type", "Contract Preparation"/);
  assert.match(employeeDocumentsRoute, /preparationMetadata\.issue_status === "not_issued"/);
  assert.match(employeeDocumentsRoute, /issue_status: "received"/);
  assert.match(employeeDocumentsRoute, /Agentic Contract Workflow Completed/);
  assert.match(employeeDocumentsRoute, /ask_leo_involved: false/);
});


test("qualification uploads create unverified records without claiming validity", () => {
  assert.match(employeeDocumentsRoute, /classification\.category === "qualification"/);
  assert.match(employeeDocumentsRoute, /verification_status: "Unverified"/);
  assert.match(employeeDocumentsRoute, /Validity and equivalence still require human verification/);
  assert.match(employeeDocumentsRoute, /qualification_evidence/);
  assert.match(employeeDocumentsRoute, /Agentic Qualification Evidence Filed/);
  assert.match(employeeDocumentsRoute, /ask_leo_involved: false/);
});


test("driving licence evidence never becomes automatic driving authorisation", () => {
  assert.match(employeeDocumentsRoute, /classification\.category === "driving"/);
  assert.match(employeeDocumentsRoute, /authorised_to_drive: "No"/);
  assert.match(employeeDocumentsRoute, /dvla_check_completed: "No"/);
  assert.match(employeeDocumentsRoute, /DVLA verification and authority to drive remain separate decisions/);
  assert.match(employeeDocumentsRoute, /Agentic Driving Evidence Filed/);
  assert.match(employeeDocumentsRoute, /ask_leo_involved: false/);
});


test("DBS certificate evidence never becomes an automatic suitability decision", () => {
  assert.match(employeeDocumentsRoute, /classification\.category === "dbs"/);
  assert.match(employeeDocumentsRoute, /Agentic DBS Evidence Filed/);
  assert.match(employeeDocumentsRoute, /suitability_decision_recorded: false/);
  assert.match(employeeDocumentsRoute, /update_service_verified: false/);
  assert.match(employeeDocumentsRoute, /Suitability, certificate level and any Update Service verification remain separate decisions/);
  assert.match(employeeDocumentsRoute, /ask_leo_involved: false/);
});


test("right to work evidence never becomes automatic statutory verification", () => {
  assert.match(employeeDocumentsRoute, /classification\.category === "right_to_work"/);
  assert.match(employeeDocumentsRoute, /check_completed_date: null/);
  assert.match(employeeDocumentsRoute, /right_to_work_expiry: null/);
  assert.match(employeeDocumentsRoute, /right_to_work_expiry_set_from_document: false/);
  assert.match(employeeDocumentsRoute, /has not been treated as completion of the statutory right to work check/);
  assert.match(employeeDocumentsRoute, /Agentic Right To Work Evidence Filed/);
  assert.match(employeeDocumentsRoute, /ask_leo_involved: false/);
});


test("Agentic evidence attention self clears when the human verification is complete", () => {
  assert.match(employeeDocumentsRoute, /classification: "qualification"/);
  assert.match(employeeDocumentsRoute, /classification: "driving"/);
  assert.match(employeeDocumentsRoute, /classification: "dbs"/);
  assert.match(employeeDocumentsRoute, /classification: "right_to_work"/);
  assert.match(agenticAttentionRoute, /classification === "qualification"/);
  assert.match(agenticAttentionRoute, /verification_status/);
  assert.match(agenticAttentionRoute, /toLowerCase\(\) !== "verified"/);
});


test("Agentic attention follows the exact evidence record and requires the real decision", () => {
  assert.match(agenticAttentionRoute, /employee_dbs_check_id/);
  assert.match(agenticAttentionRoute, /employee_driving_check_id/);
  assert.match(agenticAttentionRoute, /dbs_level/);
  assert.match(agenticAttentionRoute, /suitabilityConfirmed/);
  assert.match(agenticAttentionRoute, /authorised_to_drive/);
  assert.match(agenticAttentionRoute, /dvla_check_completed/);
});


test("approved start date changes flow through Agentic contract and payroll preparation", () => {
  assert.match(employeeChangeWorkflow, /start_date: "Employment start date"/);
  assert.match(employeeChangeWorkflow, /\["role", "start_date", "status", "email"\]/);
  assert.match(employeeChangeWorkflow, /const contractFields = \[\s*"role",\s*"start_date"/);
  assert.match(employeeChangeWorkflow, /const payrollFields = \[\s*"role",\s*"start_date"/);
});


test("start date changes create the same downstream actions as their prepared packs", () => {
  const startDateChange = [{ field: "start_date", label: "Employment start date", previousValue: "2026-09-21", newValue: "2026-09-28" }];
  assert.match(employeeChangeWorkflow, /fields\.has\("start_date"\)/);
  assert.match(employeeChangeWorkflow, /key: "contract_variation"/);
  assert.match(employeeChangeWorkflow, /key: "payroll_change_pack"/);
  assert.match(employeeChangeWorkflow, /start_date/);
  assert.equal(startDateChange[0].field, "start_date");
});


test("role changes match only explicit organisation compliance resources without faking acknowledgement", () => {
  assert.match(employeeChangeWorkflow, /reconcileRoleComplianceResources/);
  assert.match(employeeChangeWorkflow, /notes\.includes\(roleNeedle\)/);
  assert.match(employeeChangeWorkflow, /acknowledgement_status: "not_recorded"/);
  assert.match(employeeChangeWorkflow, /automatic_acknowledgement: false/);
  assert.match(employeeChangeWorkflow, /ask_leo_involved: false/);
});


test("role compliance reconciliation is idempotent for the same role and resource versions", () => {
  assert.match(employeeChangeWorkflow, /Agentic Role Compliance Resources Matched/);
  assert.match(employeeChangeWorkflow, /matchedIds/);
  assert.match(employeeChangeWorkflow, /alreadyRecorded/);
  assert.match(employeeChangeWorkflow, /current role-based compliance resource match is already recorded/);
});


test("role policy reconciliation only treats already shared company documents as employee available", () => {
  assert.match(employeeChangeWorkflow, /from\("company_documents"\)/);
  assert.match(employeeChangeWorkflow, /\.eq\("access_level", "everyone"\)/);
  assert.match(employeeChangeWorkflow, /available_to_employee: availableResourceIds/);
  assert.match(employeeChangeWorkflow, /acknowledgement_status: "not_recorded"/);
  assert.match(employeeChangeWorkflow, /only resources already shared with employees are treated as available/);
});


test("routine leave automation requires explicit delegation and confirmed safe inputs", () => {
  assert.match(agenticLeaveWorkflow, /delegatedAutoApproval/);
  assert.match(agenticLeaveWorkflow, /Annual Leave/);
  assert.match(agenticLeaveWorkflow, /workingPatternKnown/);
  assert.match(agenticLeaveWorkflow, /available annual leave balance/);
  assert.match(agenticLeaveWorkflow, /overlaps another active leave record/);
  assert.match(agenticLeaveWorkflow, /canAutoApprove: reasons\.length === 0/);
});


test("employee leave only auto approves after explicit organisation delegation", () => {
  assert.match(agenticLeaveWorkflow, /explicitlyDelegates && !explicitBlock/);
  assert.match(employeeLeaveRoute, /readDelegatedRoutineLeaveApproval/);
  assert.match(employeeLeaveRoute, /assessRoutineAnnualLeave/);
  assert.match(employeeLeaveRoute, /resolvedStatus = routineAssessment\.canAutoApprove/);
  assert.match(employeeLeaveRoute, /agentic_auto_approved: resolvedStatus === "Approved"/);
  assert.match(employeeLeaveRoute, /ask_leo_involved: false/);
});


test("Agentic leave decisions persist their basis without Ask Leo", () => {
  assert.match(employeeLeaveRoute, /agenticAutoApproved: resolvedStatus === "Approved"/);
  assert.match(employeeLeaveRoute, /agenticDecisionReasons: routineAssessment\.reasons/);
  assert.match(employeeLeaveRoute, /agentic_decision_reasons: routineAssessment\.reasons/);
  assert.match(employeeLeaveRoute, /ask_leo_involved: false/);
});


test("routine Agentic cancellation only reverses leave Leo itself safely approved", () => {
  assert.match(agenticLeaveWorkflow, /shouldAutoCancelRoutineAnnualLeave/);
  assert.match(agenticLeaveWorkflow, /wasAgenticAutoApproved/);
  assert.match(agenticLeaveWorkflow, /only reverses leave that it previously approved automatically/);
  assert.match(agenticLeaveWorkflow, /leaveHasStarted/);
  assert.match(agenticLeaveWorkflow, /canAutoCancel: reasons\.length === 0/);
});


test("employee self service only auto cancels future leave Leo previously auto approved", () => {
  assert.match(employeeLeaveRoute, /shouldAutoCancelRoutineAnnualLeave/);
  assert.match(employeeLeaveRoute, /wasAgenticAutoApproved/);
  assert.match(employeeLeaveRoute, /requiresHumanReview: true/);
  assert.match(employeeLeaveRoute, /status: "Cancelled"/);
  assert.match(employeeLeaveRoute, /balance_restored_by_status: true/);
  assert.match(employeeLeaveRoute, /ask_leo_involved: false/);
});
