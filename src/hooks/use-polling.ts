"use client";

import { useEffect, useRef } from "react";
import { useMailStore } from "./use-mail-store";

export function usePolling(intervalMs = 60000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const poll = async () => {
      const { isSyncing } = useMailStore.getState();
      if (isSyncing) return; // Skip if already syncing

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const { setIsSyncing, setEmails } = useMailStore.getState();
      try {
        setIsSyncing(true);
        await fetch("/api/gmail/sync", { method: "POST", signal: controller.signal });

        const { currentView, filters } = useMailStore.getState();
        if (currentView === "inbox" || currentView === "sent") {
          const label = currentView === "inbox" ? "INBOX" : "SENT";
          const params = new URLSearchParams({ label });
          if (filters.keyword) params.set("keyword", filters.keyword);
          if (filters.from) params.set("from", filters.from);

          const res = await fetch(`/api/gmail/messages?${params}`, { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            setEmails(data.emails);
          }
        }
      } catch {
        // Silently fail for polling (includes AbortError)
      } finally {
        setIsSyncing(false);
      }
    };

    intervalRef.current = setInterval(poll, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      abortRef.current?.abort();
    };
  }, [intervalMs]);
}
