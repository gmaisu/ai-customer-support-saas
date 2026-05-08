"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { EyeIcon } from "lucide-react";
import { signInAsDemo } from "@/app/auth/actions";

/**
 * One-click "Sign in as demo" button. Matches the design's hf-btn--outline
 * + hf-btn--lg spec exactly: 44px height, 20px horizontal padding, 15px
 * text, 12px radius, border-strong outline.
 */
export function DemoSigninButton({ className = "" }: { className?: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await signInAsDemo();
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`bg-background text-foreground hover:bg-muted focus-visible:ring-ring/50 inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-5 text-[15px] font-medium transition-colors focus-visible:ring-3 focus-visible:outline-none active:translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={{ borderColor: "var(--border-strong, var(--border))" }}
    >
      <EyeIcon className="size-4" />
      {pending ? "Signing in…" : "Sign in as demo"}
    </button>
  );
}
