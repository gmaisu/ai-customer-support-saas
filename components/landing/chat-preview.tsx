import { CheckIcon, CheckCircleIcon, ExternalLinkIcon } from "lucide-react";
import { Logo } from "@/components/logo";

/**
 * Static "look at the chat" mock for the landing page.
 * Pure markup — no streaming. The real chat ships under /dashboard/projects/[id]/chat.
 */
export function ChatPreview() {
  const bullets = [
    "Streaming responses via Vercel AI SDK v6",
    "Top-5 chunks per query, scoped by RLS to your project",
    "Unanswered questions auto-flagged for review",
  ];

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
      {/* Copy */}
      <div>
        <span className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
          Cited, not hallucinated
        </span>
        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Every answer links back to your source.
        </h2>
        <p className="text-muted-foreground mt-3 max-w-md leading-relaxed">
          We retrieve the top-5 most-similar chunks via pgvector, prompt the model to inline
          numbered citations, then parse them into clickable chips that jump to the exact page.
        </p>
        <ul className="mt-6 grid gap-2.5">
          {bullets.map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-sm">
              <span className="bg-accent text-accent-foreground inline-flex size-[18px] items-center justify-center rounded-full">
                <CheckIcon className="size-3" />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Mock chat card */}
      <div className="bg-card rounded-xl border p-4 shadow-2xl shadow-violet-500/10">
        <div className="flex items-center gap-2 border-b pb-3">
          <Logo size={20} />
          <span className="text-xs font-semibold">Stripe Docs bot</span>
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
            style={{
              background: "color-mix(in oklab, var(--success, #059669) 14%, var(--card))",
              borderColor: "color-mix(in oklab, var(--success, #059669) 35%, transparent)",
              color: "var(--success, #059669)",
            }}
          >
            <CheckCircleIcon className="size-3" />
            Online
          </span>
          <span className="flex-1" />
          <span className="text-muted-foreground font-mono text-[10px]">conv_8a7f</span>
        </div>
        <div className="space-y-3.5 px-1 py-3.5">
          {/* User bubble */}
          <div className="flex justify-end">
            <div
              className="max-w-[280px] rounded-2xl rounded-tr-sm px-3.5 py-2 text-[13px] text-white"
              style={{ background: "var(--grad-brand)" }}
            >
              How long are webhook deliveries retried?
            </div>
          </div>

          {/* Assistant bubble */}
          <div className="flex gap-2.5">
            <Logo size={26} />
            <div className="flex-1 text-[13px] leading-relaxed">
              Stripe retries failed deliveries with exponential backoff for up to{" "}
              <strong>3 days</strong> <CitationPill n={1} />. After that the endpoint is
              auto-disabled and an{" "}
              <code className="bg-muted rounded border px-1.5 py-0.5 font-mono text-xs">
                endpoint.disabled
              </code>{" "}
              event fires <CitationPill n={2} />.
              <div className="mt-3 flex flex-wrap gap-1.5">
                <CitationChip n={1} title="Webhooks: best practices" />
                <CitationChip n={2} title="Endpoint events" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CitationPill({ n }: { n: number }) {
  return (
    <span className="bg-accent text-accent-foreground mx-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1.5 font-mono text-[10px] font-bold">
      {n}
    </span>
  );
}

function CitationChip({ n, title }: { n: number; title: string }) {
  return (
    <span
      className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{
        border: "1px solid color-mix(in oklab, var(--primary) 20%, transparent)",
      }}
    >
      <span className="font-mono font-bold">[{n}]</span>
      {title}
      <ExternalLinkIcon className="size-2.5" />
    </span>
  );
}
