import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-options";
import { sendEmail } from "@/lib/gmail/send";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { to, cc, bcc, subject, body: emailBody, replyToId } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: "To and Subject are required" },
        { status: 400 }
      );
    }

    const result = await sendEmail(session.user.id, {
      to,
      cc,
      bcc,
      subject,
      body: emailBody || "",
      replyToId,
    });

    return NextResponse.json({ messageId: result.id });
  } catch (error: unknown) {
    console.error("Send error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
