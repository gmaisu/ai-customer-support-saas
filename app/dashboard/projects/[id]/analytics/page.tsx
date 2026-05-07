import Link from "next/link";
import { ChevronRightIcon, MessageSquareIcon, AlertTriangleIcon } from "lucide-react";
import { getProjectStats } from "@/lib/db/analytics";
import { listUnansweredForProject } from "@/lib/db/unanswered";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [stats, unanswered] = await Promise.all([
    getProjectStats(id, 30),
    listUnansweredForProject(id, 10),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-sm font-semibold tracking-tight">Last 30 days</h2>
        <p className="text-muted-foreground text-xs">
          Updated when a conversation starts, a message is sent, or a question goes unanswered.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <MessageSquareIcon className="size-3.5" /> Total conversations
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalConversations}</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            {stats.totalMessages.toLocaleString()} messages exchanged.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <AlertTriangleIcon className="size-3.5" /> Unanswered rate
            </CardDescription>
            <CardTitle className="text-3xl">{stats.unansweredPercent.toFixed(1)}%</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-xs">
            {stats.totalUnanswered} of {stats.totalConversations} conversations had at least one
            unanswered question.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversations per day</CardTitle>
          <CardDescription>Daily count, rolling 30-day window.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.totalConversations === 0 ? (
            <div className="text-muted-foreground py-12 text-center text-sm">
              No conversations yet. Try the Chat tab.
            </div>
          ) : (
            <AnalyticsChart data={stats.dailyConversations} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent unanswered questions</CardTitle>
          <CardDescription>
            Flagged when retrieval similarity is low or the assistant says &ldquo;I don&apos;t
            know.&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unanswered.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              No unanswered questions yet — your knowledge base is covering everything.
            </p>
          ) : (
            <ul className="divide-y">
              {unanswered.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/dashboard/projects/${id}/conversations/${u.conversation_id}`}
                    className="hover:bg-muted/50 flex items-start gap-3 p-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm">{u.question}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {new Date(u.created_at).toLocaleString()}
                      </p>
                    </div>
                    <ChevronRightIcon className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
