"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProjectAction } from "@/app/dashboard/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project } from "@/types/db";

const PRESET_COLORS = [
  "#7c3aed", // violet (default)
  "#2563eb", // blue
  "#059669", // emerald
  "#d97706", // amber
  "#dc2626", // red
  "#0f172a", // slate-900
];

export function ProjectSettingsForm({ project }: { project: Project }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [name, setName] = useState(project.name);
  const [brandColor, setBrandColor] = useState(project.brand_color);
  const [greeting, setGreeting] = useState(project.greeting);
  const [fallback, setFallback] = useState(project.fallback_message);

  const dirty =
    name !== project.name ||
    brandColor !== project.brand_color ||
    greeting !== project.greeting ||
    fallback !== project.fallback_message;

  function handleSave() {
    startTransition(async () => {
      const result = await updateProjectAction(project.id, {
        name,
        brand_color: brandColor,
        greeting,
        fallback_message: fallback,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
          disabled={pending}
        />
      </div>

      <div className="space-y-2">
        <Label>Brand color</Label>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setBrandColor(c)}
              className="hover:ring-ring data-[active=true]:ring-offset-background size-8 rounded-full border-2 transition-all data-[active=true]:ring-2 data-[active=true]:ring-offset-2"
              style={{
                backgroundColor: c,
                borderColor: c === brandColor ? "currentColor" : "transparent",
              }}
              data-active={c === brandColor}
              aria-label={`Brand color ${c}`}
              disabled={pending}
            />
          ))}
          <Input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="h-8 w-14 cursor-pointer"
            disabled={pending}
          />
          <span className="text-muted-foreground font-mono text-xs">{brandColor}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="greeting">Greeting</Label>
        <Input
          id="greeting"
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          maxLength={200}
          disabled={pending}
        />
        <p className="text-muted-foreground text-xs">
          Shown to users when they open the chat for the first time.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fallback">Fallback message</Label>
        <textarea
          id="fallback"
          value={fallback}
          onChange={(e) => setFallback(e.target.value)}
          maxLength={400}
          rows={3}
          disabled={pending}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:ring-ring/50 focus-visible:border-ring flex w-full rounded-lg border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="text-muted-foreground text-xs">
          Used when the chatbot can&apos;t find the answer in your knowledge base.
        </p>
      </div>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button
          variant="ghost"
          onClick={() => {
            setName(project.name);
            setBrandColor(project.brand_color);
            setGreeting(project.greeting);
            setFallback(project.fallback_message);
          }}
          disabled={pending || !dirty}
        >
          Reset
        </Button>
        <Button onClick={handleSave} disabled={pending || !dirty || !name.trim()}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
