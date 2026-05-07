import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/db";

/**
 * Returns the signed-in user's profile row, or null if not signed in.
 * RLS lets users read their own row, so this works through the user-scoped
 * client (no admin bypass needed).
 */
export async function getOwnProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateOwnProfile(
  patch: Partial<Pick<Profile, "openai_api_key">>,
): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Server-only: fetch one user's OpenAI key for use in background jobs (the
 * crawl orchestration route runs after auth check, then needs the key to
 * call OpenAI on the user's behalf). Uses admin client so the call works
 * regardless of session boundary, but ALWAYS pair this with an explicit
 * ownership check at the route's auth gate.
 */
export async function getUserOpenAIKey(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("openai_api_key")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.openai_api_key ?? null;
}

/**
 * Reset daily counter if it's a new UTC day, then return whether the user is
 * still under their plan's per-day chat limit.
 *
 * BYOK softens the urgency of strict rate limiting (users pay OpenAI directly,
 * so abuse hurts them not us). We still cap to prevent obvious script abuse.
 * The cap differs by plan — free users get a smaller bucket than pro.
 *
 * Returns:
 *   { allowed: true, remaining }
 *   { allowed: false, limit }
 */
import { PLAN_LIMITS } from "@/lib/stripe";

export async function checkAndIncrementChatQuota(
  userId: string,
): Promise<{ allowed: true; remaining: number } | { allowed: false; limit: number }> {
  const admin = createAdminClient();

  const { data: profile, error: readErr } = await admin
    .from("profiles")
    .select("daily_message_count, daily_count_reset_at, plan")
    .eq("id", userId)
    .maybeSingle();
  if (readErr || !profile) throw new Error(readErr?.message ?? "Profile missing");

  const limit =
    PLAN_LIMITS[profile.plan as "free" | "pro"]?.dailyMessages ?? PLAN_LIMITS.free.dailyMessages;

  const now = new Date();
  const lastReset = new Date(profile.daily_count_reset_at);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const shouldReset = now.getTime() - lastReset.getTime() >= oneDayMs;

  const currentCount = shouldReset ? 0 : profile.daily_message_count;
  if (currentCount >= limit) {
    return { allowed: false, limit };
  }

  const { error: writeErr } = await admin
    .from("profiles")
    .update({
      daily_message_count: currentCount + 1,
      daily_count_reset_at: shouldReset ? now.toISOString() : profile.daily_count_reset_at,
    })
    .eq("id", userId);
  if (writeErr) throw new Error(writeErr.message);

  return { allowed: true, remaining: limit - (currentCount + 1) };
}
