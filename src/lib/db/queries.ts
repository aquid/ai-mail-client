import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma/client";

interface ListEmailsParams {
  userId: string;
  label?: string;
  keyword?: string;
  from?: string;
  dateFrom?: string;
  dateTo?: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export async function listEmails(params: ListEmailsParams) {
  const {
    userId,
    label,
    keyword,
    from,
    dateFrom,
    dateTo,
    isRead,
    limit = 200,
    offset = 0,
  } = params;

  const where: Prisma.EmailWhereInput = { userId };

  if (label) {
    where.labelIds = { contains: label };
  }

  if (keyword) {
    // Use OR across fields — Prisma contains is case-sensitive on SQLite,
    // so we search both the original and lowercased keyword
    const kw = keyword;
    where.OR = [
      { subject: { contains: kw } },
      { bodyText: { contains: kw } },
      { from: { contains: kw } },
      { snippet: { contains: kw } },
      // Also try lowercase for case-insensitive matching
      { subject: { contains: kw.toLowerCase() } },
      { bodyText: { contains: kw.toLowerCase() } },
      { from: { contains: kw.toLowerCase() } },
      { snippet: { contains: kw.toLowerCase() } },
    ];
  }

  if (from) {
    where.from = { contains: from };
  }

  if (dateFrom) {
    where.date = { gte: new Date(dateFrom) };
  }

  if (dateTo) {
    where.date = {
      ...((where.date as Prisma.DateTimeNullableFilter) ?? {}),
      lte: new Date(dateTo + "T23:59:59.999Z"),
    };
  }

  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  // Fetch more than needed to account for thread deduplication
  const rawEmails = await prisma.email.findMany({
    where,
    orderBy: { date: "desc" },
    take: limit * 3,
    skip: offset,
    select: {
      id: true,
      threadId: true,
      subject: true,
      from: true,
      to: true,
      date: true,
      snippet: true,
      isRead: true,
      isStarred: true,
      labelIds: true,
    },
  });

  // Deduplicate by thread: keep only the latest message per threadId
  const seenThreads = new Set<string>();
  const threadCounts = new Map<string, number>();

  // Count messages per thread
  for (const email of rawEmails) {
    const key = email.threadId || email.id;
    threadCounts.set(key, (threadCounts.get(key) || 0) + 1);
  }

  const emails = rawEmails
    .filter((email) => {
      const key = email.threadId || email.id;
      if (seenThreads.has(key)) return false;
      seenThreads.add(key);
      return true;
    })
    .slice(0, limit)
    .map((email) => ({
      ...email,
      messageCount: threadCounts.get(email.threadId || email.id) || 1,
    }));

  return emails;
}

export async function getEmail(id: string, userId: string) {
  return prisma.email.findFirst({
    where: { id, userId },
  });
}

export async function getThreadMessages(threadId: string, userId: string) {
  return prisma.email.findMany({
    where: { threadId, userId },
    orderBy: { date: "asc" },
  });
}

export async function markEmailRead(id: string, userId: string, isRead: boolean) {
  return prisma.email.updateMany({
    where: { id, userId },
    data: { isRead },
  });
}

export async function markEmailStarred(id: string, userId: string, isStarred: boolean) {
  return prisma.email.updateMany({
    where: { id, userId },
    data: { isStarred },
  });
}
