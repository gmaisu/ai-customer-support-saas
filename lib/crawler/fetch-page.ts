import "server-only";
import * as cheerio from "cheerio";

export interface PageResult {
  url: string;
  title: string;
  content: string; // cleaned text, no HTML
  links: string[]; // same-domain absolute URLs found on the page
  charCount: number;
}

export interface FetchOptions {
  /** Per-page hard timeout in ms. Default 10s. */
  timeoutMs?: number;
  /** AbortSignal to short-circuit if the parent run is canceled. */
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT = 10_000;
const USER_AGENT = "Helpforge/1.0 (+https://helpforge.vercel.app)";

/**
 * Fetch one HTML page, strip noise, extract clean text + same-domain links.
 *
 * Throws on:
 * - non-2xx response
 * - non-HTML content-type
 * - timeout
 * - any network error
 *
 * Doesn't enforce robots.txt — that's the caller's job (do it once per
 * crawl, not once per page).
 */
export async function fetchPage(rawUrl: string, opts: FetchOptions = {}): Promise<PageResult> {
  const url = new URL(rawUrl);
  const timeout = opts.timeoutMs ?? DEFAULT_TIMEOUT;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error("page timeout")), timeout);
  if (opts.signal) {
    if (opts.signal.aborted) ctrl.abort(opts.signal.reason);
    else opts.signal.addEventListener("abort", () => ctrl.abort(opts.signal!.reason));
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url.toString()}`);
  }

  const ct = response.headers.get("content-type") ?? "";
  if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
    throw new Error(`Skipping non-HTML content-type "${ct}" for ${url.toString()}`);
  }

  const html = await response.text();
  return extractFromHtml(html, url);
}

function extractFromHtml(html: string, baseUrl: URL): PageResult {
  const $ = cheerio.load(html);

  // Strip noise: scripts, styles, nav/header/footer, navigation chrome, hidden els.
  $("script, style, noscript, template, nav, header, footer, aside, svg").remove();
  $("[aria-hidden='true']").remove();
  $("[role='navigation'], [role='banner'], [role='contentinfo']").remove();

  // Title: prefer <h1>, fall back to <title>.
  const title = $("h1").first().text().trim() || $("title").text().trim() || baseUrl.toString();

  // Extract text. Prefer <main> if present, otherwise <body>. Collapse whitespace.
  const textRoot = $("main").length > 0 ? $("main") : $("body");
  const content = textRoot
    .text()
    .replace(/\s+/g, " ")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

  // Extract same-domain links. Resolve relative URLs against baseUrl. Drop fragments.
  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const u = new URL(href, baseUrl);
      if (u.hostname !== baseUrl.hostname) return;
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      u.hash = "";
      links.add(u.toString());
    } catch {
      // Skip invalid URLs silently.
    }
  });

  return {
    url: baseUrl.toString(),
    title: title.slice(0, 200),
    content,
    links: Array.from(links),
    charCount: content.length,
  };
}
