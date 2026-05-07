"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProject, deleteProject, updateProject } from "@/lib/db/projects";
import type { Project } from "@/types/db";

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

async function requireUser(): Promise<{ id: string; email: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  return { id: user.id, email: user.email ?? "" };
}

export async function createProjectAction(formData: FormData): Promise<ActionResult<Project>> {
  const auth = await requireUser();
  if ("error" in auth) return { ok: false, error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Project name is required." };
  if (name.length > 80) return { ok: false, error: "Name must be 80 characters or fewer." };

  try {
    const project = await createProject({ name, user_id: auth.id });
    revalidatePath("/dashboard/projects");
    return { ok: true, data: project };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to create project." };
  }
}

export async function updateProjectAction(
  id: string,
  patch: Partial<Pick<Project, "name" | "brand_color" | "greeting" | "fallback_message">>,
): Promise<ActionResult<Project>> {
  const auth = await requireUser();
  if ("error" in auth) return { ok: false, error: auth.error };

  if (patch.name !== undefined) {
    patch.name = patch.name.trim();
    if (!patch.name) return { ok: false, error: "Name cannot be empty." };
  }

  try {
    const project = await updateProject(id, patch);
    revalidatePath(`/dashboard/projects/${id}`);
    revalidatePath("/dashboard/projects");
    return { ok: true, data: project };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to update project." };
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  const auth = await requireUser();
  if ("error" in auth) return { ok: false, error: auth.error };

  try {
    await deleteProject(id);
    revalidatePath("/dashboard/projects");
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to delete project." };
  }
  redirect("/dashboard/projects");
}
