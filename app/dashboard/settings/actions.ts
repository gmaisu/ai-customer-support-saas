"use server";

import { revalidatePath } from "next/cache";
import { updateOwnProfile } from "@/lib/db/profile";
import { isValidOpenAIKeyShape } from "@/lib/embeddings";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function setOpenAIKeyAction(formData: FormData): Promise<ActionResult> {
  const key = String(formData.get("api_key") ?? "").trim();
  if (!key) return { ok: false, error: "API key is required." };
  if (!isValidOpenAIKeyShape(key)) {
    return { ok: false, error: "That doesn't look like a valid OpenAI key (expected sk-…)." };
  }

  try {
    await updateOwnProfile({ openai_api_key: key });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/projects", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save key." };
  }
}

export async function clearOpenAIKeyAction(): Promise<ActionResult> {
  try {
    await updateOwnProfile({ openai_api_key: null });
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/projects", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to clear key." };
  }
}
