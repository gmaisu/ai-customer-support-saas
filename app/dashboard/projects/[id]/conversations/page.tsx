import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConversationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation history</CardTitle>
        <CardDescription>Coming in Phase 5 (TASK-503/504).</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Once the chat playground is live, every conversation gets persisted here. List view
          paginates and a detail view replays the full thread with citations.
        </p>
      </CardContent>
    </Card>
  );
}
