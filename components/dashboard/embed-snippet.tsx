"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmbedSnippet({ projectId, siteUrl }: { projectId: string; siteUrl: string }) {
  const [copied, setCopied] = useState(false);

  const snippet = `<script src="${siteUrl}/widget.js" data-project="${projectId}" async></script>`;

  function handleCopy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="space-y-2">
      <pre className="bg-muted overflow-x-auto rounded-md border p-3 font-mono text-xs">
        <code>{snippet}</code>
      </pre>
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? (
            <>
              <CheckIcon className="size-3.5" /> Copied
            </>
          ) : (
            <>
              <CopyIcon className="size-3.5" /> Copy snippet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
