import Link from "next/link";
import { getOwnProfile } from "@/lib/db/profile";
import { listSources } from "@/lib/db/sources";
import { ChatPanel } from "@/components/chat/chat-panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, sources] = await Promise.all([getOwnProfile(), listSources(id)]);
  const hasKey = !!profile?.openai_api_key;
  const readySources = sources.filter((s) => s.status === "ready");
  const hasChunks = readySources.length > 0;

  return (
    <div className="space-y-4">
      {!hasKey && (
        <Alert>
          <AlertTitle>Connect your OpenAI key to start chatting</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>Helpforge uses your key to embed your question and stream a grounded reply.</p>
            <Button size="sm" render={<Link href="/dashboard/settings" />}>
              Add your key
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {hasKey && !hasChunks && (
        <Alert>
          <AlertTitle>No knowledge to chat against yet</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              Crawl at least one URL on the Sources tab so the chatbot has something to ground its
              answers in.
            </p>
            <Button size="sm" render={<Link href={`/dashboard/projects/${id}/sources`} />}>
              Go to Sources
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <ChatPanel projectId={id} hasOpenAIKey={hasKey} hasChunks={hasChunks} />
    </div>
  );
}
