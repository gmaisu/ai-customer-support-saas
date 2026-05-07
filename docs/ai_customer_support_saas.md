# AI Customer Support SaaS Platform

## Portfolio Goal
Build a full-stack SaaS MVP that lets a business spin up an AI-powered customer-support chatbot from its own website, FAQs, and PDFs — in under a minute. The project demonstrates AI product engineering, RAG, dashboards, auth, file processing, third-party API integration, and Stripe billing in a single deployable repo.

This is a **portfolio piece for Upwork**. Every decision below is optimized for: (1) a 60–90s demo video that hooks buyers, (2) keyword coverage in profile/proposals (Next.js, OpenAI, RAG, Supabase, pgvector, Stripe), and (3) a live URL a buyer can click and try themselves.

## Hero Differentiator: 30-Second Website Onboarding
Most AI chatbot demos start with "upload a PDF." This one starts with **"paste your website URL."** The product crawls the site, extracts the text, chunks and embeds it, and produces a working chatbot — with a live progress UI — in under 30 seconds. PDF and pasted-FAQ ingestion still exist, but the URL crawler is the hero flow shown in the demo video and the landing page.

This is the single feature the demo opens with. Do not dilute it by giving equal weight to other ingestion paths.

## Ideal Client (Upwork search terms this should rank for)
"AI chatbot developer," "OpenAI integration," "RAG developer," "Next.js full-stack," "Supabase developer," "AI SaaS MVP," "custom GPT for business," "embeddable AI widget."

## Product Summary
Users sign up, paste a website URL (or upload PDFs / paste FAQ text), and get a chatbot trained on that content. They test it in a chat playground, see analytics, and grab an embed snippet. A pricing page with real Stripe Checkout (test mode) gates a "Pro" tier.

## Locked-In Tech Stack
No alternatives. Decisions below are final to avoid scope drift.

- **Frontend + backend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui. API routes serve as the backend — single repo, single deploy.
- **Database + auth + storage + vector:** Supabase (Postgres + pgvector + Auth + Storage). One service, one set of credentials.
- **AI:** OpenAI API (`gpt-4o-mini` for chat, `text-embedding-3-small` for embeddings). README mentions Claude compatibility but does not implement it.
- **Crawling:** A serverless-friendly crawler. Start with `cheerio` + `node-fetch` for static pages. If JS-rendered sites become a blocker, escalate to a hosted service (Firecrawl, Browserless) — do not run headless Chromium on Vercel.
- **Billing:** Stripe Checkout + webhook → Supabase `plan` column. Test mode only. Pricing page links to real Checkout.
- **Deployment:** Vercel. Demo URL must be live before the project is considered "done."

## Core Features (final scope)
1. Email/password auth via Supabase
2. Dashboard with project list
3. Create project → paste URL → live crawl progress → chatbot ready
4. Secondary ingestion: PDF upload, paste FAQ text
5. Chat playground with **streaming responses** and **inline citations** (each answer shows which source it came from, with a link)
6. Conversation history (list + detail view, no search)
7. Analytics: one hero chart (conversations over time) + two stat cards (total conversations, % unanswered)
8. Embed snippet generator (a real `<script>` tag, even if the widget itself is mocked — see Out of Scope)
9. Project settings: name, brand color, greeting, fallback message
10. Public landing page with Stripe-powered pricing

## Out of Scope (do not build)
These were in the original brief and are now cut to protect the demo:
- Separate admin page (fold into project settings)
- Conversation search/filter
- Multi-language support
- Real working embeddable widget on an external site (generate the `<script>` snippet, but the widget code itself can be a stub)
- Human handoff / agent inbox
- Team/org accounts (single-user projects only)

If a request lands that touches this list, push back before implementing.

## Database Schema (final)
Eight tables. Multi-tenant by `user_id` and `project_id`; never query without one of those scopes.

- `profiles` — extends `auth.users`, holds `plan` (`free` | `pro`)
- `projects` — `user_id`, name, brand_color, greeting, fallback_message
- `sources` — `project_id`, type (`url` | `pdf` | `text`), source_url, status (`crawling` | `ready` | `failed`), char_count
- `chunks` — `source_id`, `project_id` (denormalized for fast retrieval), content, embedding (`vector(1536)`), token_count
- `conversations` — `project_id`, started_at
- `messages` — `conversation_id`, role (`user` | `assistant`), content, citations (jsonb array of chunk_ids), confidence
- `unanswered` — `conversation_id`, `message_id`, question (denormalized for analytics)
- `stripe_events` — idempotency log for webhook handling

`chunks.project_id` is denormalized intentionally: every retrieval query filters by it, and the join through `sources` would hurt vector search latency.

## Critical Implementation Notes

**Retrieval must be project-scoped.** Every vector query filters by `project_id`. A bug here leaks one tenant's data into another's chatbot — treat it as a security issue, not a feature bug.

**Streaming, not request/response.** Chat uses Server-Sent Events. Buyers watching the demo immediately recognize streaming as "real" AI; non-streaming feels like a tutorial.

**Citations are visible in the UI.** Each assistant message shows numbered source chips ([1], [2]) that link to the source URL or PDF page. This is the second-most-important demo moment after the URL crawl.

**Crawler limits.** Cap at 50 pages per project on free, 500 on pro. Respect `robots.txt`. Hard timeout per page (10s). The demo should never hang.

**Keep the OpenAI bill bounded.** Use `gpt-4o-mini`. Cap context at top-5 chunks. Set a per-user daily message limit (50 free, 500 pro) enforced in middleware.

## Demo Video Script (60–90 seconds)
This dictates what gets polished. If a feature isn't in this script, it doesn't need to look perfect.

1. Landing page hero, click "Start Free" (5s)
2. Sign up, land on empty dashboard (10s)
3. Click "New Project," paste a real website URL, watch live progress bar (15s)
4. Land in chat playground, type a question, watch streamed answer with citation chips (15s)
5. Click a citation, see the source highlighted (5s)
6. Open analytics page, show the chart (5s)
7. Open settings, change brand color, show it reflected in the embed preview (10s)
8. Show the embed `<script>` snippet and pricing page (10s)

## Build Order
Each phase ends with something demoable. Do not start the next until the current one is deployed to Vercel.

### Phase 1 — Foundation (TASK-001 to TASK-004)
- Next.js + Tailwind + shadcn scaffold
- Supabase project, auth wired up, protected routes
- Database schema migrated
- Deploy to Vercel with a working signup flow

### Phase 2 — The Hero Flow (TASK-005 to TASK-009)
- Dashboard shell, project CRUD
- URL crawler with live progress (SSE or Supabase Realtime on `sources.status`)
- Chunking + embedding pipeline
- Vector search returning project-scoped chunks
- Working end-to-end: paste URL, get chunks in DB

### Phase 3 — Chat (TASK-010 to TASK-013)
- Chat playground UI
- Streaming OpenAI responses with retrieved context
- Citations rendered as chips, clickable
- Conversations + messages persisted
- Unanswered detection (low retrieval similarity OR explicit "I don't know" response)

### Phase 4 — Secondary Ingestion (TASK-014 to TASK-015)
- PDF upload + text extraction
- Paste FAQ text
- These reuse Phase 2's chunking pipeline; should be small

### Phase 5 — Polish (TASK-016 to TASK-021)
- Analytics page (one chart, two cards)
- Settings + embed snippet generator
- Conversation history list + detail
- Landing page + Stripe pricing
- Demo video recorded

## Task Backlog

### EPIC-01: Foundation

#### TASK-001: Scaffold Next.js + Tailwind + shadcn
Initialize Next.js 15 App Router, TypeScript strict, Tailwind, shadcn/ui. Set up `app/`, `components/ui/`, `lib/`, `types/`. Add ESLint + Prettier.

#### TASK-002: Supabase project + auth
Create Supabase project. Wire email/password auth. Add `middleware.ts` for protected routes. Build login, signup, logout pages.

#### TASK-003: Database schema + RLS
Migrate the 8 tables above. Enable Row-Level Security on every table — users can only read/write rows where `user_id = auth.uid()` (directly or via `project_id` join). RLS is the primary defense against tenant leakage.

#### TASK-004: Deploy to Vercel
Connect repo, configure env vars (Supabase URL/anon key/service role, OpenAI, Stripe keys). Verify signup works in production before moving on.

### EPIC-02: The Hero Flow (URL → Chatbot)

#### TASK-005: Dashboard shell + project CRUD
Sidebar nav (Projects, Chat, Analytics, Settings). Project list, create, edit, delete. Empty state with "Paste a URL to get started" call-to-action.

#### TASK-006: URL crawler
Background job (Vercel cron + queue table, OR direct invocation if fast enough). Fetch the URL, extract `<a>` links scoped to same domain, BFS up to the page limit. Strip nav/footer/script tags. Save raw text to `sources`. Update `sources.status` as it progresses.

#### TASK-007: Live crawl progress UI
On the project page after URL submission, subscribe to `sources` row via Supabase Realtime. Show pages crawled / total, current URL, status. This is the demo's hero moment — it must feel responsive.

#### TASK-008: Chunking + embedding
Split `sources.content` into ~500-token chunks with 50-token overlap. Embed via OpenAI `text-embedding-3-small`. Insert into `chunks` with `project_id` denormalized.

#### TASK-009: Vector retrieval
Postgres function `match_chunks(query_embedding, project_id, match_count)` using pgvector cosine similarity. Always filters by `project_id`. Return top-5 chunks with similarity score.

### EPIC-03: Chat

#### TASK-010: Chat playground UI
Two-pane layout: chat on left, source preview on right. Message bubbles, streaming cursor, "Sources" section under each assistant message.

#### TASK-011: Streaming chat API
`/api/chat` route using OpenAI streaming. System prompt includes top-5 retrieved chunks with `[1]`, `[2]` markers. Instruct model to cite using those markers. Stream via SSE to the client.

#### TASK-012: Citations rendering
Parse `[N]` markers from streamed text, render as clickable chips under the message. Clicking a chip opens the source preview pane to the relevant chunk.

#### TASK-013: Conversation + unanswered persistence
Persist every message. Flag as `unanswered` when top retrieval similarity is below a threshold (e.g., 0.7) or when assistant output contains "I don't know" / "I'm not sure" patterns.

### EPIC-04: Secondary Ingestion

#### TASK-014: PDF upload
Supabase Storage bucket per project. Extract text with `pdf-parse` or `unpdf`. Reuse TASK-008 chunking pipeline.

#### TASK-015: Paste FAQ text
Textarea input. Save as a `sources` row with `type = 'text'`. Reuse chunking pipeline.

### EPIC-05: Polish

#### TASK-016: Analytics page
One chart (conversations per day, last 30 days) + two stat cards (total conversations, % unanswered). Empty state for new projects.

#### TASK-017: Conversation history
List view (most recent first) + detail view (all messages with citations). No search, no filter.

#### TASK-018: Settings + embed snippet
Form: name, brand color, greeting, fallback message. Generate an embed `<script src="...">` snippet that includes the project ID. (The widget script itself can be a stub — buyers care about seeing the snippet, not testing it.)

#### TASK-019: Landing page
Hero ("Train an AI support bot on your website in 30 seconds"), 3-feature row, demo GIF, pricing CTA. Lighthouse score 90+.

#### TASK-020: Stripe pricing
Free / Pro tiers. Stripe Checkout in test mode. Webhook (`/api/stripe/webhook`) updates `profiles.plan`. Use `stripe_events` table for idempotency.

#### TASK-021: Demo video
60–90s screen recording following the script in this document. Upload to Loom or YouTube unlisted, link in README and Upwork profile.

## README Requirements (for the GitHub repo)
- Live demo URL at the top
- Embedded demo GIF (10–15s loop of URL → chatbot)
- "What this demonstrates" bullet list keyed to Upwork search terms
- Architecture diagram (one image, not ASCII)
- `.env.example` with every required variable
- One-command local setup (`pnpm install && pnpm dev`)

## Done Definition
- Live URL works without errors for an anonymous visitor going through signup → URL crawl → chat
- Stripe Checkout in test mode produces a paid plan in the DB
- Demo video is recorded and linked in README
- Repo is public, README has the live URL, GIF, and architecture diagram
- A buyer landing on the GitHub repo can understand what it does in under 30 seconds without running it
