import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export const runtime = "nodejs";

/**
 * POST /api/stripe/webhook
 *
 * Verifies the Stripe webhook signature, then handles subscription lifecycle
 * events by flipping `profiles.plan` between 'free' and 'pro'.
 *
 * Idempotency: every event id is logged in the stripe_events table. A duplicate
 * event id is acknowledged (200) without re-processing, so Stripe's automatic
 * retries don't double-flip plans.
 */
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  const stripe = getStripe();
  const body = await req.text(); // raw body required for signature verification

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Webhook verification failed: ${msg}` }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: short-circuit if we've seen this event id already.
  const { data: existing } = await admin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ received: true, deduped: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        if (userId) {
          await admin.from("profiles").update({ plan: "pro" }).eq("id", userId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.user_id ?? null;
        if (userId) {
          // Subscription status: active|trialing → pro, anything else → free.
          const isActive = sub.status === "active" || sub.status === "trialing";
          await admin
            .from("profiles")
            .update({ plan: isActive ? "pro" : "free" })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata.user_id ?? null;
        if (userId) {
          await admin.from("profiles").update({ plan: "free" }).eq("id", userId);
        }
        break;
      }

      default:
        // No-op for other event types we subscribed to. Log and move on.
        break;
    }

    // Record the event id so future redeliveries are idempotent.
    await admin.from("stripe_events").insert({ id: event.id, type: event.type }).throwOnError();

    return NextResponse.json({ received: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[stripe webhook] Processing failed:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
