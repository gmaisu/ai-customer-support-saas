"use client";

import { ExternalLinkIcon } from "lucide-react";

export interface ChatSource {
  index: number;
  chunkId: string;
  sourceId: string;
  sourceUrl: string | null;
  title: string | null;
  similarity: number;
}

/**
 * Render numbered citation chips beneath an assistant message.
 *
 * Only sources actually referenced in the text via [N] markers are shown,
 * keeping the chip row uncluttered for short answers that quoted just one.
 */
export function CitationChips({ text, sources }: { text: string; sources: ChatSource[] }) {
  if (!sources || sources.length === 0) return null;

  const referenced = new Set<number>();
  for (const match of text.matchAll(/\[(\d+)\]/g)) {
    const n = Number(match[1]);
    if (Number.isInteger(n) && n >= 1 && n <= sources.length) {
      referenced.add(n);
    }
  }

  const used = sources.filter((s) => referenced.has(s.index));
  if (used.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {used.map((s) => {
        const label = `[${s.index}] ${s.title ?? s.sourceUrl ?? "Source"}`;
        const href = s.sourceUrl ?? "#";
        return (
          <a
            key={s.index}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="bg-accent text-accent-foreground hover:bg-accent/80 inline-flex max-w-xs items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
            title={`${s.title ?? "Source"} — ${(s.similarity * 100).toFixed(0)}% match`}
          >
            <span className="shrink-0 truncate">{label}</span>
            {s.sourceUrl && <ExternalLinkIcon className="size-3 shrink-0" />}
          </a>
        );
      })}
    </div>
  );
}
