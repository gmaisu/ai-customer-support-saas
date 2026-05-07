import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Source, SourceStatus } from "@/types/db";

export async function listSources(projectId: string): Promise<Source[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSource(id: string): Promise<Source | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("sources").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createUrlSource(input: { project_id: string; url: string }): Promise<Source> {
  const supabase = await createClient();
  const u = new URL(input.url);
  const { data, error } = await supabase
    .from("sources")
    .insert({
      project_id: input.project_id,
      type: "url",
      source_url: u.toString(),
      title: u.hostname,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSource(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("sources").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Status transitions are driven from the crawl orchestration route, which runs
 * with the admin client (RLS-bypass) so the user's session boundary doesn't
 * accidentally hide the source mid-crawl.
 */
export async function setSourceStatus(
  id: string,
  patch: {
    status?: SourceStatus;
    error_message?: string | null;
    char_count?: number;
    pages_crawled?: number;
    title?: string;
  },
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("sources").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}
