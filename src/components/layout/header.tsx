"use client";

import { useMailStore } from "@/hooks/use-mail-store";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";

export function Header({ onSync }: { onSync: () => void }) {
  const { currentView, isSyncing } = useMailStore();

  const titles: Record<string, string> = {
    inbox: "Inbox",
    sent: "Sent",
    compose: "Compose",
    "email-detail": "Email",
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-foreground/10 px-4">
      <h2 className="text-lg font-semibold">{titles[currentView] ?? ""}</h2>
      {(currentView === "inbox" || currentView === "sent") && (
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="rounded-lg p-2 text-foreground/60 transition-colors hover:bg-foreground/5 disabled:opacity-50"
        >
          <RefreshCw
            className={clsx("h-4 w-4", isSyncing && "animate-spin")}
          />
        </button>
      )}
    </header>
  );
}
