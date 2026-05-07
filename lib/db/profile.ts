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
