# Helpforge

> Forge an AI support bot from your website in 30 seconds.

**Live demo:** https://helpforge.vercel.app

A full-stack AI customer support SaaS. Paste a website URL — Helpforge crawls it, chunks the content, embeds it into a vector store, and gives you a chatbot that answers questions with **inline citations** to the source material. PDFs and pasted FAQ text are also supported.

This is a portfolio MVP. The full plan, scope, and rationale live in [docs/](docs/).

---

## What this demonstrates

- **Full-stack TypeScript** — Next.js 16 App Router, server components, server actions, streaming
- **RAG pipeline** — chunking, embeddings (OpenAI `text-embedding-3-small`), pgvector retrieval with HNSW
- **Multi-tenant SaaS** — Row-Level Security across 8 tables, project-scoped isolation enforced at the DB layer
- **Authentication** — Supabase Auth with email/password, session refresh middleware, protected routes
- **Real-time UI** — Supabase Realtime subscriptions for live crawl progress
- **Stripe billing** — Checkout + webhook-driven plan tiering (test mode, [Phase 6](docs/TASKS.md))
- **Production deploy** — Vercel with env vars, edge functions, automatic HTTPS

## Tech stack

| Layer    | Choice                                                                |
| -------- | --------------------------------------------------------------------- |
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind 4 + shadcn/ui (Base UI) |
| Backend  | Next.js API routes + server actions                                   |
| Database | Supabase (Postgres 17 + pgvector + RLS)                               |
| Auth     | Supabase Auth (`@supabase/ssr`)                                       |
| AI       | OpenAI (`gpt-4o-mini` + `text-embedding-3-small`)                     |
| Billing  | Stripe Checkout (test mode)                                           |
| Hosting  | Vercel                                                                |

## Status

Phase 1 (foundation) deployed. Phase 2 (URL → chunks) in progress.

See [docs/TASKS.md](docs/TASKS.md) for the full execution plan and current state. Each phase ends with a deploy gate — the live URL above is always the latest production build.

## Local setup

```sh
git clone https://github.com/gmaisu/ai-customer-support-saas.git
cd ai-customer-support-saas
pnpm install

# fill in Supabase + OpenAI + Stripe values
cp .env.example .env.local

# apply schema migrations to your own Supabase project (see docs/SUPABASE.md)
pnpm dlx supabase login
pnpm dlx supabase link --project-ref <your-project-ref>
pnpm dlx supabase db push

pnpm dev
```

## Repo layout

```
app/                    Next.js App Router
  (auth)/               Login, signup, password-reset (route group)
  auth/actions.ts       Server actions for auth
  auth/callback/        Email confirmation handler
  dashboard/            Protected routes
components/
  ui/                   shadcn primitives (Base UI under the hood)
  auth/                 Login form, signup form, sign-out button
lib/
  supabase/             Browser, server, and admin clients
  db/                   (typed query helpers — Phase 2)
supabase/
  migrations/           SQL migrations under version control
docs/
  ai_customer_support_saas.md    Product brief + 21-task backlog
  TASKS.md                       Full execution plan with DoD per task
  BRANDING.md                    Locked-in brand identity
  COSTS.md                       What this actually costs to run
  SUPABASE.md                    Migration workflow + RLS verification
```

## Documentation

- [docs/ai_customer_support_saas.md](docs/ai_customer_support_saas.md) — Product brief, scope, decisions
- [docs/TASKS.md](docs/TASKS.md) — Execution plan, ~110 focused hours across 9 phases
- [docs/SUPABASE.md](docs/SUPABASE.md) — Schema, migrations, RLS verification
- [docs/COSTS.md](docs/COSTS.md) — ~$10 one-time, $0/month ongoing
- [docs/BRANDING.md](docs/BRANDING.md) — Name, tagline, colors, logo

## License

MIT
