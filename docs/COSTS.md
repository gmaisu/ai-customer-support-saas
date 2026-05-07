# Costs

What this project actually costs to build, ship, and keep running. Spoiler: ~$10 one-time, $0/month ongoing for portfolio use.

## TL;DR

| Phase                                    | Out-of-pocket cost                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Building the project                     | **~$10** (OpenAI prepaid credit)                                                      |
| Keeping the live demo running, per month | **$0**                                                                                |
| Keeping it running if it goes viral      | See [If the demo gets unexpected traffic](#if-the-demo-gets-unexpected-traffic) below |

No subscriptions. No recurring fees. Free tiers cover everything else.

## Service-by-service breakdown

### OpenAI API — ~$10 one-time

**Important:** this is the OpenAI **API** (platform.openai.com), not ChatGPT Plus. They're different products:

|                         | ChatGPT Plus                   | OpenAI API                   |
| ----------------------- | ------------------------------ | ---------------------------- |
| What it is              | The chatbot at chat.openai.com | Programmatic access for apps |
| Billing                 | $20/month flat                 | Pay-per-use, prepaid credits |
| Needed for this project | ❌ No                          | ✅ Yes                       |

**What we use:**

- `gpt-4o-mini` — chat responses ($0.15 per 1M input tokens, $0.60 per 1M output tokens)
- `text-embedding-3-small` — embeddings ($0.02 per 1M tokens)

**Real costs at this project's scale:**

| Action                                    | Cost                        |
| ----------------------------------------- | --------------------------- |
| Embed a 50-page website crawl             | ~$0.01                      |
| One chat message (with retrieved context) | ~$0.0002                    |
| 100 chat messages during dev/testing      | ~$0.02                      |
| Recording the demo video (50 messages)    | ~$0.01                      |
| **Total to build + ship the project**     | **<$1 in actual API usage** |

The $10 prepaid credit is overkill — but worth it as a buffer. The remaining ~$9 sits there as a safety net.

**Hard limit setup (do this on day one):**

1. platform.openai.com → Settings → Limits
2. Set **monthly budget** to $20
3. Set **email alert** at $5 and $10
4. Save

If a bug ever loops API calls, the hard limit auto-shuts-off requests at $20 — you can't accidentally spend $500 in a runaway script.

### Vercel — $0/month

Hobby tier covers everything this project needs:

- 100 GB bandwidth/month (the demo would need ~5,000 visitors to exceed this)
- Serverless function execution: 100 GB-hours/month
- Up to 1,000,000 edge requests/month
- Free `*.vercel.app` subdomain

**Watch out:** Vercel's free tier has a **10-second function timeout**. If the URL crawler exceeds this, you have two options:

- Cap pages per crawl tighter (already at 50 in the brief)
- Upgrade to Pro ($20/month) for 60-second timeout

For the portfolio demo, the 50-page cap with the 10-second-per-page timeout means the function should finish in well under 10s for typical sites. If you hit issues, the brief specifies escalating to a queue (Inngest/Trigger.dev — both have free tiers) before paying for Vercel Pro.

### Supabase — $0/month

Free tier:

- 500 MB database (this project will use <50 MB)
- 1 GB storage (PDFs)
- 2 GB bandwidth
- 50,000 monthly active users
- Auth included
- pgvector extension included

**The one limit to watch:** the free tier **pauses your database after 7 days of inactivity**. For a portfolio demo nobody is hitting, this can be annoying. Two workarounds:

- Set up a cron-job.org free ping every 6 days to keep it warm
- Or upgrade to Pro ($25/month) only if you start getting Upwork buyers actively testing the demo

### Stripe — $0/month

Test mode is free forever. You only pay fees on **real** transactions, which this portfolio doesn't have.

- Test mode: $0
- Real transactions (if you ever flip to live): 2.9% + $0.30 per charge

For the portfolio, leave it in test mode. Buyers seeing test mode is fine — it's a portfolio, not a real product.

### Other services — all free

| Service          | Free tier covers                              |
| ---------------- | --------------------------------------------- |
| GitHub           | Public repos, unlimited                       |
| Sentry           | 5,000 errors/month — way more than this needs |
| Vercel Analytics | 2,500 events/month                            |
| Loom             | 25 videos, 5 min each                         |
| YouTube          | Unlimited unlisted videos                     |

## If the demo gets unexpected traffic

What happens if a buyer shares your demo with their network and traffic spikes? Worst-case caps:

- **Vercel:** Hobby tier hard-stops at limits — your demo just goes offline temporarily, no surprise bill
- **Supabase:** Same — service degrades but no overage charges
- **OpenAI:** Your $20/month hard limit kicks in. After that, API calls fail and the chat just shows an error
- **Stripe:** Test mode, irrelevant

**You cannot get a surprise bill larger than $20** as long as you set the OpenAI hard limit. Vercel and Supabase free tiers don't auto-upgrade — they just stop. That's the right behavior for a portfolio piece.

## Alternatives if you want to spend $0 even on OpenAI

Three options, ranked by Upwork portfolio value:

1. **Anthropic Claude API** — gives $5 free credits to new accounts, plenty for this project. Implementation is nearly identical (one swap of the API client). The brief locked OpenAI for keyword reasons, but Claude works identically. Cost: $0.
2. **OpenRouter** — pay-per-use across many models, sometimes cheaper. Has occasional free models. Cost: variable.
3. **Local Ollama** — free forever, runs on your laptop. **Not viable for a public demo** because the demo URL would need to call back to your machine. Skip this.

If $10 is genuinely a blocker, go with Claude API. Otherwise, OpenAI is worth it for the Upwork keyword match alone.

## Bottom line

- **One-time spend:** $10 OpenAI prepaid credit
- **Monthly recurring:** $0
- **Maximum possible monthly bill (with hard limits set):** $20
- **Realistic monthly bill:** <$1

Set the OpenAI hard limit on day one and you literally cannot get a surprise bill that matters.
