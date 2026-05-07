"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GlobeIcon } from "lucide-react";
import { addUrlSourceAction } from "@/app/dashboard/projects/[id]/sources/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UrlSourceForm({
  projectId,
  disabled = false,
}: {
  projectId: string;
  disabled?: boolean;
}) {
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

      // Kick off the crawl. We *do* await this minimally so we can surface
      // a missing-key (412) error before the user wonders why nothing's
      // happening — the source row will already exist as 'pending' if we
      // don't, which is confusing.
      try {
        const res = await fetch(`/api/sources/${sourceId}/crawl`, { method: "POST" });
        if (res.status === 412) {
          toast.error("Add your OpenAI key in Account before crawling.");
        } else if (!res.ok && res.status !== 200) {
          toast.error("Couldn't start the crawl. Try again or check the source row for details.");
        } else {
          toast.success("Crawl started");
        }
      } catch {
        toast.error("Couldn't reach the crawler. Try again.");
      }

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
          disabled={pending || disabled}
        />
      </div>
      <Button type="submit" disabled={pending || disabled}>
        {pending ? "Starting…" : "Crawl site"}
      </Button>
    </form>
  );
}
