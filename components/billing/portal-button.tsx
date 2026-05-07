"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PortalButton() {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.url) {
          toast.error(json.error ?? "Couldn't open billing portal");
          return;
        }
        window.location.href = json.url;
      } catch {
        toast.error("Network error. Try again.");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? "Loading…" : "Manage subscription"}
    </Button>
  );
}
