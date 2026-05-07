# Costs

What this project actually costs to build, ship, and keep running. Spoiler: **$0 to you, both during the build and forever after.**

## TL;DR

| Phase                                    | Out-of-pocket cost                        |
| ---------------------------------------- | ----------------------------------------- |
| Building the project                     | **$0**                                    |
| Keeping the live demo running, per month | **$0**                                    |
| AI usage (embeddings + chat)             | **Each user pays OpenAI directly** (BYOK) |

No subscriptions. No recurring fees. Free tiers cover infrastructure, and AI is BYOK.

## Why the cost is $0 — BYOK explained

Helpforge follows a **BYOK (Bring-Your-Own-Key)** model. Every user supplies their own OpenAI API key in the dashboard settings page. Helpforge:

- Uses that key to embed the user's sources and answer their chat messages
- Never proxies or stores OpenAI usage on the platform's account
- Never collects an AI-usage margin

Trade-off: a tiny bit of friction at signup ("paste your OpenAI key"). In return:

- You (the developer) pay $0 in API costs, ever
- No user can run up a bill on your account
- No rate-limit/abuse mitigation needed at the platform layer
- Real-world buyers recognize the pattern (it's how Cursor, ChatGPT clones, and most AI-tooling SaaS handle key management)
- Stripe billing can focus on real platform features (project caps, etc.) instead of usage metering

## Service-by-service breakdown

### OpenAI API — paid by each user

Users grab a key at https://platform.openai.com/api-keys, paste it into Account → API key, and the platform uses it on their behalf.

**Per-user costs at this app's scale:**

| Action                                         | Cost     |
| ---------------------------------------------- | -------- |
| Embed a 25-page website crawl                  | ~$0.005  |
| One chat message (with retrieved context)      | ~$0.0002 |
| Heavy daily use (200 messages, 5 fresh crawls) | ~$0.10   |

Most users will spend pennies a month. Helpforge will cap context size (top-5 chunks, `gpt-4o-mini` only) so even runaway use stays cheap.

### Vercel — $0/month

Hobby tier covers everything:

- 100 GB bandwidth/month
- 100 GB-hours serverless compute
- 10s function timeout (the crawl pipeline is hard-capped at 25 pages to fit)

Vercel's free tier hard-stops at limits — it never auto-bills. Worst case: site goes offline temporarily.

### Supabase — $0/month

Free tier:

- 500 MB database (this project will use <50 MB)
- 1 GB storage (PDFs, Phase 4)
- 2 GB bandwidth
- 50,000 monthly active users
- Auth + pgvector + Realtime included

Watch for: free DBs pause after 7 days of inactivity. Cron-job.org pings every 6 days keeps it warm.

### Stripe — $0/month

Test mode is free forever. Real transactions: 2.9% + $0.30 per charge (only matters once you flip to live, which a portfolio piece doesn't need).

### Other services — all free

| Service          | Free tier covers          |
| ---------------- | ------------------------- |
| GitHub           | Public repos, unlimited   |
| Sentry           | 5,000 errors/month        |
| Vercel Analytics | 2,500 events/month        |
| Loom             | 25 videos, 5 min each     |
| YouTube          | Unlimited unlisted videos |

## Bottom line for the developer

- **One-time spend:** $0
- **Monthly recurring:** $0
- **Maximum possible bill:** $0 (you have no API key on the line)
- **AI costs:** users' problem, paid by users to OpenAI directly

## Bottom line for users

A user with a Helpforge account spends:

- $0 in subscription fees during the portfolio MVP era (Pro tier mockup ships in Phase 6)
- ~$0.10 to test the full flow with a small site
- A few dollars/month if they actually use it for real
