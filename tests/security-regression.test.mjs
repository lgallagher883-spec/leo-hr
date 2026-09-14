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
