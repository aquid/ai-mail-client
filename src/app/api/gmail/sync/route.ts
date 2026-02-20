import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth-options";
import { syncEmails } from "@/lib/gmail/sync";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncEmails(session.user.id);
    if (req.signal.aborted) return new NextResponse(null, { status: 499 });
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === "AbortError" || (error as NodeJS.ErrnoException).code === "ECONNRESET")) {
      return new NextResponse(null, { status: 499 });
    }
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync emails" },
      { status: 500 }
    );
  }
}
