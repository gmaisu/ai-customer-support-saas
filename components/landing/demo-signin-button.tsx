"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { EyeIcon } from "lucide-react";
import { signInAsDemo } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

/**
 * One-click "Sign in as demo" button. Calls the demo sign-in server action
 * and lets the redirect take the user straight to /dashboard.
 */
export function DemoSigninButton({
  size = "lg",
  className,
  variant = "outline",
}: {
  size?: "sm" | "default" | "lg";
  className?: string;
  variant?: "outline" | "ghost";
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await signInAsDemo();
      // The action redirects on success — we only see this on failure.
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      disabled={pending}
      className={className}
    >
      <EyeIcon className="size-4" />
      {pending ? "Signing in…" : "Sign in as demo"}
    </Button>
  );
}
