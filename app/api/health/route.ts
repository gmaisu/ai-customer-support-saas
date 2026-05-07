import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * GET /api/health
 *
 * Cheap liveness check for uptime monitors (Better Uptime, UptimeRobot, etc.)
 * Returns build metadata so a hit also confirms which deployment is live.
 *
 * Intentionally NOT a database probe — that would let any anonymous caller
 * burn through Supabase free-tier requests just by polling. Use this only
 * to verify the Next.js function itself is up.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "helpforge",
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? "local",
    deployment: process.env.VERCEL_DEPLOYMENT_ID ?? "local",
  });
}
