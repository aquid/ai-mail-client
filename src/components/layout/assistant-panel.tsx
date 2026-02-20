"use client";

import { ChatMessages } from "@/components/assistant/chat-messages";
import { ChatInput } from "@/components/assistant/chat-input";
import { ConfirmationDialog } from "@/components/assistant/confirmation-dialog";
import { useAssistant } from "@/hooks/use-assistant";
import { Bot } from "lucide-react";

export function AssistantPanel() {
  const { messages, isStreaming, sendMessage } = useAssistant();

  return (
    <aside className="flex h-full w-96 flex-col border-l border-foreground/10 bg-foreground/[0.02]">
      <div className="flex items-center gap-2 border-b border-foreground/10 px-4 py-3">
        <Bot className="h-5 w-5" />
        <h2 className="text-sm font-semibold">AI Assistant</h2>
      </div>

      <ChatMessages messages={messages} isStreaming={isStreaming} />
      <ConfirmationDialog />
      <ChatInput onSend={sendMessage} isStreaming={isStreaming} />
    </aside>
  );
}
