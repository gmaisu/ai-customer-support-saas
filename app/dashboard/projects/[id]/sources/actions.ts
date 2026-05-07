"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createUrlSource, deleteSource, getSource } from "@/lib/db/sources";
import { getProject } from "@/lib/db/projects";
import type { Source } from "@/types/db";

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

async function requireUser(): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  return { id: user.id };
}

export async function addUrlSourceAction(
  projectId: string,
  formData: FormData,
): Promise<ActionResult<Source>> {
  const auth = await requireUser();
  if ("error" in auth) return { ok: false, error: auth.error };

  // Extra defense-in-depth: make sure the user owns this project. RLS would
  // also block a malicious insert, but this gives a friendlier error.
  const project = await getProject(projectId);
  if (!project) return { ok: false, error: "Project not found." };

  const raw = String(formData.get("url") ?? "").trim();
  if (!raw) return { ok: false, error: "URL is required." };

  let normalized: string;
  try {
    const u = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: "Only http:// and https:// URLs are supported." };
    }
    normalized = u.toString();
  } catch {
    return { ok: false, error: "Please enter a valid URL." };
  }

  try {
    const source = await createUrlSource({ project_id: projectId, url: normalized });
    revalidatePath(`/dashboard/projects/${projectId}/sources`);
    return { ok: true, data: source };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create source." };
  }
}

export async function deleteSourceAction(
  projectId: string,
  sourceId: string,
): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { ok: false, error: auth.error };

  const source = await getSource(sourceId);
  if (!source || source.project_id !== projectId) {
    return { ok: false, error: "Source not found." };
  }

  try {
    await deleteSource(sourceId);
    revalidatePath(`/dashboard/projects/${projectId}/sources`);
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete source." };
  }
}
