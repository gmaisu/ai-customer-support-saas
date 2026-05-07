import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Conversation } from "@/types/db";

export async function listConversations(projectId: string): Promise<Conversation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getConversation(id: string): Promise<Conversation | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export interface ConversationListItem extends Conversation {
  message_count: number;
  preview: string | null;
}

/**
 * Conversations list with first user message preview + message count, paginated.
 * One round-trip per page; messages are fetched in a second query and joined
 * client-side. Good enough for portfolio scale; can be optimized later if
 * a project ever has thousands of conversations.
 */
export async function listConversationsWithPreview(
  projectId: string,
  page = 0,
  pageSize = 20,
): Promise<{ items: ConversationListItem[]; total: number }> {
  const supabase = await createClient();

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const [convResp, totalResp] = await Promise.all([
    supabase
      .from("conversations")
      .select("*")
      .eq("project_id", projectId)
      .order("started_at", { ascending: false })
      .range(from, to),
    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId),
  ]);

  if (convResp.error) throw new Error(convResp.error.message);
  if (totalResp.error) throw new Error(totalResp.error.message);

  const conversations = convResp.data ?? [];
  if (conversations.length === 0) {
    return { items: [], total: totalResp.count ?? 0 };
  }

  const conversationIds = conversations.map((c) => c.id);

  // Fetch first user message + per-conversation count.
  const { data: messages, error: msgErr } = await supabase
    .from("messages")
    .select("conversation_id, role, content, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });
  if (msgErr) throw new Error(msgErr.message);

  const previewMap = new Map<string, string>();
  const countMap = new Map<string, number>();
  for (const m of messages ?? []) {
    countMap.set(m.conversation_id, (countMap.get(m.conversation_id) ?? 0) + 1);
    if (m.role === "user" && !previewMap.has(m.conversation_id)) {
      previewMap.set(m.conversation_id, m.content);
    }
  }

  const items = conversations.map((c) => ({
    ...c,
    message_count: countMap.get(c.id) ?? 0,
    preview: previewMap.get(c.id) ?? null,
  }));

  return { items, total: totalResp.count ?? 0 };
}

export async function createConversation(projectId: string): Promise<Conversation> {
  // Admin client because the chat route runs after auth and needs the row to
  // be visible immediately, even mid-request. Ownership is verified upstream.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("conversations")
    .insert({ project_id: projectId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
