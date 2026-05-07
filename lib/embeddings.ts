import "server-only";
import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536; // matches the vector(1536) column
const BATCH_SIZE = 100; // OpenAI's max for batch embeddings

/**
 * Helpforge follows BYOK (Bring-Your-Own-Key). Every embedding call requires
 * the *user's* OpenAI key — there is no platform-level fallback. The crawl
 * orchestration route fetches the key from `profiles.openai_api_key` after
 * authenticating the user.
 *
 * If a route reaches embedding code without a user key, that's a bug in the
 * caller — they should have either (a) blocked the action upstream with a
 * "configure your key" prompt, or (b) gracefully skipped embedding.
 */

export function isValidOpenAIKeyShape(key: string): boolean {
  return /^sk-[A-Za-z0-9_-]{20,}$/.test(key.trim());
}

/**
 * Embed an array of texts. Returns one number[] per input, in the same order.
 *
 * Throws on:
 * - missing/invalid key (caller should validate first)
 * - OpenAI rate limit, billing, or auth errors (bubbled up so the crawl
 *   route can surface a useful error_message to the user)
 */
export async function embedTexts(apiKey: string, texts: string[]): Promise<number[][]> {
  if (!apiKey || !isValidOpenAIKeyShape(apiKey)) {
    throw new Error("OpenAI API key is missing or malformed.");
  }
  if (texts.length === 0) return [];

  const client = new OpenAI({ apiKey });

  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const res = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    for (const item of res.data) {
      all.push(item.embedding);
    }
  }
  return all;
}

export async function embedQuery(apiKey: string, query: string): Promise<number[]> {
  const [vec] = await embedTexts(apiKey, [query]);
  return vec;
}
