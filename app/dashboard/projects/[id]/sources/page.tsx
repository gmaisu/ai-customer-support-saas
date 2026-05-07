import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SourcesPage({ params }: { params: Promise<{ id: string }> }) {
  await params; // touch params so we can extend later

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a source</CardTitle>
          <CardDescription>Coming next: paste a URL and watch live crawl progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            URL ingestion form lands in TASK-205. PDF upload and FAQ paste land in Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
