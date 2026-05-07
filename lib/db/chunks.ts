import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ChunkRow {
  source_id: string;
  project_id: string;
  content: string;
  embedding: number[] | null;
  token_count: number;
  chunk_index: number;
  metadata: Record<string, unknown>;
}

/**
 * Bulk-insert chunks. Uses the admin client so the orchestration route doesn't
 * trip over RLS during a long-running job. Ownership is verified at the route
 * boundary before this is called.
 */
export async function insertChunks(rows: ChunkRow[]): Promise<void> {
  if (rows.length === 0) return;
  const admin = createAdminClient();
  // Insert in batches of 500 to keep request payloads manageable for big crawls.
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const { error } = await admin.from("chunks").insert(slice);
    if (error) throw new Error(`chunks insert failed: ${error.message}`);
  }
}

/**
 * Drop all chunks for a source. Called before re-ingesting so we don't end up
 * with stale chunks when a user re-crawls.
 */
export async function deleteChunksForSource(sourceId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("chunks").delete().eq("source_id", sourceId);
  if (error) throw new Error(`chunks delete failed: ${error.message}`);
}
