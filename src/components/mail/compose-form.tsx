"use client";

import { useMailStore } from "@/hooks/use-mail-store";
import { useState } from "react";
import { Send } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";

export function ComposeForm() {
  const { composeData, setComposeData, navigate, resetCompose, openEmail, setSelectedEmail, setThreadMessages } =
    useMailStore();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!composeData.to || !composeData.subject) {
      setError("To and Subject are required");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const replyToId = composeData.replyToId;
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composeData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }
      resetCompose();

      // If replying, navigate back to the original email with full thread
      if (replyToId) {
        openEmail(replyToId);
        const emailRes = await fetch(`/api/gmail/messages/${replyToId}`);
        if (emailRes.ok) {
          const emailData = await emailRes.json();
          setSelectedEmail(emailData.email);
          if (emailData.thread) setThreadMessages(emailData.thread);
        }
      } else {
        navigate("sent");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">To</label>
          <input
            type="text"
            value={composeData.to}
            onChange={(e) => setComposeData({ to: e.target.value })}
            className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
            placeholder="recipient@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Cc</label>
          <input
            type="text"
            value={composeData.cc || ""}
            onChange={(e) => setComposeData({ cc: e.target.value })}
            className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Subject</label>
          <input
            type="text"
            value={composeData.subject}
            onChange={(e) => setComposeData({ subject: e.target.value })}
            className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Message</label>
          <TextareaAutosize
            value={composeData.body}
            onChange={(e) => setComposeData({ body: e.target.value })}
            minRows={10}
            className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/30"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {sending ? "Sending..." : "Send"}
          </button>
          <button
            onClick={() => {
              resetCompose();
              navigate("inbox");
            }}
            className="rounded-lg border border-foreground/10 px-4 py-2 text-sm transition-colors hover:bg-foreground/5"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
