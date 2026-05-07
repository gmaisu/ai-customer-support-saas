import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnProfile } from "@/lib/db/profile";
import { OpenAIKeyForm } from "@/components/dashboard/openai-key-form";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { PortalButton } from "@/components/billing/portal-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Account — Helpforge",
};

export default async function SettingsPage() {
  const profile = await getOwnProfile();
  if (!profile) redirect("/login");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground text-sm">Profile, API key, plan.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>OpenAI API key</CardTitle>
          <CardDescription>
            Helpforge is BYOK — bring your own OpenAI key. We use it to embed your sources and
            answer chat messages on your behalf. You pay OpenAI directly; Helpforge never sees a
            cent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OpenAIKeyForm existingKey={profile.openai_api_key} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Connected via Supabase Auth.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Plan</span>
            <Badge variant={profile.plan === "pro" ? "default" : "secondary"}>{profile.plan}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Member since</span>
            <span className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
          <CardDescription>
            {profile.plan === "pro"
              ? "You're on Pro. Manage your subscription in the Stripe Customer Portal."
              : "Free plan. Upgrade for larger crawls, more projects, and higher daily chat limits. AI usage stays BYOK either way."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {profile.plan === "pro" ? (
            <PortalButton />
          ) : (
            <>
              <UpgradeButton size="sm">Upgrade to Pro — test mode</UpgradeButton>
              <Button variant="ghost" size="sm" render={<Link href="/pricing" />}>
                Compare plans
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
