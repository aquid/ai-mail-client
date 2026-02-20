import { getGmailClient } from "./client";

export async function setupGmailWatch(userId: string, topicName: string) {
  const gmail = await getGmailClient(userId);

  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName,
      labelIds: ["INBOX"],
    },
  });

  return res.data;
}
