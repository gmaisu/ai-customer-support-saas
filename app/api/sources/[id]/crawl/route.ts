import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSource, setSourceStatus } from "@/lib/db/sources";
import { insertChunks, deleteChunksForSource } from "@/lib/db/chunks";
import { crawlSite } from "@/lib/crawler/crawl-site";
import { chunkPages } from "@/lib/chunking";
import { embedTexts, isEmbeddingConfigured } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 60;

const FREE_PAGE_CAP = 25;
const PAGE_TIMEOUT_MS = 8_000;
const TOTAL_TIMEOUT_MS = 50_000; // crawl budget; leave room for chunking + embedding

/**
 * POST /api/sources/:id/crawl
 *
 * Full pipeline: crawl → chunk → embed → ready. Runs synchronously inside
 * the 60s function budget. Embedding is skipped (with a warning logged on
 * the source) if OPENAI_API_KEY is not configured — the rest of the pipeline
 * still works for diagnostics.
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

  // Drop any stale chunks from a prior failed run.
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

    // ─── embed ──────────────────────────────────────────────────────────────
    let embeddings: (number[] | null)[];
    let warning: string | null = null;
    if (isEmbeddingConfigured()) {
      await setSourceStatus(id, { status: "embedding" });
      try {
        embeddings = await embedTexts(chunks.map((c) => c.content));
      } catch (e) {
        // Embedding failure shouldn't lose the crawl. Mark the source as
        // failed but keep the crawl artifacts for inspection.
        const message = e instanceof Error ? e.message : String(e);
        await setSourceStatus(id, {
          status: "failed",
          error_message: `Embedding failed: ${message}`.slice(0, 500),
        });
        return NextResponse.json({ ok: false, error: message }, { status: 200 });
      }
    } else {
      embeddings = chunks.map(() => null);
      warning =
        "OPENAI_API_KEY not set — chunks stored without embeddings; chat retrieval disabled.";
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
      embedded: isEmbeddingConfigured(),
      warning,
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
