import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat playground</CardTitle>
        <CardDescription>Coming in Phase 3.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Streaming responses, retrieval-grounded answers, and inline citations land in TASK-301
          through TASK-310. The chat needs the embedding pipeline (Phase 2) finished first.
        </p>
      </CardContent>
    </Card>
  );
}
