import Link from "next/link";
import { ChevronRightIcon, MessageSquareIcon } from "lucide-react";
import { listConversationsWithPreview } from "@/lib/db/conversations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ConversationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(0, Number(pageParam ?? "0"));
  const pageSize = 20;

  const { items, total } = await listConversationsWithPreview(id, page, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <div className="bg-muted text-muted-foreground rounded-full p-4">
            <MessageSquareIcon className="size-6" />
          </div>
          <p className="font-medium">No conversations yet</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Once someone chats with this bot, every conversation lands here. Try the Chat tab to
            start one.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-tight">{total} conversations</h2>
        <p className="text-muted-foreground text-xs">
          Page {page + 1} of {totalPages}
        </p>
      </header>

      <ul className="divide-y rounded-md border">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/dashboard/projects/${id}/conversations/${c.id}`}
              className="hover:bg-muted/50 flex items-start gap-3 p-3 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-medium">
                  {c.preview ?? <span className="text-muted-foreground italic">No messages</span>}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {c.message_count} messages · {new Date(c.started_at).toLocaleString()}
                </p>
              </div>
              <ChevronRightIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <nav className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            render={
              <Link
                href={`/dashboard/projects/${id}/conversations?page=${Math.max(0, page - 1)}`}
              />
            }
          >
            ← Newer
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page + 1 >= totalPages}
            render={<Link href={`/dashboard/projects/${id}/conversations?page=${page + 1}`} />}
          >
            Older →
          </Button>
        </nav>
      )}
    </div>
  );
}
