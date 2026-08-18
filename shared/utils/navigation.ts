import { Page, Locator } from "@playwright/test";

export interface GotoWithRetryOptions {
  /** How many navigation attempts before giving up (default 3). */
  attempts?: number;
  /** Per-attempt `page.goto` timeout in ms (default 30_000). */
  gotoTimeout?: number;
  /** Per-attempt ready-locator wait timeout in ms (default 20_000). */
  readyTimeout?: number;
  /** Base backoff in ms between attempts (default 2_000, doubles each try). */
  backoffMs?: number;
}

/**
 * Navigate to `path` and wait for `ready` to be visible, retrying with backoff.
 *
 * Staging servers (oh-good especially) throttle under parallel load: `goto`
 * can stall for tens of seconds even with `waitUntil: "commit"`, and the load
 * event may never fire. A single Playwright retry is not enough — the throttled
 * connection fails again the same way. This bounded retry loop with backoff
 * absorbs transient throttling so one slow response doesn't fail the suite,
 * while still failing fast on a genuinely down page.
 *
 * The ready locator gets a smaller budget than the goto: once the navigation
 * commits, the page heading renders quickly — the long pole is always the
 * server's response, not the DOM.
 */
export async function gotoWithRetry(
  page: Page,
  path: string,
  ready: Locator,
  options: GotoWithRetryOptions = {}
): Promise<void> {
  const attempts = options.attempts ?? 3;
  const gotoTimeout = options.gotoTimeout ?? 30_000;
  const readyTimeout = options.readyTimeout ?? 20_000;
  const backoffMs = options.backoffMs ?? 2_000;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await page.goto(path, { waitUntil: "commit", timeout: gotoTimeout });
      await ready.waitFor({ state: "visible", timeout: readyTimeout });
      return;
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await page.waitForTimeout(backoffMs * attempt);
      }
    }
  }
  throw lastError;
}
