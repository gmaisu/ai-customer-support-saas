"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function UpgradeButton({
  className,
  size = "default",
  children = "Upgrade to Pro",
}: {
  className?: string;
  size?: "sm" | "default" | "lg";
  children?: React.ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/stripe/checkout", { method: "POST" });
        const json = await res.json();
        if (!res.ok || !json.url) {
          if (res.status === 401) {
            toast.error("Sign in first to upgrade.");
            return;
          }
          toast.error(json.error ?? "Couldn't start checkout");
          return;
        }
        window.location.href = json.url;
      } catch {
        toast.error("Network error. Try again.");
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={pending} size={size} className={className}>
      {pending ? "Loading…" : children}
    </Button>
  );
}
