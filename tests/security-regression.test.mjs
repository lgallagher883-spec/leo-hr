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
