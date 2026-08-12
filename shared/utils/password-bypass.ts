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
