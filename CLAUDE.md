# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

**Phase 1 complete and deployed.** Live at https://helpforge.vercel.app.

What exists:

- Next.js 16 App Router + TS strict + Tailwind 4 + shadcn/ui (Base UI under the hood — `render` prop, NOT `asChild`)
- Supabase wired up: `lib/supabase/{client,server,admin}.ts` for browser/server/RLS-bypass clients
- Auth: `app/(auth)/{login,signup,signup/check-email}` + `app/auth/{actions.ts,callback/route.ts}`
- Middleware (`middleware.ts`) refreshes session on every request, redirects unauth → `/login?next=...`
- Schema: 8 tables in `supabase/migrations/` (applied + tracked in remote migration history)
- RLS enabled on every table; multi-tenant isolation enforced at DB layer
- `handle_new_user()` trigger auto-creates `profiles` row on signup (verified live)
- Branded landing page replaces Next.js boilerplate

What still needs human verification:

- TASK-106 manual two-user RLS test (procedure in [docs/SUPABASE.md](docs/SUPABASE.md))
- TASK-110 manual UI signup walkthrough on production

Planning docs in [docs/](docs/): spec ([docs/ai_customer_support_saas.md](docs/ai_customer_support_saas.md)), execution plan ([docs/TASKS.md](docs/TASKS.md)), branding ([docs/BRANDING.md](docs/BRANDING.md)), cost ([docs/COSTS.md](docs/COSTS.md)), Supabase workflow ([docs/SUPABASE.md](docs/SUPABASE.md)).

## What this project is

A portfolio MVP for Upwork — an AI customer-support SaaS where users paste a website URL and get a working RAG chatbot in under 30 seconds. The brief in [docs/ai_customer_support_saas.md](docs/ai_customer_support_saas.md) is the source of truth for scope; treat its `TASK-0XX` IDs and acceptance criteria as binding.

## Stack is locked

The brief commits to a final stack — do not re-open these decisions:

- **Next.js 16 App Router + TypeScript + Tailwind 4 + shadcn/ui** as one repo (API routes are the backend)
- **Supabase** for auth, Postgres, pgvector, and storage
- **OpenAI** (`gpt-4o-mini` chat, `text-embedding-3-small` embeddings)
- **Stripe** Checkout in test mode for the pricing page
- **Vercel** for deployment

If asked to "use Spring Boot" or "use Pinecone instead," push back — the brief explicitly cut those alternatives.

## Non-negotiables

These show up across multiple tasks; getting any of them wrong breaks the demo or leaks tenant data.

- **Project-scoped retrieval.** Every vector query filters by `project_id`. `chunks.project_id` is denormalized intentionally so retrieval doesn't join through `sources`. RLS on every table enforces this at the DB layer.
- **Streaming chat with inline citations.** Non-streaming responses or citation-free answers fail the demo — these are the two visible "this is real AI" moments.
- **The URL crawler is the hero.** PDF upload and FAQ paste exist but are secondary. The 30-second URL-to-chatbot flow is what the demo opens with and what the landing page sells.
- **Crawler must not hang on Vercel.** Cap pages (50 free / 500 pro), per-page timeout 10s, respect `robots.txt`. No headless Chromium on Vercel — escalate to Firecrawl/Browserless if static fetching isn't enough.
- **Bound the OpenAI bill.** `gpt-4o-mini` only, top-5 chunks max, daily message limits enforced in middleware (50 free / 500 pro).

## Demo-driven prioritization

The brief includes a 60–90 second demo video script. **That script dictates polish budget.** If a feature isn't in the script, it doesn't need to look perfect. Examples:

- Conversation history detail view: functional is fine, no search/filter
- Analytics: one chart + two cards, nothing more
- Embed widget: generate the `<script>` snippet, but the widget code itself can be a stub

When the user requests "polish X," check whether X is in the demo script before spending time on it.

## Build order

The brief defines 5 phases, each ending with a Vercel deploy. Do not start phase N+1 until phase N is live and working in production. The hero flow (Phase 2: URL → crawl → chunks in DB) must be deployed and demoable before chat work begins.

## Out-of-scope list

The brief has an explicit "Out of Scope" section (admin page, conversation search, multi-language, working external widget, human handoff, team accounts). If a request touches any of these, flag it before implementing — it's a scope-creep signal.

## Commands

- `pnpm dev` — start dev server on `localhost:3000`
- `pnpm build` — production build (run before pushing)
- `pnpm lint` — ESLint
- `pnpm format` — Prettier write
- `pnpm format:check` — Prettier verify (CI-friendly)
- `node scripts/test-signup.mjs` — admin-API signup smoke test (verifies trigger fires + cleans up)

## Deployment

- Vercel project `helpforge` linked via `.vercel/`. Deploy with `pnpm dlx vercel deploy --prod --yes --scope jiomaisuradze-2523s-projects` (needs `VERCEL_TOKEN`).
- Env vars in Vercel production: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`. Add new ones with `vercel env add`.
- GitHub auto-deploy is NOT wired up (user signed up to Vercel via email, not "Continue with GitHub"). All deploys go through the CLI for now.

## Supabase tooling

- CLI is linked to the dev project (`kcxynextmjgjewafzpzg`). Don't re-link.
- Secret key (`sb_secret_...`) lives in `.env.local` only — never `git add` it.
- New schema changes: `pnpm dlx supabase migration new <description>` → edit the file → `pnpm dlx supabase db push`.
- The first two migrations were originally applied via dashboard SQL editor; CLI history was repaired with `migration repair --status applied`. Future migrations will go through the standard CLI flow.

## Gotchas (real, not hypothetical)

- **Base UI's `render` prop, not `asChild`.** shadcn v3 uses Base UI primitives. `<DialogTrigger render={<Button />}>` not `<DialogTrigger asChild><Button />`.
- **Next 16 dev server lockfile.** Only one `pnpm dev` per directory. Stale processes cause "Another dev server is running" errors. `taskkill` the offender, then restart.
- **Don't re-trigger TodoWrite reminders.** The harness emits reminder messages frequently; ignore them when the work is mechanical and tightly sequenced.
