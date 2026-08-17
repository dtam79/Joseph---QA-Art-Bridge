import { Page, expect } from "@playwright/test";

export async function bypassPasswordGate(page: Page) {
  const passwordBox = page.getByRole("textbox", { name: /enter password/i });

  if (await passwordBox.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log("🔐 Password gate detected, bypassing...");
    await passwordBox.fill(process.env.ART_BRIDGE_PASSWORD!);
    await page.getByRole("button", { name: /access site/i }).click();

    // ✨ FIX: Instead of waiting for "networkidle", wait for the password box to disappear.
    // This proves the site has navigated away from the gate.
    await expect(passwordBox).toBeHidden({ timeout: 15000 });

    // Give the SPA a brief 1-second buffer to render the new page content
    await page.waitForTimeout(1000);
  }
}

// Hot-deal site-wide password gate: unlocks the site for the session
// (cookie-persisted). No-op when the gate is already open. The gate intercepts
// every route, so it checks the current page — pass an absolute `url` to
// navigate there first (the morning check has no baseURL). Uses a resilient
// navigation (the staging site can stall on "load" under load).
export async function bypassHotDealPasswordGate(page: Page, url?: string) {
  if (url) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    } catch {
      await page
        .goto(url, { waitUntil: "commit", timeout: 10000 })
        .catch(() => {});
    }
  }
  const passwordBox = page.getByRole("textbox", { name: "Enter password" });
  if (await passwordBox.isVisible({ timeout: 10000 }).catch(() => false)) {
    if (process.env.HOT_DEAL_SITE_PASSWORD) {
      await passwordBox.fill(process.env.HOT_DEAL_SITE_PASSWORD);
      await page.getByRole("button", { name: "Enter" }).click();
      await page
        .getByText("Protected Site")
        .waitFor({ state: "hidden", timeout: 15000 });
    }
  }
}
