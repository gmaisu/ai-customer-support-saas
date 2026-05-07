import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProject } from "@/lib/db/projects";
import { getUserOpenAIKey, checkAndIncrementChatQuota } from "@/lib/db/profile";
import { createConversation, getConversation } from "@/lib/db/conversations";
import { addMessage, recentMessagesForContext } from "@/lib/db/messages";
import { addUnanswered } from "@/lib/db/unanswered";
import { retrieveContext } from "@/lib/retrieval";
import { buildSystemPrompt } from "@/lib/prompts";
import { isValidOpenAIKeyShape } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 30;

const CHAT_MODEL = "gpt-4o-mini";

/**
 * POST /api/chat
 *
 * Body:
 *   {
 *     projectId: string,
 *     conversationId: string | null,
 *     messages: UIMessage[]   // chat history including the new user message
 *   }
 *
 * Auth + BYOK gate, then:
 *   1. Embed the latest user message
 *   2. Retrieve top-5 chunks for the project
 *   3. Stream a chat completion with retrieval-augmented system prompt
 *   4. On finish, persist user + assistant rows + sources mapping
 *
 * Returns a UI message stream that the client's useChat hook consumes.
 * Sources for citations are attached as message metadata so the client
 * can render numbered chips after the stream completes.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    projectId?: string;
    conversationId?: string | null;
    messages?: UIMessage[];
  };

  if (!body.projectId || !body.messages || body.messages.length === 0) {
    return NextResponse.json({ error: "Missing projectId or messages" }, { status: 400 });
  }

  // ─── auth + BYOK gate ─────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getUserOpenAIKey(user.id);
  if (!apiKey || !isValidOpenAIKeyShape(apiKey)) {
    return NextResponse.json(
      { error: "OpenAI key not configured", hint: "Add your key in Account." },
      { status: 412 },
    );
  }

  // ─── per-user daily rate limit (BYOK-soft, just abuse prevention) ────────
  const quota = await checkAndIncrementChatQuota(user.id);
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: "Daily chat limit reached",
        hint: `You've sent ${quota.limit} messages today. Limit resets at the same time tomorrow.`,
      },
      { status: 429 },
    );
  }

  const project = await getProject(body.projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // ─── conversation continuity ──────────────────────────────────────────────
  let conversationId = body.conversationId ?? null;
  if (conversationId) {
    const existing = await getConversation(conversationId);
    if (!existing || existing.project_id !== project.id) {
      // Conversation id belongs to someone else or doesn't exist. Start fresh.
      conversationId = null;
    }
  }
  if (!conversationId) {
    const created = await createConversation(project.id);
    conversationId = created.id;
  }

  // ─── extract the new user message text ───────────────────────────────────
  const lastMessage = body.messages[body.messages.length - 1];
  const userText = lastMessage.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("\n")
    .trim();

  if (!userText) {
    return NextResponse.json({ error: "Last message has no text" }, { status: 400 });
  }

  // ─── retrieval ───────────────────────────────────────────────────────────
  const chunks = await retrieveContext({
    apiKey,
    projectId: project.id,
    query: userText,
  });
  const topConfidence = chunks[0]?.similarity ?? 0;

  // ─── build prompt + stream ───────────────────────────────────────────────
  const system = buildSystemPrompt({
    projectName: project.name,
    greeting: project.greeting,
    fallbackMessage: project.fallback_message,
    chunks,
  });

  // Pull the last few turns of conversation history (excludes the current
  // user message we're about to answer) so the model has continuity.
  const history = await recentMessagesForContext(conversationId, 6);

  const openai = createOpenAI({ apiKey });

  // Persist the user message synchronously so it's in the DB even if the
  // stream errors out partway through.
  const userMessage = await addMessage({
    conversationId,
    role: "user",
    content: userText,
  });

  // Sources mapped to citation indices for the client to render.
  const sources = chunks.map((c, i) => ({
    index: i + 1,
    chunkId: c.id,
    sourceId: c.source_id,
    sourceUrl: c.metadata.sourceUrl ?? null,
    title: c.metadata.title ?? null,
    similarity: c.similarity,
  }));

  const finalConversationId = conversationId;

  const modelMessages = await convertToModelMessages([
    ...(history.map((m) => ({
      role: m.role,
      parts: [{ type: "text" as const, text: m.content }],
    })) as UIMessage[]),
    { role: "user", parts: [{ type: "text", text: userText }] } as UIMessage,
  ]);

  const result = streamText({
    model: openai(CHAT_MODEL),
    system,
    messages: modelMessages,
    temperature: 0.3,
    onFinish: async ({ text }) => {
      try {
        const assistantMessage = await addMessage({
          conversationId: finalConversationId,
          role: "assistant",
          content: text,
          citations: chunks.map((c) => c.id),
          confidence: topConfidence,
        });

        // ─── unanswered detection (TASK-308) ────────────────────────────────
        // Flag a question as unanswered when:
        //   1. Top retrieval similarity is below the threshold (no good chunks), OR
        //   2. The model explicitly punted with a fallback phrase
        // The unanswered table powers the Phase 5 analytics list.
        const UNANSWERED_THRESHOLD = 0.7;
        const fallbackPattern =
          /\b(i don'?t (?:know|have)|i'?m not sure|i don'?t have (?:information|details|enough))\b/i;
        const isUnanswered = topConfidence < UNANSWERED_THRESHOLD || fallbackPattern.test(text);

        if (isUnanswered) {
          await addUnanswered({
            conversationId: finalConversationId,
            messageId: userMessage.id,
            question: userText,
          }).catch((e) => {
            console.error("[chat] Failed to log unanswered question:", e);
          });
        }
        // assistantMessage referenced for clarity — no need to use, but kept
        // as a hook point if Phase 5 wants the assistant id later.
        void assistantMessage;
      } catch (e) {
        console.error("[chat] Failed to persist assistant message:", e);
      }
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return { conversationId: finalConversationId, sources };
      }
    },
  });
}
