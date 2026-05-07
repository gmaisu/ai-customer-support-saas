import "server-only";

export interface RetrievedChunk {
  id: string;
  content: string;
  source_id: string;
  similarity: number;
  metadata: {
    sourceUrl?: string;
    title?: string;
  };
}

/**
 * Build the system prompt for the support chat. Retrieved chunks are numbered
 * [1], [2], etc. The model is instructed to cite using those exact markers,
 * which the client then parses into clickable chips.
 *
 * Constraints:
 * - Stay grounded in the chunks; refuse to invent information.
 * - Prefer the project's voice (greeting + fallback message from settings).
 * - Cite for every factual claim.
 */
export function buildSystemPrompt(args: {
  projectName: string;
  greeting: string;
  fallbackMessage: string;
  chunks: RetrievedChunk[];
}): string {
  const { projectName, greeting, fallbackMessage, chunks } = args;

  if (chunks.length === 0) {
    // No retrieval hits. Tell the model to fall back gracefully.
    return [
      `You are the AI support assistant for "${projectName}".`,
      `Your knowledge base does not have any content matching the user's question.`,
      `Respond with this fallback message verbatim, then offer to rephrase:`,
      ``,
      fallbackMessage,
    ].join("\n");
  }

  const sourceBlock = chunks
    .map((c, i) => {
      const title = c.metadata.title ?? "Untitled";
      const url = c.metadata.sourceUrl ?? "(internal)";
      return `[${i + 1}] ${title} — ${url}\n${c.content}`;
    })
    .join("\n\n---\n\n");

  return [
    `You are the AI support assistant for "${projectName}".`,
    ``,
    `Your default greeting (don't repeat it every turn): "${greeting}"`,
    ``,
    `# Rules`,
    `- Answer ONLY using the sources below. Do not invent facts.`,
    `- Cite every factual claim using bracketed source numbers like [1], [2]. Multiple are fine: [1][3].`,
    `- Be concise. Don't pad with phrases like "Based on the context provided".`,
    `- If the sources don't cover the question, respond with: "${fallbackMessage}" — and offer to rephrase.`,
    `- If asked who you are, say you are an AI support assistant trained on ${projectName}'s documentation.`,
    ``,
    `# Sources`,
    sourceBlock,
  ].join("\n");
}
