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
import { Button } from "@/components/ui/button";
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
    body: "Conversations per day, unanswered question rate, and the exact questions your knowledge base couldn't cover.",
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

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      {/* ─── Sticky header ─────────────────────────────────────────────── */}
      <header className="bg-background/75 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <Logo size={28} />
            Helpforge
          </Link>
          <nav className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" render={<Link href="/pricing" />}>
              Pricing
            </Button>
            {user ? (
              <Button size="sm" className="hf-btn-brand" render={<Link href="/dashboard" />}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  Sign in
                </Button>
                <Button size="sm" className="hf-btn-brand" render={<Link href="/signup" />}>
                  Get started
                  <ArrowRightIcon className="size-3.5" />
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── Hero ──────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b">
          {/* Glow backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(900px 480px at 50% -10%, color-mix(in oklab, var(--primary) 22%, transparent), transparent 60%), radial-gradient(700px 400px at 80% 20%, color-mix(in oklab, var(--accent) 60%, transparent), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
            <span
              className="bg-accent text-accent-foreground inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium"
              style={{
                borderColor: "color-mix(in oklab, var(--primary) 30%, transparent)",
              }}
            >
              <SparklesIcon className="size-3" />
              Forge MVP · Open source · Live demo below
            </span>
            <h1 className="mx-auto mt-6 max-w-4xl text-5xl leading-[1.02] font-extrabold tracking-[-0.035em] text-balance sm:text-6xl md:text-7xl">
              Forge an AI support bot from
              <br />
              your website in{" "}
              <span className="relative inline-block">
                <span className="hf-forge-text font-display pr-1.5 italic">30 seconds</span>
                <span
                  aria-hidden
                  className="absolute right-0 -bottom-1 left-0 h-2 rounded-md opacity-25 blur-[2px]"
                  style={{ background: "var(--grad-forge)" }}
                />
              </span>
              .
            </h1>
            <p className="text-muted-foreground mx-auto mt-6 max-w-xl text-lg leading-relaxed">
              Paste a URL. Helpforge crawls your site, embeds it with pgvector, and gives you a
              chatbot with cited answers — no hallucinations, no cleanup.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {user ? (
                <Button size="lg" className="hf-btn-brand" render={<Link href="/dashboard" />}>
                  Go to dashboard
                  <ArrowRightIcon className="size-4" />
                </Button>
              ) : (
                <>
                  <Button size="lg" className="hf-btn-brand" render={<Link href="/signup" />}>
                    Start free
                    <ArrowRightIcon className="size-4" />
                  </Button>
                  <DemoSigninButton size="lg" />
                </>
              )}
            </div>
            <p className="text-muted-foreground mt-3.5 text-xs">
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

        {/* ─── Live forge demo ───────────────────────────────────────── */}
        <section className="border-b px-6 py-14">
          <div className="mx-auto max-w-5xl">
            <div className="mb-9 text-center">
              <span className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
                Live forge
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                URL in. Knowledge base out.
              </h2>
              <p className="text-muted-foreground mx-auto mt-2 max-w-md">
                Watch the pipeline work — the same stepper your users see when they paste a URL.
              </p>
            </div>
            <ForgeDemo />
          </div>
        </section>

        {/* ─── Features grid ─────────────────────────────────────────── */}
        <section className="bg-muted/30 border-b px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-xl">
              <span className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
                Anatomy
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">What it does</h2>
              <p className="text-muted-foreground mt-2">
                A complete RAG SaaS — crawler, chunker, embedder, retriever, chat, billing — wired
                up.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="bg-card hover:border-primary/40 rounded-xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    className="bg-accent text-primary mb-3.5 inline-flex size-9 items-center justify-center rounded-lg"
                    style={{
                      borderColor: "color-mix(in oklab, var(--primary) 25%, transparent)",
                    }}
                  >
                    <Icon className="size-[18px]" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ──────────────────────────────────────────── */}
        <section className="border-b px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-9">
              <span className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
                Workflow
              </span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Three things. In order.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HOW_IT_WORKS.map((s) => (
                <div key={s.n} className="bg-card relative overflow-hidden rounded-xl border p-7">
                  <div className="hf-grad-text font-display text-[60px] leading-none italic">
                    {s.n}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Chat preview ──────────────────────────────────────────── */}
        <section className="bg-muted/30 border-b px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <ChatPreview />
          </div>
        </section>

        {/* ─── Final CTA ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b px-6 py-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(700px 360px at 50% 50%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <span className="text-muted-foreground font-mono text-[11px] tracking-[0.12em] uppercase">
              Strike
            </span>
            <h2 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Ready to forge something?
            </h2>
            <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-base sm:text-lg">
              Free plan covers a real demo. No credit card. Bring your OpenAI key — pay OpenAI
              directly for usage.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {user ? (
                <Button size="lg" className="hf-btn-brand" render={<Link href="/dashboard" />}>
                  Go to dashboard
                  <ArrowRightIcon className="size-4" />
                </Button>
              ) : (
                <>
                  <Button size="lg" className="hf-btn-brand" render={<Link href="/signup" />}>
                    Start free
                    <ArrowRightIcon className="size-4" />
                  </Button>
                  <DemoSigninButton size="lg" />
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-8">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            <Logo size={18} />© 2026 Helpforge
          </span>
          <span className="text-xs">MIT licensed · Built with Next.js, Supabase, OpenAI BYOK</span>
        </div>
      </footer>
    </div>
  );
}
