import { getGmailClient } from "./client";
import { prisma } from "@/lib/db/prisma";

interface SendEmailParams {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  replyToId?: string;
}

function buildRawEmail(
  params: SendEmailParams,
  inReplyTo?: string | null
): string {
  const headers = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    `Content-Type: text/plain; charset=utf-8`,
  ];

  if (params.cc) headers.push(`Cc: ${params.cc}`);
  if (params.bcc) headers.push(`Bcc: ${params.bcc}`);
  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }

  const raw = headers.join("\r\n") + "\r\n\r\n" + params.body;

  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendEmail(userId: string, params: SendEmailParams) {
  const gmail = await getGmailClient(userId);

  let threadId: string | undefined;
  let inReplyTo: string | null = null;

  // If replying, look up the threadId and Message-ID from the original email
  if (params.replyToId) {
    const originalEmail = await prisma.email.findFirst({
      where: { id: params.replyToId, userId },
      select: { threadId: true },
    });

    if (originalEmail?.threadId) {
      threadId = originalEmail.threadId;
    }

    // Fetch the original message's Message-ID header from Gmail
    try {
      const originalMsg = await gmail.users.messages.get({
        userId: "me",
        id: params.replyToId,
        format: "metadata",
        metadataHeaders: ["Message-ID"],
      });
      const messageIdHeader = originalMsg.data.payload?.headers?.find(
        (h) => h.name?.toLowerCase() === "message-id"
      );
      inReplyTo = messageIdHeader?.value ?? null;
    } catch {
      // If we can't get the header, still send with threadId
    }
  }

  const raw = buildRawEmail(params, inReplyTo);

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId,
    },
  });

  return res.data;
}
