import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata = {
  title: "Dashboard — Helpforge",
};

export default async function DashboardPage() {
  // The middleware already redirects unauthenticated users, but this is a
  // belt-and-suspenders check in case someone bypasses the middleware path.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <div className="flex items-center gap-2 font-semibold">
            <Logo size={24} />
            Helpforge
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          You&apos;re signed in. The real dashboard ships in Phase 2 (TASK-201 onward).
        </p>
      </main>
    </div>
  );
}
