import "server-only";
import { encode, decode } from "gpt-tokenizer/encoding/cl100k_base";

export interface ChunkInput {
  /** Original page URL (or null for pasted text). Stored in chunks.metadata. */
  sourceUrl: string | null;
  /** Page title or section heading. Stored in chunks.metadata. */
  title: string;
  /** The raw text to chunk. */
  text: string;
}

export interface ChunkOutput {
  content: string;
  tokenCount: number;
  chunkIndex: number;
  metadata: {
    sourceUrl: string | null;
    title: string;
  };
}

const CHUNK_SIZE_TOKENS = 500;
const CHUNK_OVERLAP_TOKENS = 50;

/**
 * Split a single page's text into ~500-token chunks with 50-token overlap.
 *
 * Uses cl100k_base which is what OpenAI's `gpt-4o-mini` and
 * `text-embedding-3-small` both tokenize against, so chunks here
 * line up with the embedding budget.
 *
 * Each chunk gets metadata pointing back to its source URL + title so the
 * chat can render citations.
 */
export function chunkText(input: ChunkInput): ChunkOutput[] {
  const text = input.text.trim();
  if (!text) return [];

  const tokens = encode(text);
  if (tokens.length === 0) return [];

  // Short pages still produce one chunk.
  if (tokens.length <= CHUNK_SIZE_TOKENS) {
    return [
      {
        content: text,
        tokenCount: tokens.length,
        chunkIndex: 0,
        metadata: { sourceUrl: input.sourceUrl, title: input.title },
      },
    ];
  }

  const chunks: ChunkOutput[] = [];
  const stride = CHUNK_SIZE_TOKENS - CHUNK_OVERLAP_TOKENS;
  let chunkIndex = 0;

  for (let start = 0; start < tokens.length; start += stride) {
    const end = Math.min(start + CHUNK_SIZE_TOKENS, tokens.length);
    const slice = tokens.slice(start, end);
    const content = decode(slice).trim();
    if (content.length > 0) {
      chunks.push({
        content,
        tokenCount: slice.length,
        chunkIndex: chunkIndex++,
        metadata: { sourceUrl: input.sourceUrl, title: input.title },
      });
    }
    if (end >= tokens.length) break;
  }

  return chunks;
}

/**
 * Chunk multiple pages at once. chunk_index is monotonic across pages so the
 * order is preserved when re-assembling for retrieval ranking.
 */
export function chunkPages(pages: ChunkInput[]): ChunkOutput[] {
  const all: ChunkOutput[] = [];
  let runningIndex = 0;
  for (const page of pages) {
    const pageChunks = chunkText(page);
    for (const c of pageChunks) {
      all.push({ ...c, chunkIndex: runningIndex++ });
    }
  }
  return all;
}
