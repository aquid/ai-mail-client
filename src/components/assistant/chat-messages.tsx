"use client";

import { ChatMessageData } from "@/hooks/use-assistant";
import { Bot, User } from "lucide-react";
import clsx from "clsx";
import { useEffect, useRef } from "react";

export function ChatMessages({
  messages,
  isStreaming,
}: {
  messages: ChatMessageData[];
  isStreaming: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-foreground/30 text-sm space-y-2">
          <Bot className="h-8 w-8" />
          <p>Ask me to help with your emails</p>
          <p className="text-xs text-foreground/20">
            e.g. &quot;Show unread emails from last week&quot;
          </p>
        </div>
      )}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={clsx(
            "flex gap-2",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {msg.role === "assistant" && (
            <div className="mt-0.5 shrink-0 rounded-full bg-foreground/5 p-1.5">
              <Bot className="h-3.5 w-3.5" />
            </div>
          )}
          <div
            className={clsx(
              "max-w-[85%] rounded-lg px-3 py-2 text-sm",
              msg.role === "user"
                ? "bg-foreground text-background"
                : "bg-foreground/5"
            )}
          >
            {msg.content}
            {msg.toolResults && msg.toolResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {msg.toolResults.map((result, i) => (
                  <div
                    key={i}
                    className="rounded border border-foreground/10 bg-background/50 px-2 py-1 text-xs text-foreground/60"
                  >
                    {result.tool}: {result.summary}
                  </div>
                ))}
              </div>
            )}
          </div>
          {msg.role === "user" && (
            <div className="mt-0.5 shrink-0 rounded-full bg-foreground/10 p-1.5">
              <User className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      ))}
      {isStreaming && (
        <div className="flex gap-2">
          <div className="mt-0.5 shrink-0 rounded-full bg-foreground/5 p-1.5">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="rounded-lg bg-foreground/5 px-3 py-2 text-sm">
            <span className="animate-pulse">Thinking...</span>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
