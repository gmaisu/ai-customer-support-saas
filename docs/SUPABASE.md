# Supabase workflow

How to apply migrations, manage env vars, and verify Row-Level Security.

## Applying migrations

You have two paths. Pick one — both leave you in the same state.

### Path A — Dashboard SQL Editor (fastest, no extra tools)

Use this for the first migration to get unblocked immediately.

1. Open https://supabase.com/dashboard → your project → **SQL Editor**.
2. Open `supabase/migrations/20260507000001_initial_schema.sql` from this repo.
3. Copy the entire file, paste into a new SQL Editor query, click **Run**.
4. Repeat for `20260507000002_rls_policies.sql`.
5. Verify in the **Table Editor** that all 8 tables exist: `profiles`, `projects`, `sources`, `chunks`, `conversations`, `messages`, `unanswered`, `stripe_events`.
6. Verify in **Authentication → Policies** that every table has policies listed (except `stripe_events`, which has none — service-role only).

### Path B — Supabase CLI (recommended long-term)

Once you have the secret key, this is the ergonomic workflow for future migrations.

```sh
# One-time setup
pnpm dlx supabase login           # opens browser, authenticates the CLI
pnpm dlx supabase link --project-ref kcxynextmjgjewafzpzg

# Apply pending migrations
pnpm dlx supabase db push
```

Future schema changes:

```sh
pnpm dlx supabase migration new <description>   # creates a timestamped .sql file
# edit the file
pnpm dlx supabase db push                       # applies it
```

## Environment variables

Three values come from the Supabase dashboard → **Settings → API**:

| Variable                               | Where it's used                             | Where it's exposed                           |
| -------------------------------------- | ------------------------------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Browser + server clients                    | Public (`NEXT_PUBLIC_*` is in the JS bundle) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + server clients                    | Public — RLS keeps it safe                   |
| `SUPABASE_SECRET_KEY`                  | Admin client only (`lib/supabase/admin.ts`) | **Server-only.** Never expose.               |

Local dev: edit `.env.local` (gitignored). For Vercel: add them via Project Settings → Environment Variables.

The publishable key being "public" is fine — RLS is what keeps tenant data isolated. The secret key bypasses RLS, which is why it must never reach the browser.

## Verifying RLS works (TASK-106 DoD)

This is non-negotiable. Run this manually once after applying the policies migration. If it fails, do not move on — RLS is the security floor.

1. Open the app in **Chrome**, sign up as `userA@example.com`, create a project named "AAAA".
2. Open the app in **Firefox** (or Chrome incognito), sign up as `userB@example.com`.
3. As user B, visit the dashboard → projects list.
4. **Expected:** zero projects shown. User B never sees "AAAA".
5. Bonus check — open Supabase Dashboard → **SQL Editor**, run as user B's session:
   ```sql
   select * from projects;
   ```
   Should return zero rows. If "AAAA" appears, RLS is broken.

If the check fails: the `using (user_id = (select auth.uid()))` clause on the projects policy is the most likely culprit. Verify policies in **Authentication → Policies** match what's in `20260507000002_rls_policies.sql`.

## Schema notes worth remembering

- **`chunks.project_id` is denormalized.** Yes, you can derive it via `chunks → sources → projects.user_id`. Don't. Vector retrieval (TASK-212) filters by `project_id` and the join would hurt latency. The RLS policy on `chunks` also relies on `project_id` for fast checks.
- **`profiles` is auto-created** by the `handle_new_user()` trigger on `auth.users` insert. Don't insert into `profiles` from app code — let the trigger do it.
- **`vector(1536)` is locked to `text-embedding-3-small`.** Changing models = column migration. Don't change without a plan.
- **HNSW index already exists** on `chunks.embedding`. No need to add it later when wiring up retrieval.
- **`messages` and `chunks` have no UPDATE policy.** They're append-only history. Re-ingestion deletes + reinserts.

## Dev vs prod databases

Two separate Supabase projects:

| Env  | Project          | Use case                                        |
| ---- | ---------------- | ----------------------------------------------- |
| Dev  | `helpforge-dev`  | Local dev, throwaway test users, playing around |
| Prod | `helpforge-prod` | Vercel production deployment                    |

When you change schema:

1. Add a new migration file.
2. Apply to dev first (Path A or B above).
3. Test the change locally.
4. Apply to prod (same migration file, different project).

Never edit prod schema by clicking around in the dashboard — that creates drift between the live DB and the migrations folder, and the next CLI push will conflict.
