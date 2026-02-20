import { gmail_v1 } from "googleapis";

interface ParsedEmail {
  id: string;
  threadId: string | null;
  subject: string | null;
  from: string | null;
  to: string | null;
  cc: string | null;
  bcc: string | null;
  date: Date | null;
  snippet: string | null;
  body: string | null;
  bodyText: string | null;
  labelIds: string | null;
  isRead: boolean;
  isStarred: boolean;
}

function getHeader(
  headers: gmail_v1.Schema$MessagePartHeader[] | undefined,
  name: string
): string | null {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? null;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function extractBody(
  payload: gmail_v1.Schema$MessagePart | undefined
): { html: string | null; text: string | null } {
  if (!payload) return { html: null, text: null };

  let html: string | null = null;
  let text: string | null = null;

  if (payload.mimeType === "text/html" && payload.body?.data) {
    html = decodeBase64Url(payload.body.data);
  } else if (payload.mimeType === "text/plain" && payload.body?.data) {
    text = decodeBase64Url(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested.html) html = nested.html;
      if (nested.text) text = nested.text;
    }
  }

  return { html, text };
}

export function parseGmailMessage(
  msg: gmail_v1.Schema$Message
): ParsedEmail {
  const headers = msg.payload?.headers;
  const { html, text } = extractBody(msg.payload);
  const labels = msg.labelIds ?? [];
  const dateStr = getHeader(headers, "Date");

  return {
    id: msg.id!,
    threadId: msg.threadId ?? null,
    subject: getHeader(headers, "Subject"),
    from: getHeader(headers, "From"),
    to: getHeader(headers, "To"),
    cc: getHeader(headers, "Cc"),
    bcc: getHeader(headers, "Bcc"),
    date: dateStr ? new Date(dateStr) : null,
    snippet: msg.snippet ?? null,
    body: html,
    bodyText: text ?? (html ? null : null),
    labelIds: labels.join(","),
    isRead: !labels.includes("UNREAD"),
    isStarred: labels.includes("STARRED"),
  };
}
