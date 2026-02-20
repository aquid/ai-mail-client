import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "search_emails",
    description:
      "Search and filter emails in the user's inbox. Updates the main UI with matching results. Use this when the user wants to find specific emails.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        keyword: {
          type: SchemaType.STRING,
          description: "Search term to match against subject, body, sender",
        },
        from: {
          type: SchemaType.STRING,
          description: "Filter by sender email or name",
        },
        date_from: {
          type: SchemaType.STRING,
          description: "Start date in YYYY-MM-DD format",
        },
        date_to: {
          type: SchemaType.STRING,
          description: "End date in YYYY-MM-DD format",
        },
        is_read: {
          type: SchemaType.BOOLEAN,
          description: "Filter by read (true) or unread (false) status",
        },
        label: {
          type: SchemaType.STRING,
          description: "Gmail label to filter by (e.g., INBOX, SENT, STARRED)",
        },
      },
    },
  },
  {
    name: "open_email",
    description:
      "Open a specific email to view its full content. Navigate to the email detail view.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        email_id: {
          type: SchemaType.STRING,
          description: "The ID of the email to open",
        },
      },
      required: ["email_id"],
    },
  },
  {
    name: "compose_email",
    description:
      "Open the compose view with pre-filled fields. Use this when the user wants to write a new email, reply, or forward. When replying to an email, include reply_to_id with the original email's ID to maintain the thread.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        to: {
          type: SchemaType.STRING,
          description: "Recipient email address",
        },
        cc: {
          type: SchemaType.STRING,
          description: "CC recipients",
        },
        bcc: {
          type: SchemaType.STRING,
          description: "BCC recipients",
        },
        subject: {
          type: SchemaType.STRING,
          description: "Email subject line",
        },
        body: {
          type: SchemaType.STRING,
          description: "Email body text",
        },
        reply_to_id: {
          type: SchemaType.STRING,
          description:
            "The ID of the email being replied to, to keep it in the same thread",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "send_email",
    description:
      "Send an email. This triggers a confirmation dialog that the user must approve before the email is sent. When replying to an email, include reply_to_id to keep it in the same thread.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        to: {
          type: SchemaType.STRING,
          description: "Recipient email address",
        },
        cc: {
          type: SchemaType.STRING,
          description: "CC recipients",
        },
        bcc: {
          type: SchemaType.STRING,
          description: "BCC recipients",
        },
        subject: {
          type: SchemaType.STRING,
          description: "Email subject line",
        },
        body: {
          type: SchemaType.STRING,
          description: "Email body text",
        },
        reply_to_id: {
          type: SchemaType.STRING,
          description:
            "The ID of the email being replied to, to keep it in the same thread",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "apply_filters",
    description:
      "Apply filters to the inbox view. Updates the filter bar and refreshes the email list.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        keyword: { type: SchemaType.STRING, description: "Search keyword" },
        from: { type: SchemaType.STRING, description: "Sender filter" },
        date_from: { type: SchemaType.STRING, description: "Start date YYYY-MM-DD" },
        date_to: { type: SchemaType.STRING, description: "End date YYYY-MM-DD" },
        is_read: { type: SchemaType.BOOLEAN, description: "Read status filter" },
      },
    },
  },
  {
    name: "get_current_context",
    description:
      "Get the current state of the mail client UI: current view, open email details, active filters, and visible email list.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {},
    },
  },
  {
    name: "mark_emails",
    description:
      "Mark one or more emails as read/unread, starred/unstarred, or archive them.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        email_ids: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "Array of email IDs to mark",
        },
        action: {
          type: SchemaType.STRING,
          description: "The action to perform: read, unread, star, unstar, or archive",
        },
      },
      required: ["email_ids", "action"],
    },
  },
  {
    name: "navigate",
    description: "Navigate to a different view in the mail client.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        view: {
          type: SchemaType.STRING,
          description: "The view to navigate to: inbox, sent, drafts, or compose",
        },
      },
      required: ["view"],
    },
  },
];
