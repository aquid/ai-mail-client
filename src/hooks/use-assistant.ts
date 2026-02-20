"use client";

import { useState, useCallback, useRef } from "react";
import { executeToolCall } from "@/lib/ai/executor";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolResults?: { tool: string; summary: string }[];
}

interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: unknown;
  };
}

interface GeminiMessage {
  role: "user" | "model" | "function";
  parts: GeminiPart[];
}

export function useAssistant() {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const conversationRef = useRef<GeminiMessage[]>([]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const userMsg: ChatMessageData = {
        id: crypto.randomUUID(),
        role: "user",
        content: userMessage,
      };
      setMessages((prev) => [...prev, userMsg]);
      conversationRef.current.push({
        role: "user",
        parts: [{ text: userMessage }],
      });

      setIsStreaming(true);
      try {
        await runAssistantLoop(conversationRef.current, setMessages);
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  return { messages, isStreaming, sendMessage };
}

async function runAssistantLoop(
  conversation: GeminiMessage[],
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageData[]>>
) {
  const MAX_TOOL_ROUNDS = 10;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: ${errorText}`,
        },
      ]);
      return;
    }

    const data = await res.json();
    const { parts, finishReason } = data;

    // Extract text parts and function calls
    const textParts: string[] = [];
    const functionCalls: { name: string; args: Record<string, unknown> }[] = [];
    const toolResultSummaries: { tool: string; summary: string }[] = [];

    for (const part of parts) {
      if (part.text) {
        textParts.push(part.text);
      } else if (part.functionCall) {
        functionCalls.push(part.functionCall);
      }
    }

    // Add model response to conversation history
    conversation.push({ role: "model", parts });

    if (functionCalls.length === 0) {
      // No tools, just text response
      if (textParts.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: textParts.join("\n"),
            toolResults: toolResultSummaries,
          },
        ]);
      }
      return;
    }

    // Execute function calls
    const functionResponseParts: GeminiPart[] = [];
    for (const fc of functionCalls) {
      const result = await executeToolCall(fc.name, fc.args);
      toolResultSummaries.push({ tool: fc.name, summary: result.summary });
      functionResponseParts.push({
        functionResponse: {
          name: fc.name,
          response: result.data,
        },
      });
    }

    // Add text + tool results to UI
    if (textParts.length > 0 || toolResultSummaries.length > 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: textParts.join("\n") || "Using tools...",
          toolResults: toolResultSummaries,
        },
      ]);
    }

    // Feed function responses back to conversation
    conversation.push({ role: "function", parts: functionResponseParts });
  }
}
