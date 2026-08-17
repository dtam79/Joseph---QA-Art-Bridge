import type { FullResult, Reporter, Suite } from "@playwright/test/reporter";

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

    const lines: string[] = [];
    let fails = 0;
    for (const t of this.suite.allTests()) {
      const out = t.outcome();
      const last = t.results[t.results.length - 1];
      const secs = ((last?.duration ?? 0) / 1000).toFixed(1);
      const icon = out === "expected" ? "✅" : out === "skipped" ? "⚠️" : "❌";
      if (out === "unexpected" || out === "flaky") fails++;
      const err =
        out === "unexpected"
          ? " — " + (last?.error?.message?.split("\n")[0] ?? "failed")
          : "";
      const skip = out === "skipped" ? " (not configured yet)" : "";
      lines.push(
        `${icon} ${t.parent?.title} · ${t.title} (${secs}s)${err}${skip}`
      );
    }

    const text =
      `🌅 MORNING CHECK — ${new Date().toISOString().slice(0, 10)}\n` +
      (fails === 0
        ? "🟢 ALL SITES HEALTHY\n"
        : `🔴 ${fails} CHECK(S) FAILED\n`) +
      "──────────────────\n" +
      lines.join("\n");

    // Replace the fetch block at the bottom of telegram-reporter.ts with:
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
