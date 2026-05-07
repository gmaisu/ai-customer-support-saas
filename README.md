# Helpforge

> Forge an AI support bot from your website in 30 seconds.

**Live demo:** https://helpforge.vercel.app

[![Live demo](https://img.shields.io/badge/demo-helpforge.vercel.app-7c3aed?style=flat-square&logo=vercel)](https://helpforge.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![OpenAI](https://img.shields.io/badge/OpenAI_BYOK-412991?style=flat-square&logo=openai&logoColor=white)](https://platform.openai.com)
[![Stripe](https://img.shields.io/badge/Stripe_test_mode-635BFF?style=flat-square&logo=stripe&logoColor=white)](https://stripe.com)

A full-stack AI customer support SaaS. Paste a website URL → Helpforge crawls it, chunks the content, embeds it with pgvector, and gives you a chatbot that answers questions with **inline citations** linking to the source pages. Multi-tenant, BYOK (bring-your-own-OpenAI-key), production-deployed.

---

## Table of contents

- [What this demonstrates](#what-this-demonstrates)
- [Try it (60 seconds)](#try-it-60-seconds)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Local setup](#local-setup)
- [Repo layout](#repo-layout)
- [Documentation](#documentation)
- [Status](#status)

## What this demonstrates

- **Full-stack TypeScript** — Next.js 16 App Router, server components, server actions, streaming chat
- **RAG pipeline end-to-end** — same-domain BFS crawler with `robots.txt` respect, token-aware chunking (cl100k_base, 500/50 overlap), batched embeddings (`text-embedding-3-small`), pgvector retrieval via `match_chunks` with HNSW + cosine distance
- **Streaming chat with inline citations** — Vercel AI SDK v6, retrieval-augmented system prompts, numbered `[N]` markers parsed client-side into clickable chips
- **BYOK architecture** — every user supplies their own OpenAI key; the platform never proxies AI usage. Zero ongoing cost to operate
- **Multi-tenant SaaS** — Row-Level Security on every table, denormalized `chunks.project_id` so retrieval scopes by user without joins, function-level filter on `match_chunks` as a second layer
- **Real-time UI** — Supabase Realtime `postgres_changes` subscriptions drive live crawl progress without manual polling
- **Stripe billing in test mode** — Checkout + webhook-driven plan tiering, idempotent event log, customer portal
- **Plan-aware feature gating** — server-enforced project caps, daily message limits, crawl page caps tied to `profiles.plan`
- **Production deploy** — Vercel with env vars, env-var-driven Stripe price IDs, no-platform-key fallback for OpenAI
- **Production hardening** — error boundaries (route + global), 404 page, loading skeletons, `/api/health`, sitemap, robots, Open Graph metadata, Vercel Analytics

## Try it (60 seconds)

1. https://helpforge.vercel.app — sign up
2. **Account** → paste your OpenAI API key
3. **Projects** → create a project
4. **Sources** tab → paste a URL like `https://supabase.com/docs` → **Crawl site**
5. Watch the live status: **Pending → Crawling → Chunking → Embedding → Ready**
6. **Chat** tab → ask "What is RLS?" — see streaming response with citation chips you can click

## Tech stack

| Layer         | Choice                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------- |
| Frontend      | Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind 4 + shadcn/ui (Base UI) |
| Backend       | Next.js Route Handlers + server actions                                                   |
| Database      | Supabase (Postgres 17 + pgvector + Realtime + Storage + RLS)                              |
| Auth          | Supabase Auth via `@supabase/ssr`, session-refresh middleware                             |
| AI            | OpenAI `gpt-4o-mini` (chat) + `text-embedding-3-small` (1536-dim embeddings)              |
| Crawler       | `cheerio` HTML parsing + `robots-parser` + same-host BFS, capped per plan                 |
| Chunking      | `gpt-tokenizer` cl100k_base, 500-token chunks with 50-token overlap                       |
| Streaming     | Vercel AI SDK v6 (`streamText`, `useChat` hook, custom `DefaultChatTransport`)            |
| Billing       | Stripe (test mode) — Checkout + webhook + Customer Portal                                 |
| Charts        | recharts                                                                                  |
| Hosting       | Vercel — production deploys via CLI; CI auto-deploy not yet wired                         |
| Observability | Vercel Analytics + `/api/health` endpoint                                                 |

## Architecture

```
        ┌────────────────┐
        │  Browser (RSC) │
        └───────┬────────┘
                │
                ▼
   ┌───────────────────────┐        ┌─────────────────┐
   │ Next.js (Vercel edge) │◄──────►│  Supabase Auth  │
   │  - middleware refresh │        └─────────────────┘
   │  - server actions     │
   │  - /api routes        │        ┌─────────────────────────┐
   │  - useChat / RSC      │◄──────►│  Postgres + pgvector    │
   └────┬──────────────────┘        │  - 8 tables, RLS on all │
        │                           │  - match_chunks() RPC   │
        │ ▲                         │  - HNSW index           │
        │ │                         └─────────────────────────┘
        │ │
        │ │                         ┌─────────────────────────┐
        │ └─────── Realtime ◄──────►│  postgres_changes       │
        │                           │  (live crawl progress)  │
        │                           └─────────────────────────┘
        ▼
   ┌────────────────┐    user's key    ┌───────────┐
   │  Crawler +     │─────────────────►│  OpenAI   │
   │  chunking +    │                  │ (BYOK)    │
   │  retrieval     │                  └───────────┘
   └────────────────┘

   ┌─────────────┐    webhook    ┌──────────────────────┐
   │  Stripe     │──────────────►│  /api/stripe/webhook │
   │  Checkout   │   signed      │  flips profiles.plan │
   └─────────────┘   event       └──────────────────────┘
```

## Local setup

```sh
git clone https://github.com/gmaisu/ai-customer-support-saas.git
cd ai-customer-support-saas
pnpm install

# Fill in Supabase + Stripe values (no OpenAI here — that's BYOK per-user)
cp .env.example .env.local

# Apply schema migrations to your own Supabase project (see docs/SUPABASE.md)
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <your-project-ref>
pnpm dlx supabase db push

pnpm dev   # http://localhost:3000
```

Required env vars (see [.env.example](.env.example)):

| Variable                               | Source                                              |
| -------------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase → Settings → API                           |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Settings → API                           |
| `SUPABASE_SECRET_KEY`                  | Supabase → Settings → API (secret)                  |
| `NEXT_PUBLIC_SITE_URL`                 | Your deploy URL (or `http://localhost:3000` in dev) |
| `STRIPE_SECRET_KEY`                    | Stripe → API keys (test mode)                       |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`   | Stripe → API keys (test mode)                       |
| `STRIPE_WEBHOOK_SECRET`                | Stripe → Webhooks → Endpoint signing secret         |
| `STRIPE_PRO_PRICE_ID`                  | Stripe → Products → Pro → Pricing                   |

## Repo layout

```
app/
  (auth)/                              Login, signup, check-email (route group)
  api/
    chat/                              Streaming chat with retrieval + citations
    sources/[id]/crawl/                Crawl orchestration (auth + BYOK gate + pipeline)
    stripe/{checkout,portal,webhook}   Subscription lifecycle
    health/                            Liveness probe
  auth/{actions,callback}/             Auth server actions + email link handler
  dashboard/
    projects/                          Project list + create
    projects/[id]/
      sources/                         URL ingestion + sources list
      chat/                            Streaming chat playground
      conversations/                   History list + detail replay
      analytics/                       Stats + chart + unanswered
      settings/                        Brand, greeting, embed snippet
    settings/                          Account + BYOK key + billing
  pricing/                             Free / Pro tiers + Stripe upgrade
  error.tsx, global-error.tsx          Production error boundaries
  not-found.tsx                        404 page
components/
  ui/                                  shadcn primitives (Base UI)
  auth/                                Auth forms
  dashboard/                           Sidebar, topbar, project tabs, charts
  chat/                                Chat panel, message bubbles, citation chips
  billing/                             Upgrade + portal buttons
lib/
  supabase/{client,server,admin}.ts    Three Supabase clients
  db/                                  Typed query helpers (server-only)
  crawler/                             fetch-page + crawl-site (BFS, robots.txt)
  prompts.ts                           Retrieval-aware system prompt
  retrieval.ts                         match_chunks RPC wrapper
  embeddings.ts                        BYOK-required embedding client
  chunking.ts                          Token-aware chunker
  stripe.ts                            Stripe client + PLAN_LIMITS
supabase/migrations/                   SQL migrations under version control
docs/                                  Brief, tasks, branding, costs, supabase
public/widget.js                       Embed script stub
```

## Documentation

- [docs/ai_customer_support_saas.md](docs/ai_customer_support_saas.md) — Product brief, scope, decisions
- [docs/TASKS.md](docs/TASKS.md) — Execution plan with definition-of-done per task
- [docs/SUPABASE.md](docs/SUPABASE.md) — Schema, migration workflow, RLS verification
- [docs/COSTS.md](docs/COSTS.md) — $0 to operate (BYOK explained)
- [docs/BRANDING.md](docs/BRANDING.md) — Name, tagline, colors, logo

## Status

| Phase                                      | What it adds                                                        | Status                                                |
| ------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------- |
| 1 — Foundation                             | Auth, RLS, schema, deploys                                          | ✅                                                    |
| 2 — URL → Chunks                           | Crawler, chunking, embeddings, retrieval                            | ✅                                                    |
| 3 — Chat                                   | Streaming, citations, persistence, rate limit, unanswered detection | ✅                                                    |
| 5 — Analytics + History + Settings + Embed | Charts, history, brand controls, embed snippet                      | ✅                                                    |
| 6 — Marketing + Billing                    | Pricing page, Stripe Checkout, webhook, portal, plan gating         | ✅                                                    |
| 7 — Production polish                      | Error boundaries, loading states, SEO, Analytics, health probe      | ✅ (in progress — Sentry + mobile/a11y audit pending) |
| 4 — PDF + FAQ ingestion                    | Reuses crawl pipeline                                               | ⏳ Deferred (not in demo script)                      |
| 8 — Demo + launch                          | Seed account, demo video, Upwork listing                            | ⏳                                                    |

## License

MIT
