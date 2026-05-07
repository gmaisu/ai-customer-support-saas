/**
 * One-shot signup smoke test against live Supabase.
 * Verifies the handle_new_user trigger fires and creates a profiles row.
 *
 * Usage: node scripts/test-signup.mjs
 *
 * Safe to delete after Phase 1 verification.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx), l.slice(idx + 1)];
    }),
);

const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = `helpforge-test+${Date.now()}@gmail.com`;
const password = "test-password-12345";

console.log(`\n→ Creating test user ${email} via admin API (bypasses public validation)...`);
const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createError) {
  console.error("✗ User creation failed:", createError.message);
  process.exit(1);
}

const userId = createData.user.id;
console.log("✓ User created. user_id:", userId);

console.log(`\n→ Checking profiles row (auto-created by handle_new_user trigger)...`);
const { data: profile, error: profileError } = await adminClient
  .from("profiles")
  .select("id, email, plan, daily_message_count, created_at")
  .eq("id", userId)
  .maybeSingle();

if (profileError) {
  console.error("✗ Profile query failed:", profileError.message);
  await adminClient.auth.admin.deleteUser(userId);
  process.exit(1);
}

if (!profile) {
  console.error("✗ No profile row — handle_new_user trigger is NOT firing.");
  console.error("  Check that migration 20260507000001_initial_schema.sql actually ran.");
  await adminClient.auth.admin.deleteUser(userId);
  process.exit(1);
}

console.log("✓ Profile row exists:", profile);

console.log(`\n→ Verifying default plan and counter values...`);
const checks = [
  ["plan", profile.plan, "free"],
  ["daily_message_count", profile.daily_message_count, 0],
  ["email", profile.email, email],
];
let allOk = true;
for (const [field, actual, expected] of checks) {
  const ok = actual === expected;
  console.log(`  ${ok ? "✓" : "✗"} ${field}: ${actual}${ok ? "" : ` (expected ${expected})`}`);
  if (!ok) allOk = false;
}

console.log(`\n→ Cleaning up test user...`);
await adminClient.auth.admin.deleteUser(userId);
console.log("✓ Test user deleted.\n");

if (allOk) {
  console.log("ALL CHECKS PASSED — schema, trigger, and admin client all working.\n");
  process.exit(0);
} else {
  console.error("SOME CHECKS FAILED — see above.\n");
  process.exit(1);
}
