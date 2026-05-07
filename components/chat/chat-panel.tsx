"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import { SendIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "./message-bubble";

export function ChatPanel({
  projectId,
  hasOpenAIKey,
  hasChunks,
}: {
  projectId: string;
  hasOpenAIKey: boolean;
  hasChunks: boolean;
}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: {
          projectId,
          conversationId,
          messages,
        },
      }),
    }),
    onFinish: ({ message }) => {
      const meta = message.metadata as { conversationId?: string } | undefined;
      if (meta?.conversationId) setConversationId(meta.conversationId);
    },
  });

  // Auto-scroll to bottom on new messages.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Surface API errors as toasts.
  useEffect(() => {
    if (!error) return;
    const message = error.message ?? "Chat failed";
    if (message.toLowerCase().includes("openai key not configured")) {
      toast.error("Add your OpenAI key in Account before chatting.");
    } else {
      toast.error(message);
    }
  }, [error]);

  const handleSend = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || status === "streaming" || status === "submitted") return;
      sendMessage({ text });
      setInput("");
    },
    [input, sendMessage, status],
  );

  const handleNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setInput("");
  };

  const disabled = !hasOpenAIKey || !hasChunks;
  const lastIsAssistantStreaming =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    (status === "streaming" || status === "submitted");

  return (
    <div className="flex h-[calc(100vh-22rem)] min-h-[400px] flex-col rounded-md border">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <p className="text-muted-foreground text-xs">
          {conversationId ? "Conversation" : "New chat"}
        </p>
        <Button variant="ghost" size="sm" onClick={handleNewChat} disabled={messages.length === 0}>
          <RotateCcwIcon className="size-3" />
          Reset
        </Button>
      </header>

      <div ref={scrollerRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground text-sm">
              {disabled
                ? "Crawl a source and add your OpenAI key to start chatting."
                : "Ask a question grounded in your sources."}
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble
            key={m.id}
            message={m}
            isStreaming={i === messages.length - 1 && lastIsAssistantStreaming}
          />
        ))}
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            disabled
              ? "Add a source and your OpenAI key first…"
              : "Ask anything about your sources…"
          }
          disabled={disabled || status === "streaming" || status === "submitted"}
          autoFocus={!disabled}
        />
        <Button
          type="submit"
          disabled={disabled || !input.trim() || status === "streaming" || status === "submitted"}
        >
          <SendIcon className="size-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
