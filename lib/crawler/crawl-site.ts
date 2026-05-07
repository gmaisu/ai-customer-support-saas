import "server-only";
import robotsParser from "robots-parser";
import { fetchPage, type PageResult } from "./fetch-page";

export interface CrawlOptions {
  /** Hard cap on pages crawled. Demo cap is small to fit Vercel function timeouts. */
  maxPages?: number;
  /** Per-page timeout in ms. */
  pageTimeoutMs?: number;
  /** Total crawl timeout in ms. Defaults to maxPages * pageTimeoutMs. */
  totalTimeoutMs?: number;
  /** Called after each successful page; useful for streaming progress. */
  onProgress?: (state: CrawlProgress) => void | Promise<void>;
}

export interface CrawlProgress {
  currentUrl: string;
  pagesCrawled: number;
  pagesQueued: number;
}

export interface CrawlResult {
  rootUrl: string;
  pagesCrawled: number;
  pagesAttempted: number;
  pagesSkipped: number;
  failures: Array<{ url: string; reason: string }>;
  /** Per-page payloads. Chunking runs on these so each chunk carries its source URL. */
  pages: PageResult[];
  /** Concatenated text of every successful page, separated by URL markers. Convenience only. */
  content: string;
  charCount: number;
}

const DEFAULT_MAX_PAGES = 50;

/**
 * BFS-crawl a single domain starting from rootUrl.
 *
 * - Same-host links only (no subdomains, no external links)
 * - Respects robots.txt for our user-agent
 * - Each page has its own timeout (bounded latency on stuck pages)
 * - Total crawl time is bounded so we don't exceed the Vercel function timeout
 *
 * Returns a single concatenated text payload that downstream chunking will split.
 */
export async function crawlSite(rawRootUrl: string, opts: CrawlOptions = {}): Promise<CrawlResult> {
  const root = new URL(rawRootUrl);
  const maxPages = opts.maxPages ?? DEFAULT_MAX_PAGES;
  const pageTimeoutMs = opts.pageTimeoutMs ?? 10_000;
  const totalTimeoutMs = opts.totalTimeoutMs ?? maxPages * pageTimeoutMs;

  const robots = await loadRobots(root);
  const userAgent = "Helpforge/1.0";

  // root is a valid URL we just constructed, so normalize cannot return null.
  const startUrl = normalize(root.toString())!;
  const queue: string[] = [startUrl];
  const seen = new Set<string>(queue);
  const pages: PageResult[] = [];
  const failures: Array<{ url: string; reason: string }> = [];
  let skipped = 0;

  const totalCtrl = new AbortController();
  const totalTimer = setTimeout(() => totalCtrl.abort(new Error("crawl timeout")), totalTimeoutMs);

  try {
    while (queue.length > 0 && pages.length < maxPages) {
      if (totalCtrl.signal.aborted) break;

      const next = queue.shift()!;
      if (robots && !robots.isAllowed(next, userAgent)) {
        skipped += 1;
        continue;
      }

      try {
        const result = await fetchPage(next, {
          timeoutMs: pageTimeoutMs,
          signal: totalCtrl.signal,
        });

        // Reject pages that returned almost no useful text (often error/redirect shells).
        if (result.charCount < 80) {
          skipped += 1;
          continue;
        }

        pages.push(result);

        await opts.onProgress?.({
          currentUrl: next,
          pagesCrawled: pages.length,
          pagesQueued: queue.length,
        });

        // Enqueue newly-discovered same-host links we haven't seen.
        for (const link of result.links) {
          const norm = normalize(link);
          if (!norm) continue;
          if (seen.has(norm)) continue;
          seen.add(norm);
          if (queue.length + pages.length < maxPages) {
            queue.push(norm);
          }
        }
      } catch (e) {
        failures.push({
          url: next,
          reason: e instanceof Error ? e.message : String(e),
        });
      }
    }
  } finally {
    clearTimeout(totalTimer);
  }

  return {
    rootUrl: root.toString(),
    pagesCrawled: pages.length,
    pagesAttempted: pages.length + failures.length + skipped,
    pagesSkipped: skipped,
    failures,
    pages,
    content: pages.map((p) => `[URL: ${p.url}]\n# ${p.title}\n\n${p.content}`).join("\n\n---\n\n"),
    charCount: pages.reduce((sum, p) => sum + p.charCount, 0),
  };
}

async function loadRobots(root: URL): Promise<ReturnType<typeof robotsParser> | null> {
  const robotsUrl = `${root.protocol}//${root.host}/robots.txt`;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5_000);
    const r = await fetch(robotsUrl, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return null;
    const txt = await r.text();
    return robotsParser(robotsUrl, txt);
  } catch {
    // No robots.txt or fetch error → treat as fully allowed (common case).
    return null;
  }
}

function normalize(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    u.hash = "";
    // Drop trailing slash on the path (so /foo and /foo/ aren't crawled twice)
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return null;
  }
}
