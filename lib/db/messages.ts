import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Message, MessageRole } from "@/types/db";

export async function listMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addMessage(input: {
  conversationId: string;
  role: MessageRole;
  content: string;
  citations?: string[];
  confidence?: number | null;
}): Promise<Message> {
  // Admin client: the chat route fires this from inside streamText's onFinish,
  // and the user's session boundary may have already closed by the time the
  // stream completes. Ownership is verified at the route's auth gate.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
      citations: input.citations ?? [],
      confidence: input.confidence ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function recentMessagesForContext(
  conversationId: string,
  limit = 6,
): Promise<Array<Pick<Message, "role" | "content">>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  // Re-reverse so it's chronological for the model.
  return (data ?? []).reverse().map((m) => ({ role: m.role, content: m.content }));
}
