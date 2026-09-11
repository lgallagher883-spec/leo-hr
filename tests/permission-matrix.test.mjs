import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const employeeImport = read("app/api/employees/import/route.ts");
const matterBundle = read("app/api/matters/[id]/bundle/route.ts");
const knowledgeProcess = read("app/api/knowledge/process/route.ts");
const reminderSettings = read("app/api/reminders/settings/route.ts");
const askLeo = read("app/api/ask-leo/route.ts");

test("core privileged employee import requires employee management permission", () => {
  assert.match(employeeImport, /employees\.manage|employees\.create/);
});

test("Matter bundle export uses the dedicated export permission", () => {
  assert.match(matterBundle, /matters\.export/);
});

test("Leo Knowledge processing requires HR resource management permission", () => {
  assert.match(knowledgeProcess, /hr_resources\.manage/);
});

test("notification setting writes require notification management permission", () => {
  assert.match(reminderSettings, /notifications\.manage/);
});

test("Ask Leo explicitly enforces ask_leo.use", () => {
  assert.match(askLeo, /ask_leo\.use/);
});

test("core permission matrix documents the intended role boundaries", () => {
  const matrix = read("docs/LEO_CORE_ROLE_PERMISSION_MATRIX.md");
  assert.match(matrix, /Create employees \| ✓ \| ✓ \| — \| —/);
  assert.match(matrix, /Manage billing\/subscription \| ✓ \| — \| — \| —/);
  assert.match(matrix, /Manage HR Resources \/ Leo Knowledge \| ✓ \| ✓ \| — \| —/);
  assert.match(matrix, /Use Ask Leo \| ✓ \| ✓ \| ✓ \| ✓/);
  assert.match(matrix, /Manage organisation \| ✓ \| — \| — \| —/);
});
