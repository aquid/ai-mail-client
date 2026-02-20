import { create } from "zustand";

export type View = "inbox" | "sent" | "drafts" | "compose" | "email-detail";

export interface EmailSummary {
  id: string;
  threadId: string | null;
  subject: string | null;
  from: string | null;
  to: string | null;
  date: string | null;
  snippet: string | null;
  isRead: boolean;
  isStarred: boolean;
  labelIds: string | null;
  messageCount?: number;
}

export interface EmailDetail extends EmailSummary {
  body: string | null;
  bodyText: string | null;
  cc: string | null;
  bcc: string | null;
}

export interface Filters {
  keyword?: string;
  from?: string;
  dateFrom?: string;
  dateTo?: string;
  isRead?: boolean | null;
  label?: string;
}

export interface ComposeData {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  replyToId?: string;
}

export interface ConfirmationRequest {
  id: string;
  action: string;
  description: string;
  data: Record<string, unknown>;
  resolve: (confirmed: boolean) => void;
}

interface MailState {
  // Navigation
  currentView: View;
  navigate: (view: View) => void;
  setView: (view: View) => void;

  // Emails
  emails: EmailSummary[];
  setEmails: (emails: EmailSummary[]) => void;
  selectedEmailId: string | null;
  selectedEmail: EmailDetail | null;
  setSelectedEmail: (email: EmailDetail | null) => void;
  threadMessages: EmailDetail[];
  setThreadMessages: (messages: EmailDetail[]) => void;
  openEmail: (id: string) => void;

  // Filters
  filters: Filters;
  setFilters: (filters: Filters) => void;
  resetFilters: () => void;

  // Compose
  composeData: ComposeData;
  setComposeData: (data: Partial<ComposeData>) => void;
  resetCompose: () => void;
  openCompose: (data?: Partial<ComposeData>) => void;

  // Confirmation dialog
  confirmation: ConfirmationRequest | null;
  setConfirmation: (confirmation: ConfirmationRequest | null) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
}

export const useMailStore = create<MailState>((set) => ({
  // Navigation
  currentView: "inbox",
  navigate: (view) => set({ currentView: view, selectedEmailId: null, selectedEmail: null, emails: [], filters: {} }),
  setView: (view) => set({ currentView: view }),

  // Emails
  emails: [],
  setEmails: (emails) => set({ emails }),
  selectedEmailId: null,
  selectedEmail: null,
  setSelectedEmail: (email) => set({ selectedEmail: email }),
  threadMessages: [],
  setThreadMessages: (threadMessages) => set({ threadMessages }),
  openEmail: (id) =>
    set({ currentView: "email-detail", selectedEmailId: id, threadMessages: [] }),

  // Filters
  filters: {},
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {} }),

  // Compose
  composeData: { to: "", subject: "", body: "" },
  setComposeData: (data) =>
    set((state) => ({
      composeData: { ...state.composeData, ...data },
    })),
  resetCompose: () =>
    set({ composeData: { to: "", subject: "", body: "" } }),
  openCompose: (data) =>
    set({
      currentView: "compose",
      composeData: { to: "", subject: "", body: "", ...data },
    }),

  // Confirmation
  confirmation: null,
  setConfirmation: (confirmation) => set({ confirmation }),

  // Loading
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  isSyncing: false,
  setIsSyncing: (isSyncing) => set({ isSyncing }),
}));
