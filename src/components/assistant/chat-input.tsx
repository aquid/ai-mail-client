"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

export function ChatInput({
  onSend,
  isStreaming,
}: {
  onSend: (message: string) => void;
  isStreaming: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setInput("");
  };

  return (
    <div className="border-t border-foreground/10 p-3">
      <div className="flex items-end gap-2">
        <TextareaAutosize
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask the AI assistant..."
          maxRows={4}
          className="flex-1 resize-none rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="shrink-0 rounded-lg bg-foreground p-2 text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
