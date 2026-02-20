"use client";

import { Sidebar } from "./sidebar";
import { AssistantPanel } from "./assistant-panel";
import { Header } from "./header";
import { MainContent } from "./main-content";
import { SessionProvider } from "next-auth/react";
import { usePolling } from "@/hooks/use-polling";
import { useMailStore } from "@/hooks/use-mail-store";
import { useEffect, useCallback, useRef } from "react";

function MailShellInner({ children }: { children: React.ReactNode }) {
  usePolling(60000);

  const { setIsSyncing, setEmails } = useMailStore();
  const syncingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;

    // Abort any in-flight sync
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSyncing(true);
    try {
      await fetch("/api/gmail/sync", { method: "POST", signal: controller.signal });
      const { currentView } = useMailStore.getState();
      const labelMap: Record<string, string> = { inbox: "INBOX", sent: "SENT", drafts: "DRAFT" };
      const label = labelMap[currentView] || "INBOX";
      const res = await fetch(`/api/gmail/messages?label=${label}`, { signal: controller.signal });
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    } finally {
      setIsSyncing(false);
      syncingRef.current = false;
    }
  }, [setIsSyncing, setEmails]);

  // Initial sync on mount
  useEffect(() => {
    handleSync();
    return () => abortRef.current?.abort();
  }, [handleSync]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onSync={handleSync} />
        <main className="flex-1 overflow-auto">
          <MainContent>{children}</MainContent>
        </main>
      </div>
      <AssistantPanel />
    </div>
  );
}

export function MailShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MailShellInner>{children}</MailShellInner>
    </SessionProvider>
  );
}
