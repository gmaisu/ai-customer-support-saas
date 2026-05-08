import { CheckIcon, CheckCircleIcon, ExternalLinkIcon } from "lucide-react";
import { Logo } from "@/components/logo";

/**
 * Static "look at the chat" mock for the landing page.
 * Matches the design's <ChatPreview /> exactly:
 * - Two-column grid: minmax(0, 1fr) minmax(0, 1.05fr), gap 48
 * - Card: 18px padding, shadow-lg
 * - Eyebrow: 11px mono uppercase
 * - H2: 32px, weight 700, letter-spacing -0.02em
 * - User bubble: 320px max, gradient background, 13px text
 * - Citation pill: 18×18 minimum, mono bold superscript
 * - Citation chip: rounded-full, primary-soft bg, mono [N] prefix
 */
export function ChatPreview() {
  const bullets = [
    "Streaming responses via Vercel AI SDK v6",
    "Top-5 chunks per query, scoped by RLS to your project",
    "Unanswered questions auto-flagged for review",
  ];

  return (
    <div
      className="grid items-center"
      style={{
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.05fr)",
        gap: 48,
      }}
    >
      {/* Copy column */}
      <div>
        <span
          className="font-mono uppercase"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            color: "var(--muted-foreground)",
            opacity: 0.85,
          }}
        >
          Cited, not hallucinated
        </span>
        <h2
          className="font-bold"
          style={{
            fontSize: 32,
            letterSpacing: "-0.02em",
            margin: "8px 0 12px",
            lineHeight: 1.1,
          }}
        >
          Every answer links back to your source.
        </h2>
        <p
          style={{
            color: "var(--muted-foreground)",
            maxWidth: 460,
            marginBottom: 20,
            fontSize: 14,
            lineHeight: 1.55,
          }}
        >
          We retrieve the top-5 most-similar chunks via pgvector, prompt the model to inline
          numbered citations, then parse them into clickable chips that jump to the exact page.
        </p>
        <ul className="grid" style={{ gap: 10, padding: 0, margin: 0, listStyle: "none" }}>
          {bullets.map((t) => (
            <li key={t} className="flex items-center" style={{ gap: 10, fontSize: 14 }}>
              <span
                className="inline-flex items-center justify-center"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "var(--primary-soft)",
                  color: "var(--primary-text)",
                }}
              >
                <CheckIcon size={11} />
              </span>
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Mock chat card — design: 18px padding, shadow-lg */}
      <div
        className="bg-card rounded-xl border"
        style={{
          padding: 18,
          boxShadow:
            "0 20px 40px -12px rgba(15, 15, 23, 0.16), 0 8px 16px -8px rgba(15, 15, 23, 0.08)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center"
          style={{ gap: 8, padding: "0 4px 12px", borderBottom: "1px solid var(--border)" }}
        >
          <Logo size={20} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Stripe Docs bot</span>
          <span
            className="inline-flex items-center"
            style={{
              gap: 5,
              height: 22,
              padding: "0 8px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
              background: "color-mix(in oklab, var(--success) 14%, var(--card))",
              border: "1px solid color-mix(in oklab, var(--success) 35%, transparent)",
              color: "var(--success)",
            }}
          >
            <CheckCircleIcon size={11} />
            Online
          </span>
          <span style={{ flex: 1 }} />
          <span
            className="font-mono"
            style={{ fontSize: 11, color: "var(--muted-foreground)", opacity: 0.85 }}
          >
            conv_8a7f
          </span>
        </div>

        {/* Messages */}
        <div className="grid" style={{ gap: 14, padding: "14px 4px" }}>
          {/* User bubble */}
          <div className="flex justify-end">
            <div
              style={{
                background: "var(--grad-brand)",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: 16,
                borderTopRightRadius: 4,
                fontSize: 13,
                maxWidth: 320,
                boxShadow: "0 6px 16px -8px var(--primary-glow)",
              }}
            >
              How long are webhook deliveries retried?
            </div>
          </div>

          {/* Assistant bubble */}
          <div className="flex" style={{ gap: 10 }}>
            <Logo size={26} />
            <div style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.55 }}>
              Stripe retries failed deliveries with exponential backoff for up to{" "}
              <strong>3 days</strong> <CitationPill n={1} />. After that the endpoint is
              auto-disabled and an{" "}
              <code
                className="font-mono"
                style={{
                  background: "var(--bg-grid)",
                  padding: "1px 5px",
                  borderRadius: 4,
                  fontSize: 12,
                  border: "1px solid var(--border)",
                }}
              >
                endpoint.disabled
              </code>{" "}
              event fires <CitationPill n={2} />.
              <div className="flex flex-wrap" style={{ gap: 6, marginTop: 12 }}>
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
    <span
      className="inline-flex items-center justify-center font-mono"
      style={{
        minWidth: 18,
        height: 18,
        padding: "0 5px",
        marginInline: 2,
        borderRadius: 999,
        background: "var(--primary-soft)",
        color: "var(--primary-text)",
        fontSize: 10,
        fontWeight: 700,
      }}
    >
      {n}
    </span>
  );
}

function CitationChip({ n, title }: { n: number; title: string }) {
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 6,
        padding: "3px 10px",
        borderRadius: 999,
        background: "var(--primary-soft)",
        color: "var(--primary-text)",
        fontSize: 11,
        fontWeight: 500,
        border: "1px solid color-mix(in oklab, var(--primary) 20%, transparent)",
      }}
    >
      <span className="font-mono" style={{ fontWeight: 700 }}>
        [{n}]
      </span>
      {title}
      <ExternalLinkIcon size={10} />
    </span>
  );
}
