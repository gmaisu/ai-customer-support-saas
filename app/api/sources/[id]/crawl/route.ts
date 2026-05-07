import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSource, setSourceStatus } from "@/lib/db/sources";
import { crawlSite } from "@/lib/crawler/crawl-site";

export const runtime = "nodejs";
// Vercel Hobby plan: 60s. Crawl is capped to fit inside this.
export const maxDuration = 60;

const FREE_PAGE_CAP = 25; // brief recommends 50 free / 500 pro; tightened to 25 for the 60s budget
const PAGE_TIMEOUT_MS = 8_000;
const TOTAL_TIMEOUT_MS = 55_000; // leave 5s of headroom under maxDuration

/**
 * POST /api/sources/:id/crawl
 *
 * Triggered fire-and-forget by the URL form on the client. Runs the crawl
 * synchronously in this request, transitioning sources.status as it goes.
 *
 * Auth check: only the source's owning user can trigger a crawl. RLS would
 * normally enforce this, but we use the admin client for status writes (to
 * avoid the user's session affecting visibility mid-crawl), so we re-check
 * ownership here at the top.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership through RLS-aware client.
  const source = await getSource(id);
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }
  if (source.type !== "url" || !source.source_url) {
    return NextResponse.json({ error: "Source is not a URL type" }, { status: 400 });
  }
  if (source.status === "crawling" || source.status === "ready") {
    return NextResponse.json({ error: "Already crawled or in progress" }, { status: 409 });
  }

  await setSourceStatus(id, { status: "crawling", error_message: null, pages_crawled: 0 });

  try {
    const result = await crawlSite(source.source_url, {
      maxPages: FREE_PAGE_CAP,
      pageTimeoutMs: PAGE_TIMEOUT_MS,
      totalTimeoutMs: TOTAL_TIMEOUT_MS,
      onProgress: async (p) => {
        // Best-effort progress update. Errors here are non-fatal.
        await setSourceStatus(id, { pages_crawled: p.pagesCrawled }).catch(() => {});
      },
    });

    if (result.pagesCrawled === 0) {
      await setSourceStatus(id, {
        status: "failed",
        error_message:
          result.failures[0]?.reason ??
          "No pages could be crawled (robots.txt, redirects, or empty pages).",
      });
      return NextResponse.json({ ok: false, error: "No pages crawled" }, { status: 200 });
    }

    // Persist the concatenated text via admin client (avoid RLS write headaches
    // mid-job; ownership was already verified at the top).
    const admin = createAdminClient();
    const { error } = await admin
      .from("sources")
      .update({
        // Schema doesn't have a content column; chunking pipeline (TASK-210)
        // will read this from the result and persist into chunks.content.
        // For now we record metadata and leave full text materialization to
        // the chunking step in chunk 3.
        char_count: result.charCount,
        pages_crawled: result.pagesCrawled,
        title: new URL(source.source_url).hostname,
      })
      .eq("id", id);
    if (error) throw new Error(error.message);

    // TODO(chunk-3): trigger chunking + embedding pipeline here.
    // For now, mark the source as ready since the crawl text is in memory but
    // not yet persisted. This will change when chunking lands — status will
    // transition crawling → chunking → embedding → ready.
    await setSourceStatus(id, { status: "ready" });

    return NextResponse.json({
      ok: true,
      pagesCrawled: result.pagesCrawled,
      pagesAttempted: result.pagesAttempted,
      pagesSkipped: result.pagesSkipped,
      failures: result.failures.length,
      charCount: result.charCount,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await setSourceStatus(id, {
      status: "failed",
      error_message: message.slice(0, 500),
    });
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}
