"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2Icon, KeyIcon } from "lucide-react";
import { setOpenAIKeyAction, clearOpenAIKeyAction } from "@/app/dashboard/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OpenAIKeyForm({ existingKey }: { existingKey: string | null }) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!existingKey);
  const router = useRouter();

  const masked = existingKey ? `${existingKey.slice(0, 7)}…${existingKey.slice(-4)}` : null;

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const result = await setOpenAIKeyAction(formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("OpenAI key saved");
      setEditing(false);
      router.refresh();
    });
  }

  function handleClear() {
    if (
      !confirm(
        "Disconnect your OpenAI key? Crawls and chat will stop working until you add a new one.",
      )
    )
      return;
    startTransition(async () => {
      const result = await clearOpenAIKeyAction();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("OpenAI key removed");
      setEditing(true);
      router.refresh();
    });
  }

  if (existingKey && !editing) {
    return (
      <div className="flex items-center gap-3 rounded-md border p-4">
        <CheckCircle2Icon className="size-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Connected</p>
          <p className="text-muted-foreground font-mono text-xs">{masked}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} disabled={pending}>
          Replace
        </Button>
        <Button variant="ghost" size="sm" onClick={handleClear} disabled={pending}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <form action={handleSave} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="api_key" className="flex items-center gap-1.5">
          <KeyIcon className="size-4" /> OpenAI API key
        </Label>
        <Input
          id="api_key"
          name="api_key"
          type="password"
          autoComplete="off"
          placeholder="sk-..."
          required
          disabled={pending}
        />
        <p className="text-muted-foreground text-xs">
          Get one at{" "}
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline underline-offset-2"
          >
            platform.openai.com/api-keys
          </a>
          . Stored against your profile and only used to embed your sources and answer chats.
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save key"}
        </Button>
        {existingKey && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setEditing(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
