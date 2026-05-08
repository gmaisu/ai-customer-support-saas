"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import { ArrowRightIcon, RotateCcwIcon, SendIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { MessageBubble } from "./message-bubble";

const SUGGESTED_PROMPTS = [
  "Give me a quick overview of the main concepts",
  "What's the recommended way to get started?",
  "What are the most common mistakes to avoid?",
];

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
        {messages.length === 0 &&
          (disabled ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <p className="text-muted-foreground text-sm">
                Crawl a source and add your OpenAI key to start chatting.
              </p>
            </div>
          ) : (
            <ChatEmpty
              onSelect={(prompt) => {
                setInput(prompt);
                sendMessage({ text: prompt });
                setInput("");
              }}
            />
          ))}

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

function ChatEmpty({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="flex flex-col gap-5 py-6">
      <div className="bg-muted flex items-center gap-3 rounded-xl border p-4">
        <Logo size={36} glow />
        <div>
          <div className="font-semibold">Ready when you are</div>
          <div className="text-muted-foreground text-sm">
            I&apos;m grounded in your project&apos;s indexed sources. Ask me anything.
          </div>
        </div>
      </div>
      <div>
        <span className="text-muted-foreground inline-flex items-center gap-1.5 px-1 font-mono text-[11px] tracking-[0.12em] uppercase">
          <SparklesIcon className="size-3" />
          Try one of these
        </span>
      </div>
      <div className="grid gap-2">
        {SUGGESTED_PROMPTS.map((p, i) => (
          <button
            key={p}
            type="button"
            onClick={() => onSelect(p)}
            className="bg-card hover:border-primary hover:bg-accent flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm transition-colors"
          >
            <span className="text-muted-foreground font-mono text-[11px]">0{i + 1}</span>
            <span className="flex-1">{p}</span>
            <ArrowRightIcon className="text-muted-foreground size-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
