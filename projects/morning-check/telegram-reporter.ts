import type { FullResult, Reporter, Suite } from "@playwright/test/reporter";

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
      console.log(
        res.ok
          ? "✅ Telegram summary sent."
          : "❌ Telegram API error: " + res.status
      );
    } catch (err: any) {
      console.error(
        "❌ Telegram network error (check internet/VPN or hidden spaces in .env):",
        err.cause?.code || err.message
      );
    }
  }
}
export default TelegramReporter;
