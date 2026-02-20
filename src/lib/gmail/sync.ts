import { prisma } from "@/lib/db/prisma";
import { getGmailClient } from "./client";
import { parseGmailMessage } from "./parse";

export async function syncEmails(userId: string, maxResults = 100) {
  const gmail = await getGmailClient(userId);

  // Sync multiple labels in parallel to ensure we have emails from each
  const labels = ["INBOX", "SENT"];
  const allMessageIds = new Map<string, boolean>();

  const listResults = await Promise.all(
    labels.map((label) =>
      gmail.users.messages.list({
        userId: "me",
        labelIds: [label],
        maxResults,
      })
    )
  );

  for (const listRes of listResults) {
    for (const m of listRes.data.messages ?? []) {
      if (m.id) allMessageIds.set(m.id, true);
    }
  }

  const messageIds = Array.from(allMessageIds.keys());

  // Fetch full messages in parallel (batches of 10)
  const batchSize = 10;
  for (let i = 0; i < messageIds.length; i += batchSize) {
    const batch = messageIds.slice(i, i + batchSize);
    const fullMessages = await Promise.all(
      batch.map((id) =>
        gmail.users.messages.get({
          userId: "me",
          id,
          format: "full",
        })
      )
    );

    for (const fullMsg of fullMessages) {
      const parsed = parseGmailMessage(fullMsg.data);
      await prisma.email.upsert({
        where: { id: parsed.id },
        create: { ...parsed, userId },
        update: { ...parsed },
      });
    }
  }

  // Update historyId for incremental sync
  const profile = await gmail.users.getProfile({ userId: "me" });
  if (profile.data.historyId) {
    await prisma.user.update({
      where: { id: userId },
      data: { historyId: profile.data.historyId },
    });
  }

  return { synced: messageIds.length };
}

export async function syncIncremental(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.historyId) {
    return syncEmails(userId);
  }

  const gmail = await getGmailClient(userId);

  try {
    const historyRes = await gmail.users.history.list({
      userId: "me",
      startHistoryId: user.historyId,
      historyTypes: ["messageAdded", "messageDeleted", "labelAdded", "labelRemoved"],
    });

    const history = historyRes.data.history ?? [];
    const messageIds = new Set<string>();

    for (const h of history) {
      for (const msg of h.messagesAdded ?? []) {
        if (msg.message?.id) messageIds.add(msg.message.id);
      }
      for (const msg of h.labelsAdded ?? []) {
        if (msg.message?.id) messageIds.add(msg.message.id);
      }
      for (const msg of h.labelsRemoved ?? []) {
        if (msg.message?.id) messageIds.add(msg.message.id);
      }
    }

    for (const id of messageIds) {
      try {
        const fullMsg = await gmail.users.messages.get({
          userId: "me",
          id,
          format: "full",
        });
        const parsed = parseGmailMessage(fullMsg.data);
        await prisma.email.upsert({
          where: { id: parsed.id },
          create: { ...parsed, userId },
          update: { ...parsed },
        });
      } catch {
        // Message may have been deleted
        await prisma.email.deleteMany({ where: { id } });
      }
    }

    if (historyRes.data.historyId) {
      await prisma.user.update({
        where: { id: userId },
        data: { historyId: historyRes.data.historyId },
      });
    }

    return { synced: messageIds.size };
  } catch (e: unknown) {
    // History ID expired, do full sync
    if (e instanceof Error && "code" in e && (e as { code: number }).code === 404) {
      return syncEmails(userId);
    }
    throw e;
  }
}
