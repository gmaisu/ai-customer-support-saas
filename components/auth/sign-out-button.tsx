"use client";

import { useTransition } from "react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      disabled={pending}
      onClick={() => startTransition(() => signOut())}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
