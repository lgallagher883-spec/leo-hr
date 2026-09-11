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
