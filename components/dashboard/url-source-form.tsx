"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GlobeIcon } from "lucide-react";
import { addUrlSourceAction } from "@/app/dashboard/projects/[id]/sources/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UrlSourceForm({ projectId }: { projectId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addUrlSourceAction(projectId, formData);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const sourceId = result.data.id;
      toast.success("Crawl queued");

      // Fire-and-forget: kick the crawl off without blocking the form. The
      // sources list updates via revalidation + Realtime (chunk 3).
      fetch(`/api/sources/${sourceId}/crawl`, { method: "POST" }).catch(() => {
        // The crawl route is best-effort. If the kick-off fails, the DB row
        // stays in 'pending' status, the user can retry.
      });

      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="url" className="flex items-center gap-1.5">
          <GlobeIcon className="size-4" /> Website URL
        </Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://docs.stripe.com"
          required
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Queueing…" : "Crawl site"}
      </Button>
    </form>
  );
}
