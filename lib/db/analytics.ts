import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface DailyCount {
  /** YYYY-MM-DD in UTC */
  date: string;
  count: number;
}

export interface ProjectStats {
  totalConversations: number;
  totalMessages: number;
  totalUnanswered: number;
  unansweredPercent: number; // 0..100, rounded to one decimal
  dailyConversations: DailyCount[];
}

const DEFAULT_WINDOW_DAYS = 30;

/**
 * Compute analytics for a project over a rolling window.
 *
 * Two stat cards + the line chart all read from this. Aggregations are done
 * client-side here because window is small (30 days) and at portfolio scale
 * the conversation/message counts will not stress the round-trip.
 */
export async function getProjectStats(
  projectId: string,
  windowDays = DEFAULT_WINDOW_DAYS,
): Promise<ProjectStats> {
  const supabase = await createClient();
  const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

  const [conversationsResp, messagesResp, unansweredResp] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, started_at")
      .eq("project_id", projectId)
      .gte("started_at", since.toISOString()),
    supabase
      .from("messages")
      .select("conversation_id, conversations!inner(project_id)", { count: "exact", head: true })
      .eq("conversations.project_id", projectId)
      .gte("created_at", since.toISOString()),
    supabase
      .from("unanswered")
      .select("id, conversations!inner(project_id)", { count: "exact", head: true })
      .eq("conversations.project_id", projectId)
      .gte("created_at", since.toISOString()),
  ]);

  if (conversationsResp.error) throw new Error(conversationsResp.error.message);
  if (messagesResp.error) throw new Error(messagesResp.error.message);
  if (unansweredResp.error) throw new Error(unansweredResp.error.message);

  const conversations = conversationsResp.data ?? [];
  const totalConversations = conversations.length;
  const totalMessages = messagesResp.count ?? 0;
  const totalUnanswered = unansweredResp.count ?? 0;
  const unansweredPercent = totalConversations
    ? Math.round((totalUnanswered / totalConversations) * 1000) / 10
    : 0;

  // Bucket by UTC day. Pre-fill the window so the chart renders flat zeros
  // on quiet days instead of skipping them.
  const buckets = new Map<string, number>();
  for (let i = 0; i < windowDays; i++) {
    const d = new Date(Date.now() - (windowDays - 1 - i) * 24 * 60 * 60 * 1000);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const c of conversations) {
    const day = c.started_at.slice(0, 10);
    buckets.set(day, (buckets.get(day) ?? 0) + 1);
  }

  const dailyConversations: DailyCount[] = Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    count,
  }));

  return {
    totalConversations,
    totalMessages,
    totalUnanswered,
    unansweredPercent,
    dailyConversations,
  };
}
