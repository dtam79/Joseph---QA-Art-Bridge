import type { FullResult, Reporter, Suite } from "@playwright/test/reporter";
import fs from "node:fs";

// Site emojis to make the summary scannable at a glance.
const SITE_EMOJI: Record<string, string> = {
  "Art Bridge": "🎨",
  "Hot Deal": "🏷️",
  "Oh-Good": "😊",
  "Hands-On Trip": "✈️",
};

// Shorten Playwright's skip messages into clean one-liners.
function beautifyReason(reason: string): string {
  if (/WAF blocked/i.test(reason)) return "blocked from this region";
  if (/URL not configured/i.test(reason)) return "URL not configured";
  if (/No credentials/i.test(reason)) return "no credentials configured";
  if (/Login not configured/i.test(reason)) return "login not configured";
  return reason;
}

// Read the previous summary's message_id from the committed state file
// (TELEGRAM_LAST_MESSAGE_ID_FILE, set by morning-check.yml). Returns
// undefined when absent/unreadable, so auto-clean is a no-op outside CI.
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
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
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

    // Group test lines by site, tracking each site's worst outcome.
    const sites = new Map<string, { worst: string; lines: string[] }>();
    let passed = 0;
    let skipped = 0;
    let failed = 0;

    for (const t of this.suite.allTests()) {
      const out = t.outcome();
      if (out === "expected") passed++;
      else if (out === "skipped") skipped++;
      else failed++;

      const last = t.results[t.results.length - 1];
      const secs = ((last?.duration ?? 0) / 1000).toFixed(1);
      const icon = out === "expected" ? "✅" : out === "skipped" ? "⚠️" : "❌";

      let suffix = "";
      if (out === "expected") {
        suffix = ` (${secs}s)`;
      } else if (out === "unexpected" || out === "flaky") {
        suffix = ` (${secs}s) — ` + (last?.error?.message?.split("\n")[0] ?? "failed");
      } else if (out === "skipped") {
        const reason = t.annotations
          .filter((a) => a.type === "skip")
          .map((a) => a.description ?? "")
          .find(Boolean);
        suffix = reason ? ` — ${beautifyReason(reason)}` : " — not configured";
      }

      const site = t.parent?.title ?? "Other";
      const entry = sites.get(site) ?? { worst: "expected", lines: [] };
      if (out === "unexpected" || out === "flaky") entry.worst = "unexpected";
      else if (out === "skipped" && entry.worst === "expected")
        entry.worst = "skipped";
      entry.lines.push(`  ${icon} ${t.title}${suffix}`);
      sites.set(site, entry);
    }

    const parts: string[] = [];
    for (const [title, entry] of sites) {
      // "Hot Deal [main]" → { name: "Hot Deal", env: "main" }
      const m = title.match(/^(.*?)\s*\[(.*?)\]$/);
      const name = m?.[1] ?? title;
      const env = m?.[2] ?? "";
      const emoji = SITE_EMOJI[name] ?? "📦";
      const dot = entry.worst === "unexpected" ? "❌" : entry.worst === "skipped" ? "⚠️" : "✅";
      const envTag = env ? ` · ${env}` : "";
      parts.push(
        `\n${dot} ${emoji} ${name}${envTag}\n${entry.lines.join("\n")}`
      );
    }

    const summary =
      failed > 0
        ? `🔴 ${failed} failed · ${passed} passed · ${skipped} skipped`
        : passed > 0 && skipped === 0
          ? "🟢 all checks passed"
          : `🟡 ${passed} passed · ${skipped} skipped`;

    const text =
      `🌅 MORNING CHECK — ${formatDate(new Date())}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${summary} · ⏱ ${formatDuration(result.duration)}\n` +
      parts.join("\n") +
      `\n━━━━━━━━━━━━━━━━━━━━━━`;

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
        // Persist the id to GitHub Actions outputs + step summary BEFORE the
        // footer edit below, so it stays recoverable from CI even if the edit
        // fails. GITHUB_OUTPUT makes it addressable as
        // steps.morning-check.outputs.telegram_message_id in the workflow.
        if (process.env.GITHUB_OUTPUT) {
          fs.appendFileSync(
            process.env.GITHUB_OUTPUT,
            `telegram_message_id=${messageId}\n`
          );
        }
        if (process.env.GITHUB_STEP_SUMMARY) {
          fs.appendFileSync(
            process.env.GITHUB_STEP_SUMMARY,
            `## 🤖 Morning check Telegram summary\n\n` +
              `- **message_id:** \`${messageId}\`\n` +
              `- **chat_id:** \`${chatId}\`\n` +
              `- **delete:** \`pnpm delete-message ${messageId}\`\n`
          );
        }
        // The message_id is only known after the message is sent, so append it
        // to the summary text via editMessageText (editing keeps the same id).
        // Every summary then shows its own id, and old ones can be deleted
        // with the Bot API deleteMessage call.
        const stamped =
          `${text}\n\n━━━━━━━━━━━━━━━━━━━━━━\n🆔 message_id: ${messageId}`;
        const editRes = await fetch(
          `https://api.telegram.org/bot${token}/editMessageText`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              message_id: messageId,
              text: stamped,
            }),
          }
        );
        if (!editRes.ok) {
          console.log(
            `⚠️  Could not append message_id to the summary: ${editRes.status}`
          );
        }
        // Auto-clean: delete the previous day's summary (best-effort) and
        // persist this id for the next run. The previous id comes from the
        // state file committed by the last CI run — see morning-check.yml.
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
                `🗑️  Auto-deleted previous summary (message_id ${prevId})`
              );
            } else {
              const body = (await delRes.json().catch(() => ({}))) as {
                description?: string;
              };
              console.log(
                `ℹ️  Previous summary ${prevId} not auto-deleted: ${
                  body.description ?? `HTTP ${delRes.status}`
                } — already removed or too old, continuing`
              );
            }
          } catch (err: any) {
            console.warn(
              `⚠️  Auto-delete of previous summary ${prevId} failed: ${err.message}`
            );
          }
        }
        const lastIdFile = process.env.TELEGRAM_LAST_MESSAGE_ID_FILE;
        if (lastIdFile) {
          try {
            fs.writeFileSync(lastIdFile, String(messageId));
          } catch (err: any) {
            console.warn(
              `⚠️  Could not persist message id to ${lastIdFile}: ${err.message}`
            );
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
