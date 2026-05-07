import { listSources } from "@/lib/db/sources";
import { UrlSourceForm } from "@/components/dashboard/url-source-form";
import { SourcesList } from "@/components/dashboard/sources-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SourcesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sources = await listSources(id);

  return (
    <div className="space-y-6">
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
