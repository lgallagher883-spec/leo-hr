import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const forgotPassword = read("app/forgot-password/page.tsx");
const resetPassword = read("app/reset-password/page.tsx");
const login = read("app/login/page.tsx");

test("password reset links prefer the configured application origin", () => {
  assert.match(forgotPassword, /NEXT_PUBLIC_APP_URL/);
  assert.match(forgotPassword, /resetPasswordForEmail/);
  assert.match(forgotPassword, /\/reset-password/);
});

test("reset page requires a genuine recovery code instead of any active session", () => {
  assert.match(resetPassword, /searchParams\.get\("code"\)/);
  assert.match(resetPassword, /if \(!code\)/);
  assert.match(resetPassword, /exchangeCodeForSession\(code\)/);
  assert.match(resetPassword, /event === "PASSWORD_RECOVERY" && session/);
  assert.doesNotMatch(resetPassword, /event === "PASSWORD_RECOVERY" \|\| session/);
  assert.doesNotMatch(resetPassword, /setValidSession\(Boolean\(data\.session\)\)/);
});

test("successful recovery signs out and returns to sign in with confirmation", () => {
  assert.match(resetPassword, /auth\.signOut\(\)/);
  assert.match(resetPassword, /password-reset=success/);
  assert.match(login, /password-reset/);
  assert.match(login, /Your password has been updated/);
});
