# Development Tasks — Zero to Production

This document is the **execution plan** for [ai_customer_support_saas.md](ai_customer_support_saas.md). It expands the 21-task brief into a complete, ordered backlog that takes the project from empty directory to a live URL a buyer can click.

## How to use this document

- Tasks are ordered. Do not skip ahead — later tasks assume earlier ones are done.
- Each task has an estimate in **focused hours** (not calendar time). A focused hour = one Pomodoro of uninterrupted work. Realistic calendar pace is 3–4 focused hours per day.
- Each task has a **definition of done (DoD)**. A task isn't done until every DoD bullet is true. "It runs on my machine" is not a DoD.
- Phase boundaries are **deploy gates**: every phase ends with a working deployment to Vercel. Do not start phase N+1 until phase N's demo works on the live URL.

## Total estimate

~110 focused hours across 7 phases. At 3 focused hours/day, that's ~6 weeks calendar time. At 6 focused hours/day (full-time), ~3 weeks.

---

## Phase 0 — Pre-Development Setup (4h)

Get accounts, keys, and tooling lined up *before* writing code. Doing this mid-implementation kills momentum.

### TASK-000A: Account provisioning (1h)
Create accounts and capture credentials in a password manager:
- GitHub (repo will be public)
- Vercel (link to GitHub)
- Supabase (free tier — one project for dev, one for prod)
- OpenAI (add $10 credit, set $20 monthly hard limit)
- Stripe (test mode is enough for portfolio)
- Loom or YouTube (for the demo video later)

**DoD:** All credentials saved. Stripe test mode dashboard accessible. OpenAI usage limit confirmed visible in their dashboard.

### TASK-000B: Local toolchain (0.5h)
Verify Node 20+, pnpm, git, and a code editor with TypeScript support are installed and working.

**DoD:** `node -v`, `pnpm -v`, `git --version` all return expected versions.

### TASK-000C: Repository initialization (0.5h)
Create the GitHub repo (public), clone locally, add a `.gitignore` covering `node_modules`, `.env*`, `.next`, `.vercel`. Initial commit with just the two existing markdown files.

**DoD:** Repo is public on GitHub. `main` branch protected (no force push). `.env` patterns are gitignored.

### TASK-000D: Branding decisions (2h)
The product needs a name, a one-line tagline, a brand color, and a logo. Cheap, fast, good enough — don't overthink:
- Name: 1–2 words, `.com` not required (use the GitHub URL)
- Tagline: ≤10 words, leads with the differentiator ("Train an AI support bot on your website in 30 seconds")
- Color: pick one primary + one accent from a Tailwind palette
- Logo: a single letter or two-letter monogram in shadcn-style, no Figma needed

**DoD:** Name, tagline, color hex codes, and a 64×64 PNG logo committed to `/branding`.

---

## Phase 1 — Foundation (12h)

End state: anonymous visitor can sign up and log in on a live Vercel URL.

### TASK-101: Scaffold Next.js (1h)
`pnpm create next-app` with App Router, TypeScript strict, Tailwind, ESLint. Add Prettier with a single config (`.prettierrc`). Add `pnpm` lockfile to git.

**DoD:** `pnpm dev` starts on `localhost:3000` showing the default page. `pnpm build` succeeds. `pnpm lint` passes.

### TASK-102: shadcn/ui + design tokens (1h)
Initialize shadcn/ui. Add base components: `button`, `input`, `label`, `card`, `dialog`, `toast`, `dropdown-menu`. Set the brand color in `tailwind.config.ts` and `globals.css` CSS variables.

**DoD:** A throwaway `/test` route renders one of each component using brand colors.

### TASK-103: Project folder structure (0.5h)
Set up:
- `app/` — routes
- `components/ui/` — shadcn primitives
- `components/` — composed components
- `lib/` — utilities (`supabase.ts`, `openai.ts`, etc.)
- `lib/db/` — typed query helpers
- `types/` — shared TypeScript types

**DoD:** Empty folders exist with `.gitkeep` if needed. Path alias `@/*` works.

### TASK-104: Supabase project setup (1h)
Create dev Supabase project. Save URL, anon key, service role key in `.env.local`. Add `.env.example` documenting every required variable. Install `@supabase/supabase-js` and `@supabase/ssr`.

**DoD:** A throwaway server component can call `supabase.auth.getUser()` and return `null` without error.

### TASK-105: Database schema migration (2h)
Write SQL migration files in `supabase/migrations/` for the 8 tables defined in the brief. Use Supabase CLI (`supabase db push`) — do not click around in the dashboard. Schema lives in version control.

Tables: `profiles`, `projects`, `sources`, `chunks`, `conversations`, `messages`, `unanswered`, `stripe_events`. Include the `vector(1536)` column on `chunks`. Enable the `pgvector` extension in the migration.

**DoD:** Migration applies cleanly to a fresh database. All 8 tables exist with correct columns and foreign keys. `pgvector` extension is enabled.

### TASK-106: Row-Level Security policies (2h)
This is a security task — get it wrong and tenants see each other's data. Enable RLS on every table. Write policies:
- `profiles`: user can read/update own row
- `projects`: user can CRUD where `user_id = auth.uid()`
- `sources`, `chunks`, `conversations`, `messages`, `unanswered`: user can CRUD where the row's project belongs to them (via `project_id` join)
- `stripe_events`: service-role only

**DoD:** With RLS enabled, an authenticated user querying any table without filters returns only their own rows. A second test user cannot see the first user's projects. Test this manually with two browser sessions.

### TASK-107: Auth flow (2h)
Email/password signup, login, logout, password reset request. Use Supabase's `@supabase/ssr` for server-side session. Pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`. Form validation with `react-hook-form` + `zod`.

**DoD:** Sign up creates a `profiles` row (via trigger or post-signup callback). Login persists across page refresh. Logout clears the session. Password reset email arrives.

### TASK-108: Protected route middleware (1h)
`middleware.ts` redirects unauthenticated users hitting `/dashboard/*` to `/login`. Public routes: `/`, `/login`, `/signup`, `/pricing`, marketing pages.

**DoD:** Visiting `/dashboard` while logged out redirects to `/login`. Visiting it logged in renders the page. No flash of dashboard content before redirect.

### TASK-109: Vercel deployment (1.5h)
Connect the GitHub repo to Vercel. Add all env vars (Supabase URL, anon key, service role). Configure separate Supabase prod project — do not point production at dev DB. Set up a custom subdomain if you have one, otherwise use `*.vercel.app`.

**DoD:** Production URL renders the home page. Signup works in production. Confirmation email arrives from the prod Supabase project.

### TASK-110: Phase 1 smoke test (1h)
Manually walk through: visit prod URL → sign up → confirm email → log in → see empty dashboard placeholder → log out. Fix any rough edges. Take a screenshot — this is your first piece of portfolio evidence.

**DoD:** Smoke test passes end-to-end on production. README has the live URL.

---

## Phase 2 — The Hero Flow: URL → Chunks (24h)

The most important phase. End state: paste a URL, watch a live progress bar, end up with searchable chunks in the database.

### TASK-201: Dashboard shell (2h)
Sidebar nav (Projects, Chat, Analytics, Settings), top bar with user menu (logout). Use shadcn's sidebar pattern. Responsive: collapses to icons under 768px.

**DoD:** Logged-in user sees a clean dashboard layout. Sidebar links route correctly (even if pages are empty placeholders).

### TASK-202: Project list page (1.5h)
`/dashboard/projects` shows the user's projects as cards (name, brand color, source count, last updated). Empty state: large CTA "Create your first project."

**DoD:** Projects render from DB. Empty state shows for new users. Clicking a project routes to its detail page.

### TASK-203: Create project flow (2h)
Modal or `/dashboard/projects/new` page with one field: name. On submit, insert a `projects` row, redirect to the project's detail page.

**DoD:** New project appears in the list immediately. Validation prevents empty names. Failed inserts show a toast error.

### TASK-204: Project detail page skeleton (1h)
`/dashboard/projects/[id]` with tabs: Sources, Chat, Conversations, Settings. Sources tab is the default and is what we'll build next.

**DoD:** Tabs render. URL deep-links to specific tabs (`?tab=chat`).

### TASK-205: URL ingestion form (1h)
On the Sources tab, an input field + "Crawl" button. Validate that the input is a valid URL. On submit, create a `sources` row with `type='url'`, `status='pending'`, `source_url=<input>`.

**DoD:** Submitting a URL creates a row. The Sources list below the form shows the new row immediately with status "pending."

### TASK-206: Crawler — single page fetch (2h)
A function `fetchPage(url)` that:
- Respects `robots.txt` (use `robots-parser` package)
- 10-second timeout
- Strips `<script>`, `<style>`, `<nav>`, `<footer>` tags
- Returns clean text + the page's outbound same-domain links

**DoD:** Function returns text and links for a real-world site (e.g., the Stripe docs homepage). Returns clean error for `robots.txt`-blocked URLs and timeouts.

### TASK-207: Crawler — BFS over domain (3h)
A function `crawlSite(rootUrl, maxPages)` that BFS-crawls same-domain links up to the limit. Deduplicate URLs. Skip non-HTML responses. Save each page's text into the `sources.content` field as concatenated chunks separated by URL markers.

**DoD:** Crawling a 20-page site yields ~20 entries of clean text. Crawling a 1000-page site stops at the cap. Cycles don't cause infinite loops.

### TASK-208: Crawl orchestration via API route (2h)
`POST /api/sources/[id]/crawl` triggers the crawl. Updates `sources.status` through `crawling` → `chunking` → `embedding` → `ready` (or `failed` with error message). Runs as a Vercel function — keep within the 60s timeout for now (free tier hobby plan = 10s, Pro = 60s; document which one is required).

**DoD:** Hitting the endpoint runs an end-to-end crawl on a small site. `sources.status` transitions correctly. Failures set status to `failed` with a useful error.

### TASK-209: Live progress UI via Supabase Realtime (3h)
Client subscribes to the `sources` row. Shows a progress card: current status, pages crawled, current URL, elapsed time. Animated cleanly — this is the demo's hero moment.

**DoD:** Submitting a URL shows live updates without refresh. Status transitions are visually distinct. Final "Ready" state has a checkmark and feels rewarding.

### TASK-210: Chunking pipeline (2h)
After crawl completes, split text into ~500-token chunks with 50-token overlap. Use a tokenizer (`gpt-tokenizer` or similar). Insert into `chunks` with `source_id`, denormalized `project_id`, `content`, `token_count`. Don't embed yet.

**DoD:** A 10-page crawl produces dozens of chunks. Chunks have correct token counts. Overlap is visible by inspection.

### TASK-211: Embedding pipeline (2h)
For each chunk, call OpenAI `text-embedding-3-small`. Batch up to 100 chunks per request. Store the returned vector in `chunks.embedding`. Mark `sources.status='ready'` when done.

**DoD:** Embeddings populate for all chunks. Cost stays under $0.10 for a 50-page site. Failed embedding requests retry once before failing the source.

### TASK-212: Vector retrieval function (1.5h)
Postgres function `match_chunks(query_embedding vector, target_project_id uuid, match_count int)` returning top chunks by cosine similarity, **always filtered by `project_id`**. Add an HNSW index on `chunks.embedding`.

**DoD:** Calling `match_chunks` from a Node script returns relevant chunks for a test query. Query latency under 200ms for 1000-chunk projects. Cross-project leakage manually verified impossible.

### TASK-213: Sources list with delete (1h)
On the Sources tab, list all sources for the project with status badges. Delete button on each. Deleting cascades to `chunks`.

**DoD:** Delete button removes the source and its chunks. Deletion is confirmed via dialog. List updates without refresh.

### TASK-214: Phase 2 deploy + smoke test (2h)
Deploy. Walk through: log in → new project → paste a real URL → watch progress → see chunks in DB. Take a screen recording — this becomes part of the demo video.

**DoD:** Hero flow works end-to-end on production with a real website. Recording captured.

---

## Phase 3 — Chat (18h)

End state: streaming chat with citations on top of the chunks from Phase 2.

### TASK-301: Chat playground UI (2h)
Two-pane layout on the Chat tab: messages on left (~70%), source preview on right (~30%, collapsible on mobile). Message bubbles, input at bottom, send button. shadcn-style.

**DoD:** Static UI renders cleanly. Submitting input adds a user message bubble locally (no backend yet). Source preview pane is empty.

### TASK-302: System prompt design (1h)
Write the system prompt in `lib/prompts.ts`. It should:
- Define the AI's role ("support assistant for {project_name}")
- Inject retrieved chunks numbered `[1]`, `[2]`, etc.
- Instruct citations using `[N]` markers
- Define fallback behavior when context is insufficient ("I don't have information about that — try rephrasing or contact support")

**DoD:** Prompt template renders correctly with placeholder data. Documented inline why each section exists.

### TASK-303: Streaming chat API route (3h)
`POST /api/chat` — accepts `{ project_id, conversation_id?, message }`. Embeds the user message, retrieves top-5 chunks, builds the prompt, streams OpenAI response via SSE. Creates `conversations` row if `conversation_id` is null.

**DoD:** Hitting the endpoint with `curl` streams tokens. Retrieved chunks include `[N]` markers in the prompt. New conversations get persisted.

### TASK-304: Client-side streaming (2h)
Use the AI SDK (`ai` package from Vercel) or hand-roll SSE parsing. Append tokens to the assistant message bubble as they arrive. Show a blinking cursor during streaming.

**DoD:** Sending a message produces a streamed answer in the UI. Cursor blinks. Stream cancellation works (e.g., navigating away).

### TASK-305: Citation parsing + chips (2.5h)
After the assistant message finishes streaming, scan for `[N]` markers. Render them as numbered chips below the message. Each chip maps to a chunk. Clicking a chip opens the source preview pane and highlights the chunk's content.

**DoD:** Citations render as clickable chips. Clicking [1] shows chunk 1's text and source URL/PDF in the preview pane. Multiple chips on one message all work.

### TASK-306: Message persistence (1.5h)
Each user + assistant message gets a `messages` row with `conversation_id`, `role`, `content`, `citations` (jsonb array of chunk_ids), `confidence` (top similarity score from retrieval).

**DoD:** Sending a message persists both user and assistant rows. Citations field is populated. Confidence reflects the top chunk's similarity.

### TASK-307: Conversation continuity (1.5h)
After the first message, subsequent messages in the same playground session reuse the `conversation_id`. Pass the last 6 messages as conversation history in the prompt (separate from retrieved chunks).

**DoD:** Multi-turn conversations work — the AI remembers prior messages within a session. New chat button starts a fresh conversation.

### TASK-308: Unanswered detection (1.5h)
After each assistant response, mark the question as `unanswered` in the DB if:
- Top retrieval similarity < 0.7, OR
- Response matches "I don't know" / "I'm not sure" / "I don't have information" patterns

**DoD:** Asking an off-topic question creates an `unanswered` row. Asking an in-context question does not. Threshold is configurable in one place.

### TASK-309: Rate limiting middleware (2h)
Daily message limit per user: 50 free / 500 pro. Enforce in `/api/chat`. Track in `profiles.daily_message_count` with a daily reset (use a cron or compute from `messages` table). Return 429 with a clean error when exceeded.

**DoD:** Sending the 51st message as a free user returns 429. Counter resets after midnight UTC. Pro users hit 500 before being limited.

### TASK-310: Phase 3 deploy + smoke test (1h)
Deploy. Test: create project → crawl URL → ask 3 questions → see citations → check conversation in DB. Capture the chat experience for the demo video.

**DoD:** Chat works end-to-end on production. Streaming is smooth. Citations are clickable. Recording captured.

---

## Phase 4 — Secondary Ingestion (8h)

End state: PDF upload and FAQ paste both work, reusing Phase 2's pipeline.

### TASK-401: Supabase Storage setup (1h)
Create a `pdfs` bucket. Configure RLS so users can only upload/read files in their own `project_id` folder. Document the bucket structure: `pdfs/{project_id}/{source_id}.pdf`.

**DoD:** A test upload via the Supabase dashboard succeeds. RLS prevents cross-tenant reads.

### TASK-402: PDF upload UI (2h)
Drag-and-drop zone on the Sources tab. Validate file type (PDF only) and size (<10 MB). Upload to Supabase Storage. Create a `sources` row with `type='pdf'` and the storage path.

**DoD:** Dragging a PDF uploads it. Progress bar visible. Source appears in list with `pending` status.

### TASK-403: PDF text extraction (2h)
Server-side route `POST /api/sources/[id]/extract-pdf` downloads the PDF from Storage, extracts text with `unpdf` or `pdf-parse`, then triggers the same chunking + embedding pipeline as TASK-210/211.

**DoD:** PDF upload produces chunks in the DB. A multi-page PDF preserves page boundaries (or at least doesn't lose content). Source status reaches `ready`.

### TASK-404: Paste FAQ text UI (1.5h)
A third option on the Sources tab: a textarea + title field. On submit, save as a `sources` row with `type='text'` and run the chunking pipeline directly (no extraction step).

**DoD:** Pasted text becomes searchable chunks. Empty submissions are blocked.

### TASK-405: Source type badges + previews (1h)
List view shows different icons/badges per source type (URL, PDF, text). Clicking a source shows a preview modal: first 500 chars + link to original (URL or storage download).

**DoD:** Visual differentiation is clear. Preview modal opens without breaking layout.

### TASK-406: Phase 4 smoke test (0.5h)
Test all three ingestion paths produce chunks that the chat retrieves correctly.

**DoD:** Chat answers questions sourced from URL, PDF, and pasted text in a single project.

---

## Phase 5 — Analytics, History, Settings (12h)

End state: every dashboard page has real content. Demo-ready.

### TASK-501: Analytics page (3h)
`/dashboard/projects/[id]?tab=analytics`:
- Two stat cards: total conversations, % unanswered (last 30 days)
- One line chart: conversations per day, last 30 days (use `recharts` or `tremor`)
- Empty state for projects with zero conversations

**DoD:** Numbers match what's in the DB. Chart renders. Empty state is not ugly.

### TASK-502: Top unanswered questions list (1.5h)
Below the chart, a list of the 10 most recent unanswered questions with timestamp and conversation link. Useful and impressive in the demo.

**DoD:** List populates from `unanswered` table. Clicking an item opens the conversation.

### TASK-503: Conversation history list (2h)
`/dashboard/projects/[id]?tab=conversations` — list of conversations (most recent first). Each row: started_at, message count, first user message preview.

**DoD:** List paginates (20 per page). Clicking a row routes to the conversation detail.

### TASK-504: Conversation detail view (2h)
`/dashboard/conversations/[id]` — full message thread with citations. Reuse the chat UI components for consistency. Read-only (no input).

**DoD:** All messages render in order. Citations work. Cannot send new messages from this view.

### TASK-505: Project settings page (2h)
`/dashboard/projects/[id]?tab=settings`:
- Name, brand color (color picker), greeting message, fallback message
- Save button with optimistic update + toast
- Danger zone: delete project (with confirmation)

**DoD:** Edits persist. Brand color changes are reflected in the chat UI immediately. Delete cascades correctly.

### TASK-506: Embed snippet generator (1.5h)
On the settings page, a code block showing:
```html
<script src="https://yourdomain.com/widget.js" data-project="{project_id}"></script>
```
Copy button. Note: per the brief, the actual `widget.js` file can be a stub — buyers want to see the snippet, not test it.

**DoD:** Copy button works. Snippet shows the correct project ID. A stub `widget.js` exists at `/public/widget.js` (can be empty or log "loaded").

---

## Phase 6 — Marketing + Billing (16h)

End state: landing page that sells the product, real Stripe Checkout, ready to demo to anyone.

### TASK-601: Landing page hero (3h)
`/` (replace the default Next.js page):
- Hero: headline (the tagline), subheadline, primary CTA "Start Free," secondary CTA "Watch Demo"
- Social proof placeholder (logos or "Built for X-type businesses")
- Demo GIF or video embed (will be filled in Phase 7)

**DoD:** Hero looks polished. CTAs route correctly. Mobile responsive. Lighthouse Performance ≥ 90.

### TASK-602: Landing page features section (2h)
Three-column features row showing: URL crawling, citations, embeddable widget. Icons + 1-line descriptions. Below it, a longer feature breakdown with screenshots from the actual app.

**DoD:** Features section uses real screenshots, not placeholder graphics. Copy is tight (no marketing fluff).

### TASK-603: Pricing page (2h)
`/pricing` — two tiers (Free, Pro). Clear feature comparison. Pro CTA opens Stripe Checkout.

**DoD:** Pricing page renders. Pro CTA triggers Stripe Checkout in test mode (TASK-605 will wire up the actual integration).

### TASK-604: Stripe products + prices (1h)
In the Stripe dashboard, create one product ("AI Support Pro") with one recurring price ($29/month). Save the price ID in env vars.

**DoD:** Price ID accessible via `process.env.STRIPE_PRO_PRICE_ID`.

### TASK-605: Checkout integration (3h)
`POST /api/stripe/checkout` creates a Checkout session for the logged-in user (with `client_reference_id = user_id`). Returns URL. Pricing page CTA hits this endpoint and redirects.

**DoD:** Clicking Pro CTA redirects to Stripe Checkout. Test card (`4242 4242 4242 4242`) completes payment. Stripe dashboard shows the test transaction.

### TASK-606: Stripe webhook handler (3h)
`POST /api/stripe/webhook` — verifies signature, handles `checkout.session.completed` and `customer.subscription.deleted`. Updates `profiles.plan`. Idempotency via `stripe_events` table — never process the same event ID twice.

**DoD:** Completing checkout flips the user's plan to `pro` in the DB within 5 seconds. Replaying a webhook event doesn't double-process. Signature verification rejects forged requests.

### TASK-607: Plan-aware feature gating (1.5h)
Free vs. Pro differences enforced server-side:
- Free: 1 project, 50 messages/day, 50 pages/crawl
- Pro: 5 projects, 500 messages/day, 500 pages/crawl

Show plan badge in the dashboard. Upgrade CTA when limits hit.

**DoD:** Free user trying to create a 2nd project sees an upgrade prompt. After upgrading via Stripe, the limit increases without logout.

### TASK-608: Customer portal (0.5h)
`POST /api/stripe/portal` creates a Stripe Customer Portal session. Add a "Manage subscription" link in the user menu for Pro users.

**DoD:** Pro users can cancel/update their subscription via the portal. Cancellation triggers the webhook and updates `profiles.plan`.

---

## Phase 7 — Production Polish (16h)

The gap between "feature complete" and "buyer can click without breaking" is bigger than it looks.

### TASK-701: Error boundaries + toast system (2h)
Global error boundary in `app/error.tsx`. Toast notifications wired up (already from shadcn). Replace every `alert()` and silent failure with toasts. Errors include actionable next steps where possible.

**DoD:** Triggering a deliberate error (e.g., bad project ID) shows a clean error UI with a "back to dashboard" button. No white screens. No raw error strings shown to users.

### TASK-702: Loading states (1.5h)
Audit every async operation for a loading state. Skeleton screens for lists, spinners for buttons, progress bars for crawls. Use `loading.tsx` files in App Router.

**DoD:** No page renders blank during data fetch. No buttons stay clickable while a request is in flight.

### TASK-703: Empty states (1h)
Every list/chart has an empty state with: an icon, a one-line explanation, and a CTA to populate it. No empty cards.

**DoD:** Audit checklist of every list view shows a designed empty state.

### TASK-704: Mobile responsiveness pass (2h)
Walk through every page at 375px width. Fix overflows, broken nav, unreadable text. Sidebar should collapse to a drawer on mobile.

**DoD:** Every page passes a manual mobile review on a real phone (not just devtools).

### TASK-705: Accessibility audit (1.5h)
Run axe DevTools on every page. Fix critical issues: missing labels, contrast failures, keyboard traps, missing focus indicators. Aim for zero critical violations.

**DoD:** Axe reports zero serious/critical violations on the main flows (login, dashboard, chat).

### TASK-706: SEO + Open Graph (1h)
`metadata` exports on every public page (title, description). OG image for the landing page (a Vercel OG-generated image is fine). `sitemap.xml` and `robots.txt`.

**DoD:** Sharing the landing page URL on Slack/Twitter shows a proper preview card. Lighthouse SEO ≥ 95.

### TASK-707: Observability (2h)
- Vercel Analytics (free, one-line install)
- Sentry for error tracking (free tier)
- A simple `/api/health` endpoint for uptime monitoring

**DoD:** Triggering an error in prod shows up in Sentry within 1 minute. Vercel Analytics tracks page views.

### TASK-708: Cost guards (1.5h)
- Hard-cap on tokens per chat request (e.g., 4000 input tokens max)
- Cap embedding requests per crawl
- Log cumulative OpenAI cost per user per day in a simple admin view (or just a query you can run)

**DoD:** A malicious user pasting a 1000-page site cannot run up a $100 OpenAI bill. Limits documented in code comments.

### TASK-709: Security review (2h)
Manual checklist:
- All API routes verify the session before any DB call
- All DB queries that take a `project_id` verify ownership
- No service-role key in client bundles (`grep` the build output)
- CORS configured (default Next.js behavior is fine — verify)
- Rate limit on `/api/chat`, `/api/sources/*/crawl`, `/api/stripe/checkout`
- CSP header (use `next-safe-middleware` or hand-roll)
- Webhook signature verification confirmed

**DoD:** Every item on the checklist is ticked with a code reference. One deliberate attempt to access another user's project via crafted requests is blocked.

### TASK-710: README polish (1.5h)
- Live demo URL at the top
- Demo GIF (10–15s loop) — embedded with a Loom or YouTube link as fallback
- "What this demonstrates" — bullet list keyed to Upwork search terms
- Architecture diagram (Excalidraw or similar, exported as PNG)
- Tech stack badges
- `.env.example` complete
- Local setup: `pnpm install && pnpm dev`
- Screenshots gallery (5–6 images)

**DoD:** A buyer landing on the GitHub repo understands what the project does in under 30 seconds without running it.

---

## Phase 8 — Demo + Launch (8h)

The work isn't done until someone clicks the link.

### TASK-801: Seed data for the demo (1.5h)
Create a demo account on production with a pre-seeded project (e.g., crawled the Stripe docs). Demo URL goes in the README. Buyers can log in with provided credentials and see a working product without signing up.

**DoD:** `demo@<yourdomain>.com` / fixed password works in production. Has a project with chunks, conversations, and unanswered questions populated.

### TASK-802: Demo video recording (3h)
Follow the script in [ai_customer_support_saas.md](ai_customer_support_saas.md). Record in 1080p. Multiple takes — pick the best. Edit out dead time. Upload to Loom/YouTube unlisted.

**DoD:** Final video is 60–90s. Captures the URL crawl, chat with citations, analytics, and embed snippet. Linked in README and pinned on the GitHub repo.

### TASK-803: Demo GIF for the README (1h)
Extract the most impressive 10–15 seconds of the video as a GIF (URL → progress bar → working chat). Optimize file size to <5 MB. Embed in README.

**DoD:** GIF loads quickly on GitHub. Plays smoothly. Tells the story without sound.

### TASK-804: Upwork profile updates (1h)
Add the project as a portfolio item:
- Link to live demo
- Link to GitHub
- Link to demo video
- Project description (use the case study text from the brief)
- Skills tagged: Next.js, OpenAI, RAG, Supabase, TypeScript, Stripe

**DoD:** Project visible on Upwork profile. All links work.

### TASK-805: Final QA pass (1.5h)
Have a friend (or yourself in incognito) walk through the entire flow on a fresh device. Note every friction point. Fix the top 3.

**DoD:** Friend can complete signup → URL crawl → chat → see citations without asking for help. Top 3 friction points fixed.

---

## Risk register

Things that have killed similar portfolio projects before. Watch for them.

| Risk | Mitigation |
|------|------------|
| Vercel function timeout on large crawls | Cap pages per crawl. If 60s isn't enough, defer to a queue (Inngest/Trigger.dev) — but only if it actually breaks. |
| OpenAI bill spirals during testing | Hard limits set in OpenAI dashboard from day 1. `gpt-4o-mini` only. Personal usage cap of $20/month. |
| RLS policy bug leaks tenant data | TASK-106 manual two-user test. TASK-709 includes a deliberate attack attempt. |
| Crawler hits a JS-rendered SPA and gets nothing | Document the limitation in the README. Show the brief mentions Firecrawl/Browserless as the escalation path. Don't pre-build it. |
| Streaming feels janky in production | Test from a 4G hotspot, not just localhost. |
| Demo account gets abused | Rate limit it like a free user. Reset its data nightly via a cron. |
| Project becomes too big and never ships | Phase boundaries are deploy gates. If a phase takes 2x its estimate, cut scope, don't extend. |

## What success looks like

- Live URL works for an anonymous visitor going through signup → URL crawl → chat → citations without errors
- Stripe Checkout in test mode produces a paid plan in the DB
- Demo video is recorded and linked in README
- Repo is public with: live URL, GIF, architecture diagram
- Project listed on Upwork profile with all three links (live, repo, video)
- A buyer landing on the GitHub repo understands what it does in under 30 seconds
