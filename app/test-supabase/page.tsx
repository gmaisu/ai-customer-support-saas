/**
 * Server-side Supabase smoke test.
 * Confirms the server client connects and returns null for an unauthenticated session.
 * Delete this route once Phase 2 starts touching real pages.
 */

import { createClient } from "@/lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header>
        <h1 className="text-3xl font-bold">Supabase server-client smoke test</h1>
        <p className="text-muted-foreground mt-2">
          If this renders without throwing, TASK-104 is done.
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">getUser() result</h2>
        <pre className="bg-muted rounded-md p-4 text-sm">
          {JSON.stringify({ user, error: error?.message ?? null }, null, 2)}
        </pre>
        <p className="text-muted-foreground text-sm">
          Expected: <code>user: null</code> with no error (no session yet — auth lands in TASK-107).
        </p>
      </section>
    </main>
  );
}
