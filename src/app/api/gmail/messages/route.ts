import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-options";
import { listEmails } from "@/lib/db/queries";
import { getGmailClient } from "@/lib/gmail/client";
import { parseGmailMessage } from "@/lib/gmail/parse";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const keyword = searchParams.get("keyword") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const label = searchParams.get("label") ?? undefined;
  const isReadParam = searchParams.get("isRead");
  const limit = parseInt(searchParams.get("limit") ?? "200");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  const hasSearch = !!(keyword || from || dateFrom || dateTo);

  // If there's a search query, go to Gmail first to ensure complete results
  if (hasSearch) {
    try {
      const gmailQueryParts: string[] = [];
      if (keyword) gmailQueryParts.push(keyword);
      if (from) gmailQueryParts.push(`from:${from}`);
      if (dateFrom) gmailQueryParts.push(`after:${dateFrom}`);
      if (dateTo) gmailQueryParts.push(`before:${dateTo}`);
      if (label && label !== "INBOX") gmailQueryParts.push(`label:${label.toLowerCase()}`);

      const gmail = await getGmailClient(session.user.id);
      const listRes = await gmail.users.messages.list({
        userId: "me",
        q: gmailQueryParts.join(" "),
        maxResults: 200,
      });

      const messageIds = listRes.data.messages ?? [];

      // Sync all found messages to local DB in batches
      const batchSize = 10;
      for (let i = 0; i < messageIds.length; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        const fullMessages = await Promise.all(
          batch.map((m) =>
            gmail.users.messages.get({
              userId: "me",
              id: m.id!,
              format: "full",
            })
          )
        );

        for (const fullMsg of fullMessages) {
          const parsed = parseGmailMessage(fullMsg.data);
          await prisma.email.upsert({
            where: { id: parsed.id },
            create: { ...parsed, userId: session.user.id },
            update: { ...parsed },
          });
        }
      }
    } catch (error) {
      console.error("Gmail search error:", error);
      // Fall through to local query
    }
  }

  // Query local DB (now populated with Gmail results if search was performed)
  const emails = await listEmails({
    userId: session.user.id,
    label,
    keyword,
    from,
    dateFrom,
    dateTo,
    isRead:
      isReadParam === "true"
        ? true
        : isReadParam === "false"
          ? false
          : undefined,
    limit,
    offset,
  });

  return NextResponse.json({ emails });
}
