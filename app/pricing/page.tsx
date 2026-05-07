import Link from "next/link";
import { CheckIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UpgradeButton } from "@/components/billing/upgrade-button";

export const metadata = {
  title: "Pricing — Helpforge",
};

const FEATURES = {
  free: [
    "1 project",
    "Up to 25 pages per crawl",
    "100 chat messages per day",
    "Inline citations on every answer",
    "Real-time crawl progress",
    "Embed snippet generator",
  ],
  pro: [
    "10 projects",
    "Up to 100 pages per crawl",
    "500 chat messages per day",
    "Everything in Free, plus:",
    "Priority crawler queue (Phase 7+)",
    "Email support",
  ],
};

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle()
    : { data: null };

  const currentPlan = profile?.plan ?? null;
  const isOnPro = currentPlan === "pro";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Logo size={28} />
            Helpforge
          </Link>
          <nav className="flex items-center gap-2">
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
        <div className="mb-12 space-y-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Simple pricing</h1>
          <p className="text-muted-foreground mx-auto max-w-xl text-lg">
            Pay for the platform, not the AI. Helpforge is BYOK — you bring your own OpenAI key, you
            pay OpenAI directly for usage.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Free */}
          <Card className={currentPlan === "free" ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Free</CardTitle>
                {currentPlan === "free" && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    Current plan
                  </span>
                )}
              </div>
              <CardDescription>To kick the tires.</CardDescription>
              <p className="pt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {FEATURES.free.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {!user && (
                <Button className="w-full" render={<Link href="/signup" />}>
                  Start free
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className={isOnPro ? "border-primary" : "border-primary/40 ring-primary/20 ring-1"}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pro</CardTitle>
                {isOnPro ? (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                    Current plan
                  </span>
                ) : (
                  <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-xs">
                    Most popular
                  </span>
                )}
              </div>
              <CardDescription>For real workloads.</CardDescription>
              <p className="pt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {FEATURES.pro.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {!user ? (
                <Button className="w-full" render={<Link href="/signup?next=/pricing" />}>
                  Start free, upgrade anytime
                </Button>
              ) : isOnPro ? (
                <Button variant="outline" className="w-full" disabled>
                  You&apos;re on Pro
                </Button>
              ) : (
                <UpgradeButton className="w-full">Upgrade to Pro — test mode</UpgradeButton>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-muted-foreground mt-10 text-center text-xs">
          This is a portfolio MVP running Stripe in test mode. Use card{" "}
          <code className="bg-muted rounded px-1 py-0.5">4242 4242 4242 4242</code> with any future
          expiry + any CVC to test the upgrade flow without spending money.
        </p>
      </main>

      <footer className="border-t py-6">
        <div className="text-muted-foreground mx-auto flex max-w-6xl items-center justify-between px-4 text-sm">
          <span>© 2026 Helpforge</span>
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
