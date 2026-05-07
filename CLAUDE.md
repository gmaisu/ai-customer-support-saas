# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

Phase 1 in progress. Next.js 16 (App Router) + TypeScript strict + Tailwind 4 + ESLint + Prettier scaffolded. No Supabase/auth/DB yet. Planning docs live in [docs/](docs/) — the spec is [docs/ai_customer_support_saas.md](docs/ai_customer_support_saas.md), execution plan is [docs/TASKS.md](docs/TASKS.md), cost rationale is [docs/COSTS.md](docs/COSTS.md).

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
