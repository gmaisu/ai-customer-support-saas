import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedQuery } from "@/lib/embeddings";
import type { RetrievedChunk } from "@/lib/prompts";

const TOP_K = 5;

/**
 * Embed the user's query, then call the project-scoped match_chunks Postgres
 * function. The function ALWAYS filters by project_id; we never hand it a
 * trusting query.
 *
 * Uses the admin client for the RPC because (a) the chat route already
 * verified the user owns this project and (b) RLS would otherwise force
 * an extra session boundary check on a hot path.
 */
export async function retrieveContext(args: {
  apiKey: string;
  projectId: string;
  query: string;
}): Promise<RetrievedChunk[]> {
  const { apiKey, projectId, query } = args;

  const queryEmbedding = await embedQuery(apiKey, query);
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    target_project_id: projectId,
    match_count: TOP_K,
  });
  if (error) throw new Error(`retrieval failed: ${error.message}`);

  return (data ?? []).map(
    (row: {
      id: string;
      source_id: string;
      content: string;
      similarity: number;
      metadata: Record<string, unknown>;
      chunk_index: number;
    }) => ({
      id: row.id,
      source_id: row.source_id,
      content: row.content,
      similarity: Number(row.similarity),
      metadata: row.metadata as { sourceUrl?: string; title?: string },
    }),
  );
}
