"use client";

import { useMailStore, View } from "@/hooks/use-mail-store";
import { Inbox, Send, FileText, PenSquare, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import clsx from "clsx";

const navItems: { view: View; label: string; icon: typeof Inbox }[] = [
  { view: "inbox", label: "Inbox", icon: Inbox },
  { view: "sent", label: "Sent", icon: Send },
  { view: "drafts", label: "Drafts", icon: FileText },
  { view: "compose", label: "Compose", icon: PenSquare },
];

export function Sidebar() {
  const { currentView, navigate, resetCompose } = useMailStore();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-foreground/10 bg-foreground/[0.02]">
      <div className="p-4">
        <h1 className="text-lg font-bold">AI Mail</h1>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {navItems.map(({ view, label, icon: Icon }) => (
          <button
            key={view}
            onClick={() => {
              if (view === "compose") resetCompose();
              navigate(view);
            }}
            className={clsx(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              currentView === view
                ? "bg-foreground/10 font-medium"
                : "hover:bg-foreground/5"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-foreground/10 p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/60 transition-colors hover:bg-foreground/5"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
