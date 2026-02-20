"use client";

import { useMailStore, EmailDetail } from "@/hooks/use-mail-store";
import { ArrowLeft, Reply, Forward } from "lucide-react";
import { format } from "date-fns";
import DOMPurify from "dompurify";

function ThreadMessage({ message, isLast }: { message: EmailDetail; isLast: boolean }) {
  const { openCompose } = useMailStore();

  const handleReply = () => {
    openCompose({
      to: message.from || "",
      subject: message.subject?.startsWith("Re:")
        ? message.subject
        : `Re: ${message.subject || ""}`,
      body: `\n\n---\nOn ${message.date ? format(new Date(message.date), "PPP") : ""}, ${message.from} wrote:\n> ${message.bodyText?.split("\n").join("\n> ") || ""}`,
      replyToId: message.id,
    });
  };

  const handleForward = () => {
    openCompose({
      to: "",
      subject: message.subject?.startsWith("Fwd:")
        ? message.subject
        : `Fwd: ${message.subject || ""}`,
      body: `\n\n---\nForwarded message from ${message.from}:\n\n${message.bodyText || ""}`,
    });
  };

  return (
    <div className="rounded-lg border border-foreground/10 p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">From:</span> {message.from}
          </div>
          <div>
            <span className="font-medium">To:</span> {message.to}
          </div>
          {message.cc && (
            <div>
              <span className="font-medium">Cc:</span> {message.cc}
            </div>
          )}
          <div className="text-foreground/40">
            {message.date ? format(new Date(message.date), "PPPp") : ""}
          </div>
        </div>
      </div>

      <div className="mt-3">
        {message.body ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(message.body),
            }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm">
            {message.bodyText || ""}
          </pre>
        )}
      </div>

      {isLast && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleReply}
            className="flex items-center gap-1 rounded-lg border border-foreground/10 px-3 py-1.5 text-sm transition-colors hover:bg-foreground/5"
          >
            <Reply className="h-4 w-4" />
            Reply
          </button>
          <button
            onClick={handleForward}
            className="flex items-center gap-1 rounded-lg border border-foreground/10 px-3 py-1.5 text-sm transition-colors hover:bg-foreground/5"
          >
            <Forward className="h-4 w-4" />
            Forward
          </button>
        </div>
      )}
    </div>
  );
}

export function EmailDetailView() {
  const { selectedEmail, threadMessages, navigate } = useMailStore();

  if (!selectedEmail) {
    return (
      <div className="flex items-center justify-center p-8 text-foreground/40">
        Loading email...
      </div>
    );
  }

  const messages = threadMessages.length > 0 ? threadMessages : [selectedEmail];

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-3xl p-6">
        <button
          onClick={() => navigate("inbox")}
          className="mb-4 flex items-center gap-1 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="mb-4 text-xl font-semibold">
          {selectedEmail.subject || "(no subject)"}
        </h1>

        {messages.length > 1 && (
          <div className="mb-4 text-sm text-foreground/40">
            {messages.length} messages in this thread
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <ThreadMessage
              key={msg.id}
              message={msg}
              isLast={i === messages.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
