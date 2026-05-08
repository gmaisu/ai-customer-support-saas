"use client";

/**
 * Live forge demo — kinetic stepper that loops on the landing page.
 * Mirrors the real Sources-tab pipeline visually so the marketing
 * page actually shows what the product does, not just describes it.
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

const TOTAL_PHASES = STEPS.length + 2; // pre + idle gap

export function ForgeDemo() {
  const [stepIdx, setStepIdx] = useState(0);
  const [pages, setPages] = useState(0);
  const [chunks, setChunks] = useState(0);

  // Drive the loop
  useEffect(() => {
    const tick = setInterval(() => {
      setStepIdx((s) => (s + 1) % TOTAL_PHASES);
    }, 1600);
    return () => clearInterval(tick);
  }, []);

  // Animate counters toward step-derived targets. All setState calls happen
  // inside the interval callback (event-handler-like), not directly in the
  // effect body, which keeps react-hooks/set-state-in-effect happy.
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
    <div className="bg-card relative overflow-hidden rounded-2xl border p-7">
      {/* Soft halo */}
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

      {/* Fake URL bar */}
      <div className="bg-muted relative mx-auto mb-6 flex max-w-md items-center gap-2.5 rounded-xl border px-3.5 py-2.5">
        <GlobeIcon className="text-primary size-4" />
        <span className="font-mono text-xs sm:text-sm">https://docs.stripe.com</span>
        <span className="flex-1" />
        <span
          className="border-forge-glow/40 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: "color-mix(in oklab, var(--forge) 16%, var(--card))",
            color: "var(--ember)",
          }}
        >
          <FlameIcon className="size-3" />
          {stepIdx === 0 ? "Idle" : isForged ? "Forged" : "Forging"}
        </span>
      </div>

      {/* Stepper */}
      <Stepper activeIdx={activeIdx} done={isForged} />

      {/* Stat tiles */}
      <div className="relative mt-6 grid grid-cols-3 gap-3">
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
        className={cn(
          "flex size-11 items-center justify-center rounded-full border text-sm font-bold transition-all duration-300",
          state === "pending" && "bg-muted text-muted-foreground border-border",
          state === "active" && "hf-step-node-active",
          state === "done" && "hf-step-node-done",
        )}
      >
        {state === "done" ? (
          <CheckIcon className="size-5" />
        ) : state === "active" ? (
          <span className="hf-spinner" />
        ) : (
          idx + 1
        )}
      </div>
      <div
        className={cn(
          "mt-2.5 text-[13px] font-semibold",
          state === "pending" && "text-muted-foreground",
          state === "active" && "text-[color:var(--ember)]",
        )}
      >
        {label}
      </div>
      <div className="text-muted-foreground mt-0.5 px-1 font-mono text-[11px]">{note}</div>
    </div>
  );
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className="mt-[22px] h-0.5 w-7 shrink-0 self-start">
      <div
        className="h-full w-full rounded-full transition-colors duration-500"
        style={{ background: active ? "var(--grad-forge)" : "var(--border)" }}
      />
    </div>
  );
}

function StatTile({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div className="bg-muted rounded-xl border p-4">
      <div className="text-muted-foreground font-mono text-[10px] tracking-[0.1em] uppercase">
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums">
        {value}
        <span className="text-muted-foreground text-sm font-normal">{suffix}</span>
      </div>
    </div>
  );
}

function cn(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ");
}
