import { listSources } from "@/lib/db/sources";
import { isEmbeddingConfigured } from "@/lib/embeddings";
import { UrlSourceForm } from "@/components/dashboard/url-source-form";
import { SourcesList } from "@/components/dashboard/sources-list";
import { SourcesRealtime } from "@/components/dashboard/sources-realtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default async function SourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sources = await listSources(id);
  const embeddingConfigured = isEmbeddingConfigured();

  return (
    <div className="space-y-6">
      <SourcesRealtime projectId={id} />

      {!embeddingConfigured && (
        <Alert>
          <AlertTitle>OpenAI key not configured</AlertTitle>
          <AlertDescription>
            Crawls will succeed and chunks will be stored, but embeddings (and therefore the chat)
            won&apos;t work until <code>OPENAI_API_KEY</code> is set in the environment.
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
          <UrlSourceForm projectId={id} />
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Sources</h2>
        <SourcesList projectId={id} sources={sources} />
      </section>
    </div>
  );
}
