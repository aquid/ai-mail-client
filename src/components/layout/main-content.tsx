"use client";

import { useMailStore } from "@/hooks/use-mail-store";
import { EmailList } from "@/components/mail/email-list";
import { EmailDetailView } from "@/components/mail/email-detail";
import { ComposeForm } from "@/components/mail/compose-form";
import { FilterBar } from "@/components/mail/filter-bar";
export function MainContent({ }: { children: React.ReactNode }) {
  const { currentView } = useMailStore();

  return (
    <div className="h-full">
      {currentView === "inbox" && (
        <>
          <FilterBar />
          <EmailList label="INBOX" />
        </>
      )}
      {currentView === "sent" && <EmailList label="SENT" />}
      {currentView === "drafts" && <EmailList label="DRAFT" />}
      {currentView === "email-detail" && <EmailDetailView />}
      {currentView === "compose" && <ComposeForm />}
    </div>
  );
}
