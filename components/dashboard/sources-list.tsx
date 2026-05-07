"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  GlobeIcon,
  FileTextIcon,
  Trash2Icon,
  CheckCircle2Icon,
  XCircleIcon,
  Loader2Icon,
  ClockIcon,
} from "lucide-react";
import { deleteSourceAction } from "@/app/dashboard/projects/[id]/sources/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Source, SourceStatus } from "@/types/db";

const STATUS_LABEL: Record<SourceStatus, string> = {
  pending: "Pending",
  crawling: "Crawling",
  chunking: "Chunking",
  embedding: "Embedding",
  ready: "Ready",
  failed: "Failed",
};

function StatusBadge({ status }: { status: SourceStatus }) {
  if (status === "ready") {
    return (
      <Badge variant="secondary" className="gap-1">
        <CheckCircle2Icon className="size-3" /> {STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircleIcon className="size-3" /> {STATUS_LABEL[status]}
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="outline" className="gap-1">
        <ClockIcon className="size-3" /> {STATUS_LABEL[status]}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Loader2Icon className="size-3 animate-spin" /> {STATUS_LABEL[status]}
    </Badge>
  );
}

function SourceIcon({ type }: { type: Source["type"] }) {
  if (type === "url") return <GlobeIcon className="text-muted-foreground size-4" />;
  return <FileTextIcon className="text-muted-foreground size-4" />;
}

export function SourcesList({ projectId, sources }: { projectId: string; sources: Source[] }) {
  const [pending, startTransition] = useTransition();

  function handleDelete(sourceId: string) {
    if (!confirm("Delete this source? Its chunks will be removed too.")) return;
    startTransition(async () => {
      const result = await deleteSourceAction(projectId, sourceId);
      if (!result.ok) toast.error(result.error);
      else toast.success("Source deleted");
    });
  }

  if (sources.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No sources yet. Paste a URL above to get started.
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {sources.map((s) => (
        <li key={s.id} className="flex items-center gap-3 p-3">
          <SourceIcon type={s.type} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{s.title}</p>
            <p className="text-muted-foreground truncate text-xs">
              {s.source_url ?? "Pasted text"}
              {s.status === "ready" && s.pages_crawled > 0 && (
                <>
                  {" "}
                  · {s.pages_crawled} pages · {s.char_count.toLocaleString()} chars
                </>
              )}
              {s.status === "failed" && s.error_message && <> · {s.error_message}</>}
            </p>
          </div>
          <StatusBadge status={s.status} />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(s.id)}
            disabled={pending}
            aria-label="Delete source"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
