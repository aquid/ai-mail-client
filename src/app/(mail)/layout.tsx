import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth-options";
import { MailShell } from "@/components/layout/mail-shell";

export default async function MailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <MailShell>{children}</MailShell>;
}
