"use client";

/**
 * Live forge demo — kinetic stepper that loops on the landing page.
 * Implementation matches the Claude Design handoff's <ForgeDemo /> exactly:
 * - Outer card: 28px padding, 12px radius, dual radial halo backdrop
 * - URL bar: 540px max-width, 12px radius, 14px h-padding, 10px v-padding
 * - Stepper nodes: 44×44, 21px connectors, 0.4s color transitions
 * - Stat tiles: 16px padding, 28px values, 11px mono uppercase labels
 */

import { useEffect, useState } from "react";
import { CheckIcon, FlameIcon, GlobeIcon } from "lucide-react";

const STEPS = [
  { key: "pending", label: "Queueing", note: "Resolving robots.txt + sitemap" },
  { key: "crawling", label: "Crawling", note: "BFS, same-host, 25 pages cap" },
  { key: "chunking", label: "Chunking", note: "cl100k · 500 / 50 overlap" },
  { key: "embedding", label: "Embedding", note: "text-embedding-3-small · 1536 dims" },
  { key: "ready", label: "Ready", note: "pgvector HNSW index built" },
];

const TOTAL_PHASES = STEPS.length + 2;

export function ForgeDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [pages, setPages] = useState(0);
  const [chunks, setChunks] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      setStepIdx((s) => (s + 1) % TOTAL_PHASES);
    }, 1600);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const targetPages = stepIdx === 0 ? 0 : stepIdx >= 2 ? 24 : Math.min(24, stepIdx * 9);
    const targetChunks = stepIdx === 0 ? 0 : stepIdx >= 3 ? 187 : 0;
    const id = setInterval(() => {
      setPages((p) => {
        if (p === targetPages) return p;
        return p < targetPages ? Math.min(targetPages, p + 1) : 0;
      });
      setChunks((c) => {
        if (c === targetChunks) return c;
        return c < targetChunks
          ? Math.min(targetChunks, c + Math.max(1, Math.round((targetChunks - c) / 8)))
          : 0;
      });
    }, 30);
    return () => clearInterval(id);
  }, [stepIdx]);

  const activeIdx = Math.min(stepIdx, STEPS.length - 1);
  const isForging = stepIdx >= 1 && stepIdx < STEPS.length;
  const isForged = stepIdx >= STEPS.length;
  const elapsed = Math.min(28, stepIdx * 6);

  return (
    <div className="bg-card relative overflow-hidden rounded-xl border" style={{ padding: 28 }}>
      {/* Soft dual-radial halo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(600px 240px at 0% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 60%), radial-gradient(500px 220px at 100% 100%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%)",
        }}
      />

      {/* Spark field during forging stages */}
      {isForging && stepIdx >= 3 && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => {
            const left = 5 + (i * 91) / 18 + ((i * 17) % 11);
            const sx = ((i * 37) % 22) - 11;
            const delay = (i * 0.14) % 1.6;
            const dur = 1.2 + ((i * 0.31) % 1.1);
            const sz = 2 + (i % 3);
            return (
              <span
                key={i}
                className="hf-spark"
                style={
                  {
                    left: `${left}%`,
                    width: sz,
                    height: sz,
                    animationDuration: `${dur}s`,
                    animationDelay: `${delay}s`,
                    "--sx": `${sx}px`,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}

      {/* Fake URL bar — design spec: 540px max-width, 12px radius, 10/14 padding */}
      <div
        className="relative mx-auto flex items-center"
        style={{
          gap: 10,
          padding: "10px 14px",
          borderRadius: 12,
          background: "var(--bg-grid)",
          border: "1px solid var(--border)",
          marginBottom: 24,
          maxWidth: 540,
        }}
      >
        <GlobeIcon size={16} style={{ color: "var(--primary)" }} />
        <span className="font-mono" style={{ fontSize: 13, color: "var(--foreground)" }}>
          https://docs.stripe.com
        </span>
        <span style={{ flex: 1 }} />
        <span
          className="inline-flex items-center"
          style={{
            gap: 5,
            height: 22,
            padding: "0 8px",
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 500,
            background: "color-mix(in oklab, var(--forge) 16%, var(--card))",
            border: "1px solid color-mix(in oklab, var(--forge) 40%, transparent)",
            color: "var(--ember)",
          }}
        >
          <FlameIcon size={11} />
          {stepIdx === 0 ? "Idle" : isForged ? "Forged" : "Forging"}
        </span>
      </div>

      {/* Stepper */}
      <Stepper activeIdx={activeIdx} done={isForged} />

      {/* Stat tiles — design: 28px value, 11px mono label, 16px padding */}
      <div className="relative grid grid-cols-3" style={{ gap: 16, marginTop: 28 }}>
        <StatTile label="Pages crawled" value={pages} suffix=" / 25" />
        <StatTile label="Chunks embedded" value={chunks} suffix=" · 1536-d" />
        <StatTile label="Time" value={elapsed} suffix="s" />
      </div>
    </div>
  );
}

function Stepper({ activeIdx, done }: { activeIdx: number; done: boolean }) {
  return (
    <div className="relative flex items-stretch">
      {STEPS.map((s, i) => {
        const state = done || i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
        return (
          <div key={s.key} className="contents">
            <StepNode label={s.label} note={s.note} state={state} idx={i} />
            {i < STEPS.length - 1 && <StepConnector active={i < activeIdx || done} />}
          </div>
        );
      })}
    </div>
  );
}

function StepNode({
  label,
  note,
  state,
  idx,
}: {
  label: string;
  note: string;
  state: "pending" | "active" | "done";
  idx: number;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
      <div
        className="flex items-center justify-center rounded-full border font-bold"
        style={{
          width: 44,
          height: 44,
          fontSize: 14,
          transition: "all 0.4s ease",
          ...(state === "pending" && {
            background: "var(--bg-grid)",
            color: "var(--muted-foreground)",
            borderColor: "var(--border)",
          }),
          ...(state === "active" && {
            background: "var(--grad-forge)",
            color: "#fff",
            borderColor: "transparent",
            boxShadow: "0 0 0 6px color-mix(in oklab, var(--ember) 22%, transparent)",
          }),
          ...(state === "done" && {
            background: "var(--grad-brand)",
            color: "#fff",
            borderColor: "transparent",
            boxShadow: "0 6px 18px -6px var(--primary-glow)",
          }),
        }}
      >
        {state === "done" ? (
          <CheckIcon size={18} />
        ) : state === "active" ? (
          <span className="hf-spinner" />
        ) : (
          idx + 1
        )}
      </div>
      <div
        className="font-semibold"
        style={{
          marginTop: 10,
          fontSize: 13,
          color:
            state === "pending"
              ? "var(--muted-foreground)"
              : state === "active"
                ? "var(--ember)"
                : "var(--foreground)",
        }}
      >
        {label}
      </div>
      <div
        className="font-mono"
        style={{
          fontSize: 11,
          color: "var(--muted-foreground)",
          marginTop: 2,
          padding: "0 6px",
        }}
      >
        {note}
      </div>
    </div>
  );
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className="shrink-0 self-start" style={{ marginTop: 21, height: 2, width: 28 }}>
      <div
        style={{
          height: "100%",
          width: "100%",
          borderRadius: 999,
          background: active ? "var(--grad-forge)" : "var(--border)",
          transition: "background 0.4s",
        }}
      />
    </div>
  );
}

function StatTile({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "var(--bg-grid)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="font-mono uppercase"
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          color: "var(--muted-foreground)",
        }}
      >
        {label}
      </div>
      <div
        className="font-bold tabular-nums"
        style={{ marginTop: 6, fontSize: 28, lineHeight: 1.1 }}
      >
        {value}
        <span
          style={{
            fontSize: 14,
            color: "var(--muted-foreground)",
            fontWeight: 400,
          }}
        >
          {suffix}
        </span>
      </div>
    </div>
  );
}
