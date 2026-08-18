/**
 * Delete a morning-check summary message the bot sent to the group.
 *
 * Usage:
 *   pnpm delete-message <message_id>            # delete from TELEGRAM_CHAT_ID
 *   pnpm delete-message <chat_id> <message_id>  # delete from a specific chat
 *
 * Every summary the bot posts is stamped with its own message_id (see
 * projects/morning-check/telegram-reporter.ts), so new ones can be deleted
 * straight from the id shown in the group.
 *
 * Note: ids of messages sent BEFORE the stamping was added cannot be
 * recovered — the Bot API does not expose a bot's own outgoing message
 * history (getUpdates only returns incoming updates), and old runs didn't
 * log ids. Those can only be removed manually from the group by an admin.
 *
 * Telegram only lets bots delete their OWN messages, and only within 48 hours
 * of the message being sent.
 */
import dotenv from "dotenv";

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const defaultChatId = process.env.TELEGRAM_CHAT_ID;
const args = process.argv.slice(2);

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set in .env");
  process.exit(1);
}

const [arg1, arg2] = args;
const chatId = arg2 ? arg1 : defaultChatId;
const messageId = arg2 ?? arg1;

if (!chatId || !messageId) {
  console.error(
    "Usage:\n" +
      "  pnpm delete-message <message_id>  (chat defaults to TELEGRAM_CHAT_ID from .env)\n" +
      "  pnpm delete-message <chat_id> <message_id>"
  );
  process.exit(1);
}

const res = await fetch(
  `https://api.telegram.org/bot${token}/deleteMessage`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: Number(messageId) }),
  }
);
const data = (await res.json()) as { ok: boolean; description?: string };

if (data.ok) {
  console.log(`🗑️  Deleted message ${messageId} from chat ${chatId}`);
} else {
  console.error(
    `❌ Delete failed: ${data.description ?? res.status} ` +
      "(note: only messages sent within the last 48h can be deleted)"
  );
  process.exit(1);
}
