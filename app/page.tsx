import Link from "next/link";
import {
  GlobeIcon,
  MessageSquareIcon,
  BarChart3Icon,
  KeyIcon,
  ZapIcon,
  CodeIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: GlobeIcon,
    title: "30-second URL onboarding",
    body: "Paste a website. Helpforge crawls up to 100 pages, respects robots.txt, and builds a vector knowledge base before you can refill your coffee.",
  },
  {
    icon: MessageSquareIcon,
    title: "Streaming chat with citations",
    body: "Every answer is grounded in retrieved chunks and links to the source page. No hallucinations, no fluff — just cited, scoped responses.",
  },
  {
    icon: BarChart3Icon,
    title: "Built-in analytics",
    body: "See conversations per day, unanswered question rate, and the exact questions your knowledge base couldn't cover.",
  },
  {
    icon: KeyIcon,
    title: "Bring your own OpenAI key",
    body: "Helpforge never proxies AI usage. You pay OpenAI directly, you control the spend, you keep the keys.",
  },
  {
    icon: ZapIcon,
    title: "Real-time progress UI",
    body: "Crawls update live via Supabase Realtime. No polling, no spinners forever — just status that moves with the work.",
  },
  {
    icon: CodeIcon,
    title: "Embed snippet generator",
    body: "Drop one <script> tag into any HTML page to mount the chat widget bound to your project.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo size={28} />
            Helpforge
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" render={<Link href="/pricing" />}>
              Pricing
            </Button>
            {user ? (
              <Button render={<Link href="/dashboard" />}>Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" render={<Link href="/login" />}>
                  Sign in
                </Button>
                <Button render={<Link href="/signup" />}>Get started</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-20 text-center sm:py-28">
          <span className="bg-accent text-accent-foreground rounded-full border px-3 py-1 text-xs font-medium">
            Portfolio MVP · Open source · Live demo below
          </span>
          <h1 className="from-foreground to-foreground/70 bg-gradient-to-b bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Forge an AI support bot from your website in 30 seconds.
          </h1>
          <p className="text-muted-foreground max-w-xl text-lg">
            Paste a URL. Helpforge crawls your site, turns it into a knowledge base, and gives you a
            chatbot with cited answers. PDFs and FAQs welcome too.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" render={<Link href={user ? "/dashboard" : "/signup"} />}>
              {user ? "Go to dashboard" : "Start free"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={
                <a
                  href="https://github.com/gmaisu/ai-customer-support-saas"
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              View on GitHub
            </Button>
          </div>

          {!user && (
            <div className="text-muted-foreground bg-card/50 mt-4 rounded-lg border px-4 py-3 text-sm">
              <p className="mb-1">
                <span className="text-foreground font-medium">Try the live demo</span> — no signup
                needed, populated with sample data:
              </p>
              <p className="font-mono text-xs">
                <span className="text-muted-foreground">email </span>
                <code className="text-foreground">demo@helpforge.dev</code>
                <span className="text-muted-foreground"> · password </span>
                <code className="text-foreground">helpforge-demo-2026</code>
              </p>
            </div>
          )}
        </section>

        {/* Features grid */}
        <section className="bg-muted/20 border-t">
          <div className="mx-auto w-full max-w-6xl px-6 py-20">
            <div className="mb-12 max-w-2xl space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">What it does</h2>
              <p className="text-muted-foreground">
                Helpforge is a complete RAG SaaS — crawler, chunker, embedder, retriever, chat,
                billing, all wired up.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="bg-card rounded-lg border p-6">
                  <Icon className="text-primary mb-3 size-6" />
                  <h3 className="mb-1 font-semibold">{title}</h3>
                  <p className="text-muted-foreground text-sm">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA strip */}
        <section className="border-t">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Ready to forge something?
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Free plan covers a real demo. No credit card. Bring your OpenAI key — pay OpenAI
              directly for usage.
            </p>
            <Button size="lg" render={<Link href={user ? "/dashboard" : "/signup"} />}>
              {user ? "Go to dashboard" : "Start free"}
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 text-sm">
          <span>© 2026 Helpforge</span>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <a
              href="https://github.com/gmaisu/ai-customer-support-saas"
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
