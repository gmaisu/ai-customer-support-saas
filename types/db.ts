/**
 * Hand-written TypeScript types for our public schema.
 *
 * These mirror the migrations in supabase/migrations/. When the schema
 * changes, update this file (Phase 7 may switch to `supabase gen types`,
 * but for now hand-written keeps things simple and visible).
 */

export type Plan = "free" | "pro";

export type SourceType = "url" | "pdf" | "text";

export type SourceStatus = "pending" | "crawling" | "chunking" | "embedding" | "ready" | "failed";

export type MessageRole = "user" | "assistant";

export interface Profile {
  id: string;
  email: string;
  plan: Plan;
  daily_message_count: number;
  daily_count_reset_at: string;
  /** User-supplied OpenAI key. Null until the user adds one in settings. */
  openai_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  brand_color: string;
  greeting: string;
  fallback_message: string;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  project_id: string;
  type: SourceType;
  source_url: string | null;
  title: string;
  status: SourceStatus;
  error_message: string | null;
  char_count: number;
  pages_crawled: number;
  created_at: string;
  updated_at: string;
}

export interface Chunk {
  id: string;
  source_id: string;
  project_id: string;
  content: string;
  embedding: number[] | null;
  token_count: number;
  chunk_index: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  started_at: string;
  ended_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  citations: string[];
  confidence: number | null;
  created_at: string;
}

export interface Unanswered {
  id: string;
  conversation_id: string;
  message_id: string;
  question: string;
  created_at: string;
}
