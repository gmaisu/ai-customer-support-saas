import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Unanswered } from "@/types/db";

/**
 * Mark a question as unanswered. Called from the chat route's onFinish when
 * either retrieval confidence is too low or the assistant explicitly punted.
 *
 * Admin client because this fires from inside the streaming response's
 * onFinish callback, where the user's session boundary may have already
 * closed. Ownership was verified at the route's auth gate.
 */
export async function addUnanswered(input: {
  conversationId: string;
  messageId: string;
  question: string;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("unanswered").insert({
    conversation_id: input.conversationId,
    message_id: input.messageId,
    question: input.question,
  });
  if (error) throw new Error(error.message);
}

/**
 * List unanswered questions for a project. Powers the analytics page.
 * Joins through conversations to scope by project_id, RLS handles
 * cross-tenant isolation.
 */
export async function listUnansweredForProject(
  projectId: string,
  limit = 10,
): Promise<Array<Unanswered & { conversation_started_at: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("unanswered")
    .select("*, conversations!inner(started_at, project_id)")
    .eq("conversations.project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const r = row as Unanswered & { conversations: { started_at: string } };
    return { ...r, conversation_started_at: r.conversations.started_at };
  });
}
