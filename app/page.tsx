import Link from "next/link";
import {
  ArrowRightIcon,
  BarChart3Icon,
  CodeIcon,
  GlobeIcon,
  KeyIcon,
  MessageSquareIcon,
  SparklesIcon,
  ZapIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { ForgeDemo } from "@/components/landing/forge-demo";
import { ChatPreview } from "@/components/landing/chat-preview";
import { DemoSigninButton } from "@/components/landing/demo-signin-button";

const FEATURES = [
  {
    icon: GlobeIcon,
    title: "30-second URL onboarding",
    body: "Paste a website. Helpforge crawls up to 100 pages, respects robots.txt, builds a vector knowledge base.",
  },
  {
    icon: MessageSquareIcon,
    title: "Streaming chat with citations",
    body: "Every answer is grounded in retrieved chunks and links to the source page. No hallucinations.",
  },
  {
    icon: BarChart3Icon,
    title: "Built-in analytics",
    body: "Conversations per day, unanswered question rate, exact questions your knowledge base couldn't cover.",
  },
  {
    icon: KeyIcon,
    title: "Bring your own OpenAI key",
    body: "Helpforge never proxies AI usage. You pay OpenAI directly. You keep the keys.",
  },
  {
    icon: ZapIcon,
    title: "Real-time progress UI",
    body: "Crawls update live via Supabase Realtime. No polling, no spinners forever — status that moves with the work.",
  },
  {
    icon: CodeIcon,
    title: "Embed snippet generator",
    body: "Drop one <script> tag into any HTML page to mount the chat widget bound to your project.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Paste your URL",
    body: "We crawl same-host links breadth-first, respect robots.txt, cap at 25 / 100 pages.",
  },
  {
    n: "02",
    title: "We forge the index",
    body: "Token-aware chunking (cl100k, 500/50 overlap) → text-embedding-3-small → pgvector HNSW.",
  },
  {
    n: "03",
    title: "Ship the bot",
    body: "Streaming chat with inline [N] citations, plus a one-line <script> embed for any site.",
  },
];

/**
 * Landing page styling notes (matches the Claude Design handoff):
 * - Body font-size is 14px globally; marketing surfaces upsize specific
 *   elements explicitly rather than relying on text-base.
 * - Container widths are 1100 (hero/sections) and 1200 (header) — use
 *   max-w-[1100px] / max-w-[1200px] instead of approximating with max-w-6xl.
 * - All marketing CTAs use the .hf-btn-brand utility (gradient, glow) and
 *   the .hf-btn-* size utilities; we don't use shadcn <Button> here so the
 *   hover/glow shadows match the design exactly.
 */

const BTN_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[filter,box-shadow,background] active:translate-y-[1px] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50";
const BTN_LG = "h-11 px-5 text-[15px] rounded-xl";
const BTN_SM = "h-[30px] px-2.5 text-[13px] rounded-md";
const BTN_GHOST = "bg-transparent text-foreground hover:bg-muted";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      {/* ─── Sticky header (max-w 1200, padding 12/24) ─────────────────── */}
      <header className="bg-background/75 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
          <Link href="/" className="inline-flex items-center gap-2.5 text-base font-semibold">
            <Logo size={28} />
            Helpforge
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link href="/pricing" className={`${BTN_BASE} ${BTN_SM} ${BTN_GHOST}`}>
              Pricing
            </Link>
            {user ? (
              <Link href="/dashboard" className={`${BTN_BASE} ${BTN_SM} hf-btn-brand rounded-md`}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className={`${BTN_BASE} ${BTN_SM} ${BTN_GHOST}`}>
                  Sign in
                </Link>
                <Link href="/signup" className={`${BTN_BASE} ${BTN_SM} hf-btn-brand rounded-md`}>
                  Get started
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero (max-w 1100, padding 88px top / 72px bottom) ─────── */}
        <section className="relative overflow-hidden border-b">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(900px 480px at 50% -10%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%), radial-gradient(700px 400px at 80% 20%, color-mix(in oklab, var(--accent) 50%, transparent), transparent 70%)",
            }}
          />
          <div
            className="relative mx-auto max-w-[1100px] px-6 text-center"
            style={{ paddingTop: 88, paddingBottom: 72 }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium"
              style={{
                height: 28,
                background: "var(--accent)",
                color: "var(--accent-foreground)",
                borderColor: "color-mix(in oklab, var(--primary) 30%, transparent)",
              }}
            >
              <SparklesIcon className="size-3" />
              Forge MVP · Open source · Live demo below
            </span>
            <h1
              className="mx-auto font-extrabold text-balance"
              style={{
                fontSize: "clamp(40px, 6vw, 76px)",
                lineHeight: 1.02,
                letterSpacing: "-0.035em",
                margin: "24px auto 16px",
                maxWidth: 920,
              }}
            >
              Forge an AI support bot from
              <br />
              your website in{" "}
              <span className="relative inline-block">
                <span
                  className="hf-forge-text font-display italic"
                  style={{ fontWeight: 500, paddingRight: 6 }}
                >
                  30 seconds
                </span>
                <span
                  aria-hidden
                  className="absolute right-0 left-0 rounded-lg blur-[2px]"
                  style={{
                    bottom: -4,
                    height: 8,
                    background: "var(--grad-forge)",
                    opacity: 0.25,
                  }}
                />
              </span>
              .
            </h1>
            <p
              className="mx-auto"
              style={{
                fontSize: 18,
                color: "var(--muted-foreground)",
                maxWidth: 620,
                margin: "0 auto 32px",
                lineHeight: 1.5,
              }}
            >
              Paste a URL. Helpforge crawls your site, embeds it with pgvector, and gives you a
              chatbot with cited answers — no hallucinations, no cleanup.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {user ? (
                <Link href="/dashboard" className={`${BTN_BASE} ${BTN_LG} hf-btn-brand`}>
                  Go to dashboard
                  <ArrowRightIcon className="size-4" />
                </Link>
              ) : (
                <>
                  <Link href="/signup" className={`${BTN_BASE} ${BTN_LG} hf-btn-brand`}>
                    Start free
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <DemoSigninButton />
                </>
              )}
            </div>
            <p
              className="text-xs"
              style={{ color: "var(--muted-foreground)", marginTop: 14, opacity: 0.8 }}
            >
              {user ? (
                <>You&apos;re already signed in — head to the dashboard.</>
              ) : (
                <>
                  The demo button signs you in to a populated workspace · No credit card · BYOK for
                  live chat
                </>
              )}
            </p>
          </div>
        </section>

        {/* ─── Live forge demo (max-w 1100, padding 56/24) ─────────────── */}
        <section className="border-b" style={{ padding: "56px 24px" }}>
          <div className="mx-auto max-w-[1100px]">
            <div className="text-center" style={{ marginBottom: 36 }}>
              <SectionLabel>Live forge</SectionLabel>
              <h2
                className="font-bold"
                style={{
                  fontSize: 32,
                  letterSpacing: "-0.02em",
                  margin: "8px 0 8px",
                  lineHeight: 1.1,
                }}
              >
                URL in. Knowledge base out.
              </h2>
              <p
                className="mx-auto"
                style={{ color: "var(--muted-foreground)", maxWidth: 540, fontSize: 14 }}
              >
                Watch the pipeline work — the same stepper your users see when they paste a URL.
              </p>
            </div>
            <ForgeDemo />
          </div>
        </section>

        {/* ─── Features grid (max-w 1100, padding 80/24, bg-soft) ──────── */}
        <section
          className="border-b"
          style={{
            padding: "80px 24px",
            background: "var(--bg-soft, color-mix(in oklab, var(--muted) 50%, var(--background)))",
          }}
        >
          <div className="mx-auto max-w-[1100px]">
            <div
              className="flex flex-wrap items-end justify-between gap-6"
              style={{ marginBottom: 40 }}
            >
              <div>
                <SectionLabel>Anatomy</SectionLabel>
                <h2
                  className="font-bold"
                  style={{
                    fontSize: 32,
                    letterSpacing: "-0.02em",
                    margin: "8px 0 8px",
                    lineHeight: 1.1,
                  }}
                >
                  What it does
                </h2>
                <p style={{ color: "var(--muted-foreground)", maxWidth: 540, fontSize: 14 }}>
                  A complete RAG SaaS — crawler, chunker, embedder, retriever, chat, billing — wired
                  up.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="bg-card rounded-xl border transition-all hover:-translate-y-0.5 hover:border-violet-500/40 hover:shadow-md"
                  style={{ padding: 24 }}
                >
                  <div
                    className="inline-flex items-center justify-center"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "var(--accent)",
                      color: "var(--primary-hex, #7c3aed)",
                      marginBottom: 14,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 className="font-semibold" style={{ fontSize: 16, margin: "0 0 4px" }}>
                    {title}
                  </h3>
                  <p style={{ color: "var(--muted-foreground)", fontSize: 14, margin: 0 }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works (max-w 1100, padding 80/24) ────────────────── */}
        <section className="border-b" style={{ padding: "80px 24px" }}>
          <div className="mx-auto max-w-[1100px]">
            <div style={{ marginBottom: 36 }}>
              <SectionLabel>Workflow</SectionLabel>
              <h2
                className="font-bold"
                style={{
                  fontSize: 32,
                  letterSpacing: "-0.02em",
                  margin: "8px 0 0",
                  lineHeight: 1.1,
                }}
              >
                Three things. In order.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HOW_IT_WORKS.map((s) => (
                <div
                  key={s.n}
                  className="bg-card relative overflow-hidden rounded-xl border"
                  style={{ padding: 28 }}
                >
                  <div
                    className="hf-grad-text font-display italic"
                    style={{ fontSize: 60, lineHeight: 1, fontWeight: 500 }}
                  >
                    {s.n}
                  </div>
                  <h3 className="font-semibold" style={{ fontSize: 18, margin: "16px 0 6px" }}>
                    {s.title}
                  </h3>
                  <p style={{ color: "var(--muted-foreground)", fontSize: 14, margin: 0 }}>
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Chat preview (max-w 1100, bg-soft, padding 80/24) ───────── */}
        <section
          className="border-b"
          style={{
            padding: "80px 24px",
            background: "var(--bg-soft, color-mix(in oklab, var(--muted) 50%, var(--background)))",
          }}
        >
          <div className="mx-auto max-w-[1100px]">
            <ChatPreview />
          </div>
        </section>

        {/* ─── Final CTA (max-w 720, padding 100/24, radial glow) ──────── */}
        <section className="relative overflow-hidden border-b" style={{ padding: "100px 24px" }}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(700px 360px at 50% 50%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-[720px] text-center">
            <SectionLabel>Strike</SectionLabel>
            <h2
              className="font-extrabold"
              style={{
                fontSize: 44,
                letterSpacing: "-0.025em",
                margin: "8px 0 16px",
                lineHeight: 1.05,
              }}
            >
              Ready to forge something?
            </h2>
            <p
              className="mx-auto"
              style={{
                color: "var(--muted-foreground)",
                fontSize: 17,
                marginBottom: 28,
                maxWidth: 520,
                lineHeight: 1.5,
              }}
            >
              Free plan covers a real demo. No credit card. Bring your OpenAI key — pay OpenAI
              directly for usage.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {user ? (
                <Link href="/dashboard" className={`${BTN_BASE} ${BTN_LG} hf-btn-brand`}>
                  Go to dashboard
                  <ArrowRightIcon className="size-4" />
                </Link>
              ) : (
                <>
                  <Link href="/signup" className={`${BTN_BASE} ${BTN_LG} hf-btn-brand`}>
                    Start free
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <DemoSigninButton />
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer style={{ padding: "32px 24px", color: "var(--muted-foreground)", fontSize: 13 }}>
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <Logo size={18} />© 2026 Helpforge
          </span>
          <span>MIT licensed · Built with Next.js, Supabase, OpenAI BYOK</span>
        </div>
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-mono uppercase"
      style={{
        fontSize: 11,
        letterSpacing: "0.12em",
        color: "var(--muted-foreground)",
        opacity: 0.85,
      }}
    >
      {children}
    </span>
  );
}
