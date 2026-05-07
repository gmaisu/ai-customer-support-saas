import { createClient } from "@supabase/supabase-js";

/**
 * Admin client. Bypasses RLS via the service-role secret key.
 *
 * CRITICAL: only import this in server-side code (API routes, server actions,
 * server components). Never in client components — the secret key would leak
 * to the browser bundle.
 *
 * Use cases: webhooks (Stripe → flip user plan), Storage admin, migrations.
 * Never use this for normal user-facing queries; those go through the regular
 * server client which respects RLS.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SECRET_KEY) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Add it to .env.local from the Supabase dashboard → Settings → API → secret key.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
