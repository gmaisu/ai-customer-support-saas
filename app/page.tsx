import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

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

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 py-24 text-center">
        <h1 className="from-foreground to-foreground/70 bg-gradient-to-b bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
          Forge an AI support bot from your website in 30 seconds.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          Paste a URL. Helpforge crawls your site, turns it into a knowledge base, and gives you a
          chatbot with cited answers. PDFs and FAQs welcome too.
        </p>
        <div className="flex gap-3">
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
      </main>

      <footer className="border-t py-6">
        <div className="text-muted-foreground mx-auto flex max-w-6xl items-center justify-between px-4 text-sm">
          <span>© 2026 Helpforge</span>
          <span>Portfolio MVP · Next.js + Supabase + OpenAI</span>
        </div>
      </footer>
    </div>
  );
}
