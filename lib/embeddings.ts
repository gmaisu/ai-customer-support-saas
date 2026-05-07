import "server-only";
import OpenAI from "openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536; // matches the vector(1536) column
const BATCH_SIZE = 100; // OpenAI's max for batch embeddings

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return cachedClient;
}

export function isEmbeddingConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Embed an array of texts. Returns one number[] per input, in the same order.
 *
 * Throws if OPENAI_API_KEY is not set — call isEmbeddingConfigured() first
 * if you want to gracefully degrade. The crawl pipeline does this so the
 * portfolio works in demo mode without an OpenAI key (chunks land without
 * embeddings; retrieval is disabled).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const client = getClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY is not set. Set it in .env.local to enable embeddings.");
  }

  if (texts.length === 0) return [];

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

export async function embedQuery(query: string): Promise<number[]> {
  const [vec] = await embedTexts([query]);
  return vec;
}
