import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout session for the signed-in user upgrading to Pro.
 * The user's Supabase id is stamped onto the session as client_reference_id
 * so the webhook can map the completed checkout back to the right profile.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json(
      {
        error: "Stripe price not configured",
        hint: "STRIPE_PRO_PRICE_ID env var is missing.",
      },
      { status: 500 },
    );
  }

  const stripe = getStripe();
  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://helpforge.vercel.app";

  // Look up or create a Stripe customer keyed by the user's email so subscription
  // history persists across signup attempts. Storing customer.id long-term would
  // be cleaner; deferred to a future polish task.
  let customerId: string | undefined;
  if (user.email) {
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    customerId = existing.data[0]?.id;
    if (!customerId) {
      const created = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = created.id;
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    client_reference_id: user.id,
    success_url: `${origin}/dashboard/settings?upgraded=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { user_id: user.id },
    },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a redirect URL" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
