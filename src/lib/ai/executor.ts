import { useMailStore } from "@/hooks/use-mail-store";

export interface ToolCallResult {
  data: unknown;
  summary: string;
}

export async function executeToolCall(
  toolName: string,
  input: Record<string, unknown>
): Promise<ToolCallResult> {
  const store = useMailStore.getState();

  switch (toolName) {
    case "search_emails": {
      // Gemini may send snake_case or camelCase — handle both
      const dateFrom = (input.date_from || input.dateFrom) as string | undefined;
      const dateTo = (input.date_to || input.dateTo) as string | undefined;
      const isRead = input.is_read ?? input.isRead;
      const keyword = input.keyword as string | undefined;
      const fromFilter = input.from as string | undefined;
      const label = (input.label as string) || "INBOX";

      console.log("[search_emails] input:", JSON.stringify(input));

      const params = new URLSearchParams();
      params.set("label", label);
      if (keyword) params.set("keyword", keyword);
      if (fromFilter) params.set("from", fromFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (isRead !== undefined)
        params.set("isRead", String(isRead));

      const res = await fetch(`/api/gmail/messages?${params}`);
      const data = await res.json();

      useMailStore.setState({
        emails: data.emails,
        filters: {
          keyword: keyword || undefined,
          from: fromFilter || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          isRead: isRead as boolean | undefined,
        },
        currentView: "inbox",
      });

      return {
        data: {
          count: data.emails.length,
          emails: data.emails.slice(0, 5).map((e: { id: string; from: string; subject: string; date: string; isRead: boolean }) => ({
            id: e.id,
            from: e.from,
            subject: e.subject,
            date: e.date,
            isRead: e.isRead,
          })),
        },
        summary: `Found ${data.emails.length} emails`,
      };
    }

    case "open_email": {
      const emailId = input.email_id as string;
      store.openEmail(emailId);

      const res = await fetch(`/api/gmail/messages/${emailId}`);
      const data = await res.json();

      if (data.email) {
        store.setSelectedEmail(data.email);
        if (data.thread) store.setThreadMessages(data.thread);
        return {
          data: {
            id: data.email.id,
            from: data.email.from,
            to: data.email.to,
            subject: data.email.subject,
            date: data.email.date,
            bodyText: data.email.bodyText?.substring(0, 500),
          },
          summary: `Opened: ${data.email.subject}`,
        };
      }

      return { data: { error: "Email not found" }, summary: "Email not found" };
    }

    case "compose_email": {
      store.openCompose({
        to: (input.to as string) || "",
        cc: (input.cc as string) || "",
        bcc: (input.bcc as string) || "",
        subject: (input.subject as string) || "",
        body: (input.body as string) || "",
        replyToId: (input.reply_to_id as string) || undefined,
      });

      return {
        data: { status: "compose_opened", to: input.to, subject: input.subject },
        summary: `Opened compose to ${input.to}`,
      };
    }

    case "send_email": {
      // First open compose so user can see what's being sent
      store.openCompose({
        to: (input.to as string) || "",
        cc: (input.cc as string) || "",
        bcc: (input.bcc as string) || "",
        subject: (input.subject as string) || "",
        body: (input.body as string) || "",
        replyToId: (input.reply_to_id as string) || undefined,
      });

      // Then trigger confirmation dialog
      const confirmed = await new Promise<boolean>((resolve) => {
        store.setConfirmation({
          id: crypto.randomUUID(),
          action: "Send Email",
          description: `To: ${input.to}\nSubject: ${input.subject}`,
          data: input,
          resolve,
        });
      });

      if (!confirmed) {
        return {
          data: { status: "cancelled" },
          summary: "User cancelled the send",
        };
      }

      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: input.to,
          cc: input.cc,
          bcc: input.bcc,
          subject: input.subject,
          body: input.body,
          replyToId: input.reply_to_id,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        return {
          data: { error: err.error },
          summary: `Failed to send: ${err.error}`,
        };
      }

      const data = await res.json();

      // Navigate back to the original email if replying, otherwise go to sent
      if (input.reply_to_id) {
        store.openEmail(input.reply_to_id as string);
        const emailRes = await fetch(`/api/gmail/messages/${input.reply_to_id}`);
        if (emailRes.ok) {
          const emailData = await emailRes.json();
          store.setSelectedEmail(emailData.email);
          if (emailData.thread) store.setThreadMessages(emailData.thread);
        }
      } else {
        store.navigate("sent");
      }

      return {
        data: { status: "sent", messageId: data.messageId },
        summary: `Email sent to ${input.to}`,
      };
    }

    case "apply_filters": {
      const filters = {
        keyword: (input.keyword as string) || undefined,
        from: (input.from as string) || undefined,
        dateFrom: ((input.date_from || input.dateFrom) as string) || undefined,
        dateTo: ((input.date_to || input.dateTo) as string) || undefined,
        isRead: (input.is_read ?? input.isRead) as boolean | undefined,
      };

      useMailStore.setState({ filters, currentView: "inbox" });

      return {
        data: { filters },
        summary: "Filters applied",
      };
    }

    case "get_current_context": {
      const state = useMailStore.getState();
      return {
        data: {
          currentView: state.currentView,
          selectedEmail: state.selectedEmail
            ? {
                id: state.selectedEmail.id,
                from: state.selectedEmail.from,
                to: state.selectedEmail.to,
                subject: state.selectedEmail.subject,
                bodyText: state.selectedEmail.bodyText?.substring(0, 500),
              }
            : null,
          filters: state.filters,
          emailCount: state.emails.length,
          visibleEmails: state.emails.slice(0, 5).map((e) => ({
            id: e.id,
            from: e.from,
            subject: e.subject,
            date: e.date,
            isRead: e.isRead,
          })),
        },
        summary: `Current view: ${state.currentView}, ${state.emails.length} emails visible`,
      };
    }

    case "mark_emails": {
      const emailIds = input.email_ids as string[];
      const action = input.action as string;

      for (const id of emailIds) {
        if (action === "read" || action === "unread") {
          await fetch(`/api/gmail/messages/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isRead: action === "read" }),
          });
        }
      }

      // Refresh emails
      const res = await fetch("/api/gmail/messages?label=INBOX");
      const data = await res.json();
      store.setEmails(data.emails);

      return {
        data: { marked: emailIds.length, action },
        summary: `Marked ${emailIds.length} email(s) as ${action}`,
      };
    }

    case "navigate": {
      const view = input.view as "inbox" | "sent" | "drafts" | "compose";
      store.navigate(view);

      if (view === "inbox" || view === "sent" || view === "drafts") {
        const labelMap: Record<string, string> = { inbox: "INBOX", sent: "SENT", drafts: "DRAFT" };
        const label = labelMap[view];
        const res = await fetch(`/api/gmail/messages?label=${label}`);
        const data = await res.json();
        store.setEmails(data.emails);
      }

      return {
        data: { view },
        summary: `Navigated to ${view}`,
      };
    }

    default:
      return {
        data: { error: `Unknown tool: ${toolName}` },
        summary: `Unknown tool: ${toolName}`,
      };
  }
}
