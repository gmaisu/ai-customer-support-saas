import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session so Pro users can update payment
 * methods, view invoices, or cancel. We look up the customer by email — same
 * lookup pattern as /checkout, since we don't store customer.id locally.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) {
    return NextResponse.json(
      { error: "No Stripe customer for this account. Subscribe first." },
      { status: 404 },
    );
  }

  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://helpforge.vercel.app";

  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${origin}/dashboard/settings`,
  });

  return NextResponse.json({ url: session.url });
}
