import Link from "next/link";
import { listSources } from "@/lib/db/sources";
import { getOwnProfile } from "@/lib/db/profile";
import { UrlSourceForm } from "@/components/dashboard/url-source-form";
import { SourcesList } from "@/components/dashboard/sources-list";
import { SourcesRealtime } from "@/components/dashboard/sources-realtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default async function SourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [sources, profile] = await Promise.all([listSources(id), getOwnProfile()]);
  const hasKey = !!profile?.openai_api_key;

  return (
    <div className="space-y-6">
      <SourcesRealtime projectId={id} />

      {!hasKey && (
        <Alert>
          <AlertTitle>Connect your OpenAI key to start crawling</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Helpforge is BYOK — you supply the OpenAI key, you pay OpenAI directly, and crawls
              embed pages into a knowledge base. Without a key the crawler stays disabled.
            </p>
            <Button size="sm" render={<Link href="/dashboard/settings" />}>
              Add your key
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add a website</CardTitle>
          <CardDescription>
            Paste a URL — Helpforge will crawl up to 25 pages and turn them into a knowledge base.
            PDF upload and pasted FAQ text land in Phase 4.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UrlSourceForm projectId={id} disabled={!hasKey} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Sources</h2>
        <SourcesList projectId={id} sources={sources} />
      </section>
    </div>
  );
}
