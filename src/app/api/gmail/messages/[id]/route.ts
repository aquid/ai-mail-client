import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-options";
import { getEmail, getThreadMessages, markEmailRead, markEmailStarred } from "@/lib/db/queries";
import { getGmailClient } from "@/lib/gmail/client";
import { parseGmailMessage } from "@/lib/gmail/parse";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const email = await getEmail(id, session.user.id);

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  // Mark as read when opened — locally and in Gmail
  if (!email.isRead) {
    await markEmailRead(id, session.user.id, true);
    try {
      const gmail = await getGmailClient(session.user.id);
      await gmail.users.messages.modify({
        userId: "me",
        id,
        requestBody: { removeLabelIds: ["UNREAD"] },
      });
    } catch {
      // Non-critical — local DB is already updated
    }
  }

  // Fetch all messages in the thread
  let threadMessages = email.threadId
    ? await getThreadMessages(email.threadId, session.user.id)
    : [email];

  // If we only have one message but there might be more in Gmail, sync the thread
  if (email.threadId && threadMessages.length <= 1) {
    try {
      const gmail = await getGmailClient(session.user.id);
      const threadRes = await gmail.users.threads.get({
        userId: "me",
        id: email.threadId,
        format: "full",
      });

      const messages = threadRes.data.messages ?? [];
      for (const msg of messages) {
        const parsed = parseGmailMessage(msg);
        await prisma.email.upsert({
          where: { id: parsed.id },
          create: { ...parsed, userId: session.user.id },
          update: { ...parsed },
        });
      }

      threadMessages = await getThreadMessages(email.threadId, session.user.id);
    } catch {
      // Fall back to single message
    }
  }

  return NextResponse.json({
    email: { ...email, isRead: true },
    thread: threadMessages.map((m) => ({ ...m, isRead: m.id === id ? true : m.isRead })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.isRead !== undefined) {
    await markEmailRead(id, session.user.id, body.isRead);
  }
  if (body.isStarred !== undefined) {
    await markEmailStarred(id, session.user.id, body.isStarred);
  }

  return NextResponse.json({ success: true });
}
