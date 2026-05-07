"use client";

/**
 * Route-level error boundary. Triggered when a server or client component
 * inside the app throws — instead of a Next.js dev-mode crash dialog or a
 * production white screen, the user sees a friendly retry surface.
 */

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, the error message is scrubbed but `digest` matches what
    // Vercel logs server-side. Logging to the console makes local debugging
    // easier without leaking server details to the user.
    if (process.env.NODE_ENV !== "production") {
      console.error("[error.tsx]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md space-y-4 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full">
          <AlertTriangleIcon className="size-6" />
        </div>
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">
          An unexpected error happened. Most of the time, retrying fixes it. If it doesn&apos;t,
          head back home and try a different path.
        </p>
        {error.digest && (
          <p className="text-muted-foreground font-mono text-xs">Reference: {error.digest}</p>
        )}
        <div className="flex justify-center gap-2 pt-2">
          <Button onClick={reset}>Retry</Button>
          <Button variant="outline" render={<Link href="/" />}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}
