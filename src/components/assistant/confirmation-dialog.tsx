"use client";

import { useMailStore } from "@/hooks/use-mail-store";
import { AlertTriangle } from "lucide-react";

export function ConfirmationDialog() {
  const { confirmation, setConfirmation } = useMailStore();

  if (!confirmation) return null;

  const handleConfirm = () => {
    confirmation.resolve(true);
    setConfirmation(null);
  };

  const handleCancel = () => {
    confirmation.resolve(false);
    setConfirmation(null);
  };

  return (
    <div className="border-t border-foreground/10 bg-yellow-500/5 p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
        <div className="flex-1 space-y-2">
          <div className="text-sm font-medium">{confirmation.action}</div>
          <div className="text-xs text-foreground/60">
            {confirmation.description}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="rounded-lg bg-foreground px-3 py-1 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Confirm
            </button>
            <button
              onClick={handleCancel}
              className="rounded-lg border border-foreground/10 px-3 py-1 text-xs transition-colors hover:bg-foreground/5"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
