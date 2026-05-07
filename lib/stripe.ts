import "server-only";
import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

/**
 * Server-only Stripe client. Lazily initialized so the module loads cleanly
 * during build even when STRIPE_SECRET_KEY is missing — only routes that
 * actually call this will fail, not the whole app.
 */
export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  if (!cachedStripe) {
    // Default API version follows the installed SDK so we don't have to chase
    // version pins as Stripe rolls them. For long-lived production we'd pin,
    // but for portfolio MVP the SDK default is fine.
    cachedStripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }
  return cachedStripe;
}

export interface PlanLimits {
  /** Hard cap on number of projects per user. */
  maxProjects: number;
  /** Daily chat message cap (per user, not per project). */
  dailyMessages: number;
  /** Hard cap on pages per URL crawl. */
  pagesPerCrawl: number;
}

export const PLAN_LIMITS: Record<"free" | "pro", PlanLimits> = {
  free: {
    maxProjects: 1,
    dailyMessages: 100,
    pagesPerCrawl: 25,
  },
  pro: {
    maxProjects: 10,
    dailyMessages: 500,
    pagesPerCrawl: 100,
  },
};

/**
 * Helpforge keeps AI usage BYOK regardless of plan — Pro unlocks platform
 * features (more projects, bigger crawls), not bigger AI bills. This is
 * called out on the pricing page so users understand they still pay OpenAI
 * directly.
 */
