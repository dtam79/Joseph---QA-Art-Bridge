import { test, type Page } from "@playwright/test";
import { saveEvidence } from "../../../shared/utils/evidence.js"
import { bypassHotDealPasswordGate } from "../../../shared/utils/password-bypass.js";

async function snap(page: Page, name: string) {
  const result = await saveEvidence(page, "hot-deal", "qa-auth", name);
  return result.aria;
}

test.describe("hot-deal Discover Auth States", () => {
  test("Discover Login and Register states", async ({ page }) => {
    await bypassHotDealPasswordGate(page);

    /* ---------- LOGIN: discover all states ---------- */
    await page.goto("/login/", { waitUntil: "load" });
    await snap(page, "login-1-default");

    // State 2: open the login-method selector ("Mobile Phone" bar)
    const selector = page.getByText("Mobile Phone", { exact: true });
    if (await selector.isVisible().catch(() => false)) {
      await selector.click();
      await page.waitForTimeout(600);
      await snap(page, "login-2-selector-open");

      // State 3: switch to email login
      const emailOption = page.getByText("Login with Email", { exact: true });
      if (await emailOption.isVisible().catch(() => false)) {
        await emailOption.click();
        await page.waitForTimeout(600);
        await snap(page, "login-3-email-mode");
      }
    }

    /* ---------- REGISTER: discover all states ---------- */
    await page.goto("/register/", { waitUntil: "load" });
    await snap(page, "register-1-default");

    // State 2: check if register also has a method selector or hidden toggles
    const regSelector = page.getByText("Mobile Phone", { exact: true });
    if (await regSelector.isVisible().catch(() => false)) {
      await regSelector.click();
      await page.waitForTimeout(600);
      await snap(page, "register-2-selector-open");
    }

    console.log("✅ State discovery complete — snapshots saved in data/snapshots/qa-auth/");
  });
});
