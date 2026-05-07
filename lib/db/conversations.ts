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
