/**
 * Seed the demo account so buyers can log in and see a populated dashboard
 * without having to sign up themselves.
 *
 * The demo account has NO OpenAI key — chat is gated behind BYOK and we don't
 * want demo viewers burning my key. Pre-seeded data covers everything they
 * need to see: projects, sources (status=ready), conversations with realistic
 * messages + citations, unanswered questions, populated analytics.
 *
 * Idempotent: re-running deletes the existing demo user (which cascades to
 * everything they own via FK) and recreates from scratch.
 *
 * Usage: node scripts/seed-demo.mjs
 *
 * Credentials are intentionally hardcoded — they're the public demo login.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx), l.slice(idx + 1)];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "demo@helpforge.dev";
const DEMO_PASSWORD = "helpforge-demo-2026";
const STRIPE_DOCS_URL = "https://docs.stripe.com";

async function clearExisting() {
  console.log(`→ Clearing any existing demo user (${DEMO_EMAIL})...`);
  // Find user by email (admin.listUsers + filter — no direct getByEmail in v1)
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw new Error(`listUsers failed: ${error.message}`);
  const existing = data.users.find((u) => u.email === DEMO_EMAIL);
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id);
    console.log("  Deleted existing demo user (cascades to projects/sources/etc).");
  } else {
    console.log("  No existing demo user.");
  }
}

async function createDemoUser() {
  console.log(`\n→ Creating demo user...`);
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser failed: ${error.message}`);
  console.log(`  user_id: ${data.user.id}`);
  return data.user.id;
}

async function seedProject(userId) {
  console.log(`\n→ Creating "Stripe Docs" demo project...`);
  const { data: project, error } = await admin
    .from("projects")
    .insert({
      user_id: userId,
      name: "Stripe Docs (demo)",
      brand_color: "#635BFF", // Stripe purple
      greeting: "Hi! I'm trained on the Stripe docs. Ask me anything about payments.",
      fallback_message:
        "I couldn't find that in the Stripe docs. Try rephrasing, or check stripe.com/docs directly.",
    })
    .select()
    .single();
  if (error) throw new Error(`project insert failed: ${error.message}`);
  console.log(`  project_id: ${project.id}`);
  return project;
}

async function seedSource(project) {
  console.log(`\n→ Creating "ready" source row...`);
  const { data: source, error } = await admin
    .from("sources")
    .insert({
      project_id: project.id,
      type: "url",
      source_url: STRIPE_DOCS_URL,
      title: "docs.stripe.com",
      status: "ready",
      pages_crawled: 18,
      char_count: 84_213,
    })
    .select()
    .single();
  if (error) throw new Error(`source insert failed: ${error.message}`);
  console.log(`  source_id: ${source.id}`);
  return source;
}

async function seedChunks(source, project) {
  console.log(`\n→ Inserting demo chunks (no embeddings — chat is gated by BYOK anyway)...`);

  const chunkData = [
    {
      content:
        "Stripe Checkout is a prebuilt, hosted payment page that lets you collect payments quickly. It supports one-time payments, subscriptions, and complex flows like multi-currency, taxes, and discounts. You create a Checkout session via the API and redirect the customer to the returned URL.",
      url: "https://docs.stripe.com/payments/checkout",
      title: "Checkout",
    },
    {
      content:
        "Webhooks are HTTP callbacks Stripe sends to your server when events happen. To handle a webhook, expose an endpoint, verify the signature using your webhook signing secret, and process the event. Always return 200 quickly — long-running work belongs in a queue.",
      url: "https://docs.stripe.com/webhooks",
      title: "Webhooks",
    },
    {
      content:
        "Test cards let you simulate payment scenarios in test mode. Use 4242 4242 4242 4242 for successful payments. 4000 0000 0000 0002 simulates a generic decline. 4000 0000 0000 9995 simulates insufficient funds. All test cards accept any future expiry, any CVC, and any postal code.",
      url: "https://docs.stripe.com/testing",
      title: "Testing",
    },
    {
      content:
        "Subscriptions in Stripe model recurring billing. A Subscription has a Price (the product + amount + interval), a Customer, and a status (active, trialing, past_due, canceled, etc.). Use the customer.subscription.* webhooks to keep your application state in sync.",
      url: "https://docs.stripe.com/billing/subscriptions",
      title: "Subscriptions",
    },
    {
      content:
        "The Customer Portal is a Stripe-hosted page where customers can manage their subscriptions: update payment methods, view invoices, cancel, or change plans. Create a portal session via the API and redirect the customer to it. No code needed for the portal itself.",
      url: "https://docs.stripe.com/customer-management",
      title: "Customer Portal",
    },
  ];

  const rows = chunkData.map((c, i) => ({
    source_id: source.id,
    project_id: project.id,
    content: c.content,
    embedding: null, // BYOK — demo can't embed without my key. Read-only chat.
    token_count: Math.ceil(c.content.length / 4),
    chunk_index: i,
    metadata: { sourceUrl: c.url, title: c.title },
  }));

  const { data, error } = await admin.from("chunks").insert(rows).select();
  if (error) throw new Error(`chunks insert failed: ${error.message}`);
  console.log(`  Inserted ${data.length} chunks.`);
  return data;
}

async function seedConversations(project, chunks) {
  console.log(`\n→ Creating sample conversations + messages...`);

  // Build conversations spread across the last 30 days for analytics chart.
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const conversations = [
    {
      daysAgo: 1,
      messages: [
        { role: "user", content: "How do I create a Checkout session?" },
        {
          role: "assistant",
          content:
            "You create a Checkout session via the Stripe API. Hit `POST /v1/checkout/sessions` with a `mode` (e.g. `subscription`), `line_items` referencing your prices, and `success_url` + `cancel_url`. Stripe returns a session object with a `url` field — redirect the customer there [1].",
          citations: [chunks[0].id],
          confidence: 0.89,
        },
        { role: "user", content: "Do I need to handle the response on success?" },
        {
          role: "assistant",
          content:
            "Yes — but not from the redirect. Stripe sends a `checkout.session.completed` webhook to your server [2]. Handle that in a webhook endpoint: verify the signature, then provision access (mark the user as paid, etc). The `success_url` is where the user lands in the browser; the webhook is what your backend trusts [2].",
          citations: [chunks[1].id, chunks[1].id],
          confidence: 0.92,
        },
      ],
    },
    {
      daysAgo: 3,
      messages: [
        { role: "user", content: "What test cards can I use?" },
        {
          role: "assistant",
          content:
            "Stripe provides a set of test cards [3]. Use `4242 4242 4242 4242` for success, `4000 0000 0000 0002` for a generic decline, and `4000 0000 0000 9995` for insufficient funds. Any future expiry and any CVC work for all of them [3].",
          citations: [chunks[2].id, chunks[2].id],
          confidence: 0.94,
        },
      ],
    },
    {
      daysAgo: 5,
      messages: [
        { role: "user", content: "How do subscriptions work?" },
        {
          role: "assistant",
          content:
            "A Subscription ties a Customer to a Price on a recurring schedule [4]. The Price defines the product, amount, and billing interval (monthly, yearly, etc). Subscription status flows through values like `active`, `trialing`, `past_due`, and `canceled`. Listen to `customer.subscription.*` webhooks to stay in sync — that's the source of truth [4].",
          citations: [chunks[3].id, chunks[3].id],
          confidence: 0.91,
        },
        { role: "user", content: "Can customers cancel themselves?" },
        {
          role: "assistant",
          content:
            "Yes — through the Stripe Customer Portal [5]. Create a portal session via API and redirect the customer; they can update payment methods, view invoices, change plans, or cancel without you writing the UI for it [5].",
          citations: [chunks[4].id],
          confidence: 0.88,
        },
      ],
    },
    {
      daysAgo: 8,
      messages: [
        { role: "user", content: "What's the deal with idempotency keys?" },
        {
          role: "assistant",
          content:
            "I don't have specific information about idempotency keys in the sources I've been given. Try rephrasing, or check stripe.com/docs directly.",
          citations: [],
          confidence: 0.42,
        },
      ],
    },
    {
      daysAgo: 12,
      messages: [
        { role: "user", content: "Hello!" },
        {
          role: "assistant",
          content:
            "Hi! I'm trained on the Stripe docs. Ask me anything about payments — Checkout, subscriptions, webhooks, test cards, etc.",
          citations: [],
          confidence: 0.18,
        },
      ],
    },
    {
      daysAgo: 15,
      messages: [
        { role: "user", content: "How do I refund a payment?" },
        {
          role: "assistant",
          content:
            "I don't have details on refunds in the sources I've been given. Try rephrasing, or check stripe.com/docs/refunds directly.",
          citations: [],
          confidence: 0.31,
        },
      ],
    },
  ];

  for (const c of conversations) {
    const startedAt = new Date(now - c.daysAgo * day).toISOString();

    const { data: conv, error: convErr } = await admin
      .from("conversations")
      .insert({ project_id: project.id, started_at: startedAt })
      .select()
      .single();
    if (convErr) throw new Error(`conv insert failed: ${convErr.message}`);

    let i = 0;
    for (const m of c.messages) {
      const messageTime = new Date(new Date(startedAt).getTime() + i * 30_000).toISOString();
      const { data: msg, error: msgErr } = await admin
        .from("messages")
        .insert({
          conversation_id: conv.id,
          role: m.role,
          content: m.content,
          citations: m.citations ?? [],
          confidence: m.confidence ?? null,
          created_at: messageTime,
        })
        .select()
        .single();
      if (msgErr) throw new Error(`msg insert failed: ${msgErr.message}`);

      // Flag unanswered for low-confidence assistant responses.
      if (
        m.role === "assistant" &&
        ((m.confidence ?? 1) < 0.5 || /i don'?t (?:know|have)/i.test(m.content))
      ) {
        // The user message is the previous one in this conversation.
        const userMsgIndex = c.messages.indexOf(m) - 1;
        if (userMsgIndex >= 0) {
          await admin.from("unanswered").insert({
            conversation_id: conv.id,
            message_id: msg.id,
            question: c.messages[userMsgIndex].content,
            created_at: messageTime,
          });
        }
      }
      i++;
    }
  }

  console.log(`  Created ${conversations.length} conversations.`);
}

async function main() {
  console.log("=== Seeding Helpforge demo account ===\n");

  await clearExisting();
  const userId = await createDemoUser();
  const project = await seedProject(userId);
  const source = await seedSource(project);
  const chunks = await seedChunks(source, project);
  await seedConversations(project, chunks);

  console.log("\n=== ALL DONE ===");
  console.log(`\nDemo credentials:`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`\nLog in at https://helpforge.vercel.app/login\n`);
}

main().catch((err) => {
  console.error("\n✗ Seeding failed:", err);
  process.exit(1);
});
