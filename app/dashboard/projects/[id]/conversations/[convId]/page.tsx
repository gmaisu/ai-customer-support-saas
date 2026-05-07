import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { getConversation } from "@/lib/db/conversations";
import { listMessages } from "@/lib/db/messages";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";

/**
 * Read-only replay of one conversation. No input box — this is for review,
 * not continuing the conversation.
 */
export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string; convId: string }>;
}) {
  const { id, convId } = await params;

  const conversation = await getConversation(convId);
  if (!conversation || conversation.project_id !== id) notFound();

  const messages = await listMessages(convId);

  return (
    <div className="space-y-4">
      <Link
        href={`/dashboard/projects/${id}/conversations`}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ChevronLeftIcon className="size-4" /> All conversations
      </Link>

      <header className="space-y-1">
        <h2 className="text-sm font-semibold tracking-tight">
          Started {new Date(conversation.started_at).toLocaleString()}
        </h2>
        <p className="text-muted-foreground text-xs">{messages.length} messages</p>
      </header>

      {messages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="text-muted-foreground py-12 text-center text-sm">
            No messages in this conversation.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 rounded-md border p-4">
          {messages.map((m) => {
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end">
                  <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2 text-sm whitespace-pre-wrap">
                    {m.content}
                  </div>
                </div>
              );
            }
            return (
              <div key={m.id} className="flex gap-3">
                <Logo size={28} className="mt-1 shrink-0" />
                <div className="max-w-[85%] flex-1 space-y-1">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</div>
                  {m.confidence !== null && (
                    <p className="text-muted-foreground text-xs">
                      Top retrieval similarity: {(m.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
