"use client";

import type { UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { CitationChips, type ChatSource } from "./citation-chips";
import { Logo } from "@/components/logo";

interface MessageMetadata {
  conversationId?: string;
  sources?: ChatSource[];
}

export function MessageBubble({
  message,
  isStreaming,
}: {
  message: UIMessage;
  isStreaming?: boolean;
}) {
  const text = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("\n");

  const meta = message.metadata as MessageMetadata | undefined;
  const sources = meta?.sources ?? [];

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2 text-sm whitespace-pre-wrap">
          {text}
        </div>
      </div>
    );
  }

  // Assistant
  return (
    <div className="flex gap-3">
      <Logo size={28} className="mt-1 shrink-0" />
      <div className="max-w-[85%] flex-1 space-y-1">
        <div className="prose prose-sm dark:prose-invert text-sm leading-relaxed whitespace-pre-wrap">
          {text || (isStreaming && <span className="text-muted-foreground">…</span>)}
          {isStreaming && text && (
            <span
              className={cn("ml-0.5 inline-block h-3.5 w-1 animate-pulse bg-current align-middle")}
            />
          )}
        </div>
        {!isStreaming && sources.length > 0 && <CitationChips text={text} sources={sources} />}
      </div>
    </div>
  );
}
