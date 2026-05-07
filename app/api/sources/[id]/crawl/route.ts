import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSource, setSourceStatus } from "@/lib/db/sources";
import { insertChunks, deleteChunksForSource } from "@/lib/db/chunks";
import { getUserOpenAIKey } from "@/lib/db/profile";
import { crawlSite } from "@/lib/crawler/crawl-site";
import { chunkPages } from "@/lib/chunking";
import { embedTexts, isValidOpenAIKeyShape } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 60;

const FREE_PAGE_CAP = 25;
const PAGE_TIMEOUT_MS = 8_000;
const TOTAL_TIMEOUT_MS = 50_000;

/**
 * POST /api/sources/:id/crawl
 *
 * Full pipeline: crawl → chunk → embed → ready.
 *
 * BYOK: the user must have set an OpenAI key in their profile before this
 * route succeeds. If the key is missing, the crawl is skipped entirely with
 * a 412 — pointing the user to the settings page is friendlier than running
 * a half-pipeline that produces unembedded chunks.
 *
 * Status transitions:
 *   pending → crawling → chunking → embedding → ready
 *   any → failed (with error_message)
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

  // BYOK gate: refuse to start if the user hasn't connected their OpenAI key.
  const apiKey = await getUserOpenAIKey(user.id);
  if (!apiKey || !isValidOpenAIKeyShape(apiKey)) {
    return NextResponse.json(
      {
        error: "OpenAI key not configured",
        hint: "Add your key in Account → API Key.",
      },
      { status: 412 },
    );
  }

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

  await deleteChunksForSource(id);
  await setSourceStatus(id, { status: "crawling", error_message: null, pages_crawled: 0 });

  try {
    // ─── crawl ──────────────────────────────────────────────────────────────
    const crawl = await crawlSite(source.source_url, {
      maxPages: FREE_PAGE_CAP,
      pageTimeoutMs: PAGE_TIMEOUT_MS,
      totalTimeoutMs: TOTAL_TIMEOUT_MS,
      onProgress: async (p) => {
        await setSourceStatus(id, { pages_crawled: p.pagesCrawled }).catch(() => {});
      },
    });

    if (crawl.pagesCrawled === 0) {
      await setSourceStatus(id, {
        status: "failed",
        error_message:
          crawl.failures[0]?.reason ??
          "No pages could be crawled (robots.txt, redirects, or empty pages).",
      });
      return NextResponse.json({ ok: false, error: "No pages crawled" }, { status: 200 });
    }

    await setSourceStatus(id, {
      status: "chunking",
      pages_crawled: crawl.pagesCrawled,
      char_count: crawl.charCount,
      title: new URL(source.source_url).hostname,
    });

    // ─── chunk ──────────────────────────────────────────────────────────────
    const chunks = chunkPages(
      crawl.pages.map((p) => ({
        sourceUrl: p.url,
        title: p.title,
        text: p.content,
      })),
    );

    if (chunks.length === 0) {
      await setSourceStatus(id, {
        status: "failed",
        error_message: "Crawl succeeded but produced no usable text chunks.",
      });
      return NextResponse.json({ ok: false, error: "No chunks produced" }, { status: 200 });
    }

    // ─── embed (with the user's key) ────────────────────────────────────────
    await setSourceStatus(id, { status: "embedding" });
    let embeddings: number[][];
    try {
      embeddings = await embedTexts(
        apiKey,
        chunks.map((c) => c.content),
      );
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await setSourceStatus(id, {
        status: "failed",
        error_message: `Embedding failed: ${message}`.slice(0, 500),
      });
      return NextResponse.json({ ok: false, error: message }, { status: 200 });
    }

    // ─── persist ────────────────────────────────────────────────────────────
    await insertChunks(
      chunks.map((c, i) => ({
        source_id: id,
        project_id: source.project_id,
        content: c.content,
        embedding: embeddings[i],
        token_count: c.tokenCount,
        chunk_index: c.chunkIndex,
        metadata: c.metadata,
      })),
    );

    await setSourceStatus(id, { status: "ready" });

    return NextResponse.json({
      ok: true,
      pagesCrawled: crawl.pagesCrawled,
      chunksCreated: chunks.length,
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
