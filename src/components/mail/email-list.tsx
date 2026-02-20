"use client";

import { useMailStore, EmailSummary } from "@/hooks/use-mail-store";
import { useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Star, Mail, MailOpen } from "lucide-react";
import clsx from "clsx";

export function EmailList({ label }: { label: "INBOX" | "SENT" | "DRAFT" }) {
  const { emails, setEmails, openEmail, setSelectedEmail, setThreadMessages, filters, isLoading, setIsLoading } =
    useMailStore();

  const fetchEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("label", label);
      if (filters.keyword) params.set("keyword", filters.keyword);
      if (filters.from) params.set("from", filters.from);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.isRead !== undefined && filters.isRead !== null)
        params.set("isRead", String(filters.isRead));

      const res = await fetch(`/api/gmail/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
      }
    } finally {
      setIsLoading(false);
    }
  }, [label, filters, setEmails, setIsLoading]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleOpen = async (email: EmailSummary) => {
    openEmail(email.id);
    const res = await fetch(`/api/gmail/messages/${email.id}`);
    if (res.ok) {
      const data = await res.json();
      setSelectedEmail(data.email);
      if (data.thread) setThreadMessages(data.thread);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-foreground/40">
        Loading...
      </div>
    );
  }

  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-foreground/40">
        No emails found
      </div>
    );
  }

  return (
    <div className="divide-y divide-foreground/5">
      {emails.map((email) => (
        <button
          key={email.id}
          onClick={() => handleOpen(email)}
          className={clsx(
            "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/5",
            !email.isRead && "bg-foreground/[0.02]"
          )}
        >
          <div className="mt-0.5">
            {email.isRead ? (
              <MailOpen className="h-4 w-4 text-foreground/30" />
            ) : (
              <Mail className="h-4 w-4 text-blue-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <span
                  className={clsx(
                    "truncate text-sm",
                    !email.isRead && "font-semibold"
                  )}
                >
                  {email.from || "Unknown"}
                </span>
                {email.messageCount && email.messageCount > 1 && (
                  <span className="shrink-0 rounded bg-foreground/10 px-1.5 py-0.5 text-xs text-foreground/60">
                    {email.messageCount}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs text-foreground/40">
                {email.date
                  ? formatDistanceToNow(new Date(email.date), {
                      addSuffix: true,
                    })
                  : ""}
              </span>
            </div>
            <div
              className={clsx(
                "truncate text-sm",
                !email.isRead ? "font-medium" : "text-foreground/70"
              )}
            >
              {email.subject || "(no subject)"}
            </div>
            <div className="truncate text-xs text-foreground/40">
              {email.snippet}
            </div>
          </div>
          {email.isStarred && (
            <Star className="mt-0.5 h-4 w-4 shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </button>
      ))}
    </div>
  );
}
