import type { FullResult, Reporter, Suite } from "@playwright/test/reporter";
import fs from "node:fs";

function readLastMessageId(): number | undefined {
  const file = process.env.TELEGRAM_LAST_MESSAGE_ID_FILE;
  if (!file) return undefined;
  try {
    const id = Number(fs.readFileSync(file, "utf8").trim());
    return Number.isInteger(id) && id > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${
    months[d.getUTCMonth()]
  } ${d.getUTCFullYear()}`;
}

class TelegramReporter implements Reporter {
  private suite!: Suite;
  onBegin(_c: unknown, suite: Suite) {
    this.suite = suite;
  }

  async onEnd(result: FullResult) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) {
      console.log("No Telegram secrets - skipping notification.");
      return;
    }

    const failedItems: string[] = [];
    let passed = 0;

    for (const t of this.suite.allTests()) {
      const out = t.outcome();
      if (out === "expected") passed++;

      // Skipped tests are intentionally NOT reported (no explanation needed)
      if (out === "unexpected" || out === "flaky") {
        const last = t.results[t.results.length - 1];
        const secs = ((last?.duration ?? 0) / 1000).toFixed(1);
        const errMsg = last?.error?.message?.split("\n")[0] ?? "failed";
        const shortErr =
          errMsg.length > 120 ? errMsg.slice(0, 117) + "..." : errMsg;
        const parent = t.parent?.title ?? "Other";
        failedItems.push(`• ${parent} · ${t.title} (${secs}s)\n  ${shortErr}`);
      }
    }

    const date = formatDate(new Date());
    const duration = formatDuration(result.duration);

    // PM rule: failures on top; if none → single "all normal" line
    const text =
      failedItems.length === 0
        ? `🌅 MORNING CHECK — ${date}\n✅ All sites are normal — ${passed} passed · ${duration}`
        : `🌅 MORNING CHECK — ${date}\n❌ ${failedItems.length} FAILED\n\n` +
          failedItems.join("\n\n") +
          `\n──────────────────\n${passed} passed · ${duration}`;

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text }),
        }
      );
      if (!res.ok) {
        console.log("❌ Telegram API error: " + res.status);
        return;
      }
      const data = (await res.json()) as {
        ok: boolean;
        result?: { message_id?: number };
      };
      const messageId = data?.result?.message_id;
      console.log(
        messageId
          ? `✅ Telegram summary sent. (message_id ${messageId})`
          : "✅ Telegram summary sent."
      );

      if (messageId) {
        if (process.env.GITHUB_OUTPUT) {
          fs.appendFileSync(
            process.env.GITHUB_OUTPUT,
            `telegram_message_id=${messageId}\n`
          );
        }
        if (process.env.GITHUB_STEP_SUMMARY) {
          fs.appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            `## Morning check Telegram summary\n\n` +
              `- **message_id:** \`${messageId}\`\n` +
              `- **chat_id:** \`${chatId}\`\n`
          );
        }

        // Auto-clean: delete the previous summary (best-effort)
        const prevId = readLastMessageId();
        if (prevId && prevId !== messageId) {
          try {
            const delRes = await fetch(
              `https://api.telegram.org/bot${token}/deleteMessage`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, message_id: prevId }),
              }
            );
            if (delRes.ok) {
              console.log(
                `🗑️ Auto-deleted previous summary (message_id ${prevId})`
              );
            }
          } catch (err: any) {
            console.warn(
              `⚠️ Auto-delete of previous summary failed: ${err.message}`
            );
          }
        }

        const lastIdFile = process.env.TELEGRAM_LAST_MESSAGE_ID_FILE;
        if (lastIdFile) {
          try {
            fs.writeFileSync(lastIdFile, String(messageId));
          } catch (err: any) {
            console.warn(`⚠️ Could not persist message id: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      console.error(
        "❌ Telegram network error (check internet/VPN or hidden spaces in .env):",
        err.cause?.code || err.message
      );
    }
  }
}
export default TelegramReporter;
