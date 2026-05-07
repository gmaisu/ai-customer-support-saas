# Demo + Launch playbook

What to do once the product is feature-complete to actually convert it into Upwork inbound. Phase 8 of [TASKS.md](TASKS.md).

## Demo account (TASK-801) — done

Public credentials for browsing the dashboard with populated data:

```
Email:    demo@helpforge.dev
Password: helpforge-demo-2026
```

Re-seed anytime via `node scripts/seed-demo.mjs`. The script wipes the existing demo user (cascading delete) and recreates everything. Idempotent.

What the demo shows:

- 1 project (Stripe Docs, violet brand color)
- 1 source — `docs.stripe.com`, status=ready, 18 pages, 84k chars
- 5 chunks (no embeddings — chat needs the buyer's own OpenAI key)
- 6 conversations spread across the last 30 days, with realistic citations
- 3 unanswered questions logged (drives the analytics list)

Buyers can browse Sources, Chat history, Analytics, and Settings. Live chat is gated behind BYOK so they sign up themselves to test the streaming flow. That's actually a feature: it forces them to experience the signup → key → first crawl flow first-hand.

## Demo video script (TASK-802)

60–90s. Record at 1080p with no system audio, voice-over optional. Tools: Loom, OBS, or Vercel Studio.

**Opening shot (0:00–0:05):**

- Browser at `helpforge.vercel.app`
- Voiceover/caption: "Helpforge — forge an AI support bot from your website in 30 seconds"

**Sign up (0:05–0:15):**

- Click **Start free**
- Use a fresh email + password (or use the demo creds)
- Land on empty dashboard
- Caption: "No credit card. BYOK so the platform never charges for AI."

**Add OpenAI key (0:15–0:25):**

- Click **Account** in sidebar
- Paste OpenAI key, save
- Caption: "Your key. You pay OpenAI directly."

**Create project + crawl (0:25–0:50):**

- Click **Projects** → **Create your first project** → name it "Stripe Docs"
- On Sources tab, paste `https://docs.stripe.com`
- Click **Crawl site**
- Watch the status badge transition: Pending → Crawling → Chunking → Embedding → Ready
- Show the source row with "18 pages · 84,213 chars"
- Caption: "Real-time crawl progress over Supabase Realtime"

**Chat (0:50–1:15):**

- Click **Chat** tab
- Type: "How do I create a Checkout session?"
- Show streaming tokens
- Show citation chips appearing under the answer
- Click a chip — opens the Stripe docs page in new tab
- Caption: "Cited, grounded answers. Click to verify."

**Analytics + history (1:15–1:30):**

- Click **Analytics** tab
- Show conversations chart + unanswered list
- Click an unanswered question → lands on conversation detail
- Caption: "Built-in analytics + conversation history"

**Embed snippet (1:30–1:35):** _(optional, cut if over time)_

- Click **Settings** tab
- Show the embed snippet, copy button
- Caption: "Drop one script tag into any HTML page"

**Closing card (1:35–1:40):**

- "github.com/gmaisu/ai-customer-support-saas"
- "helpforge.vercel.app"

**Production tips:**

- Pre-record the crawl on the demo account so it's already cached and fast
- Use a fast site like docs.stripe.com (fast servers, well-formed HTML)
- Don't speed up the crawl progress — the live update IS the demo
- Skip slow transitions, no fancy zooms; let the product carry it

## Demo GIF for the README (TASK-803)

Extract the 10–15 most impressive seconds of the video for the README hero. Recommended clip:

> 0:32 (paste URL) → 0:48 (status hits Ready)

Tools: ffmpeg, ezgif, Cleanshot, ScreenToGif. Target file size <5 MB so GitHub doesn't downsample it.

ffmpeg command (replace timestamps + paths):

```sh
ffmpeg -i input.mp4 -ss 00:00:32 -to 00:00:48 \
  -vf "fps=15,scale=900:-1:flags=lanczos" \
  -c:v gif demo.gif
```

Then embed at the top of the README:

```markdown
![Helpforge demo: paste URL, watch the crawl, see chunks ready](demo.gif)
```

## Upwork profile updates (TASK-804)

### Project listing copy

**Title:** AI Customer Support SaaS — Next.js + Supabase + OpenAI RAG

**Skills tagged:** Next.js, TypeScript, OpenAI API, RAG (Retrieval-Augmented Generation), Vercel AI SDK, Supabase, PostgreSQL, pgvector, Stripe, Tailwind CSS, full-stack development.

**Description:**

> Built a full-stack AI customer support SaaS. Users paste a website URL, my crawler grabs up to 100 pages, chunks the text, embeds with OpenAI, and serves grounded chat responses with inline source citations.
>
> Tech: Next.js 16 App Router, Supabase (Postgres + pgvector + RLS + Realtime), OpenAI gpt-4o-mini, Vercel AI SDK v6 streaming, Stripe Checkout in test mode, BYOK architecture so users supply their own API keys.
>
> Built solo across phases — foundation, RAG pipeline, streaming chat, analytics, billing, production polish — with each phase ending in a Vercel deploy gate. Live demo + open source code linked below.

**Links to attach (in this order):**

1. **Live demo:** https://helpforge.vercel.app (with demo credentials prominently shown on the landing page)
2. **GitHub:** https://github.com/gmaisu/ai-customer-support-saas
3. **Demo video:** Loom or YouTube unlisted link from TASK-802
4. **Architecture:** Link to the README's architecture section

### Cover letter angle

Buyers searching for "OpenAI developer," "AI chatbot developer," "Next.js full-stack," "Supabase developer," "RAG developer" — your profile should match those terms verbatim. Use this project as proof, not as a pitch.

When applying:

- Lead with: "Built this exact thing for a portfolio: helpforge.vercel.app"
- Don't pitch the tech — let the live URL pitch itself
- Highlight one or two specifics that match the buyer's brief (e.g., if they mention citations, talk about the citation chip implementation)

## Final QA pass (TASK-805)

Walk through the live URL in incognito + on mobile. Note every friction point. Fix the top 3.

Checklist:

- [ ] Sign up flow works end-to-end without errors (try with a fresh email)
- [ ] OpenAI key save → crawl → chat all work in <2 minutes from signup
- [ ] Demo account login works on the credentials shown on the landing page
- [ ] Citation chips link to the right URLs
- [ ] Stripe Checkout completes with test card 4242 → plan flips to Pro
- [ ] Customer Portal opens for Pro users
- [ ] Mobile: home page, signup, dashboard sidebar collapses cleanly under 768px
- [ ] Lighthouse: home page Performance ≥ 90, SEO ≥ 95, Accessibility ≥ 90
- [ ] OG card: paste the URL into Slack/Twitter, see preview
- [ ] 404 page renders for `/anything-not-real`
- [ ] Error boundary catches a forced error (open devtools, throw inside a server component)
