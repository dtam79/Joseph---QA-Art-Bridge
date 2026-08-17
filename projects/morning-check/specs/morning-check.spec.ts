import { test, expect } from "@playwright/test";
import { SITES } from "../sites.config";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

for (const site of SITES) {
  test.describe(`${site.name} [${site.env}]`, () => {
    test("accessible", async ({ page }) => {
      if (!site.url) {
        test.skip(true, "URL not configured in .env");
        return;
      }
      const res = await page.goto(site.url, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      expect(res?.status() ?? 999, `HTTP ${res?.status()}`).toBeLessThan(400);
      // More lenient: wait for ANY visible content (handles JS-rendered SPAs)
      await page.waitForTimeout(2000);
      const hasContent =
        (await page.locator("body > *").count()) > 0 ||
        ((await page.locator("body").textContent()) ?? "").trim().length > 0;
      expect(
        hasContent,
        "Page body is empty — site may be broken"
      ).toBeTruthy();
    });

    test("login works", async ({ page }) => {
      const login = site.login;
      if (!site.url || !login) {
        test.skip(true, "Login not configured yet");
        return;
      }
      const user = process.env[login.userEnv] ?? "";
      const pass = process.env[login.passEnv] ?? "";
      if (!user || !pass) {
        test.skip(true, "No credentials in .env");
        return;
      }

      await page.goto(login.url, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });

      // Only bypass WP gate if we see the specific WP gate form
      const isWpGate = await page
        .locator(
          'form[action*="wp-login.php?action=postpass"], form#password-protected-form'
        )
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (isWpGate) {
        await bypassPasswordGate(page);
      }

      // UNIVERSAL locator strategy — covers WordPress, WooCommerce, and custom forms
      const userInput = page
        .locator(
          [
            "#username", // WooCommerce
            "#user_login", // WordPress default
            'input[name="username"]', // Common custom
            'input[name="log"]', // WordPress wp-login.php
            'input[type="email"]', // Email-based login
          ].join(", ")
        )
        .first();

      const passInput = page
        .locator(
          [
            "#password", // WooCommerce / common
            "#user_pass", // WordPress default
            'input[name="password"]', // Common custom
            'input[name="pwd"]', // WordPress wp-login.php
          ].join(", ")
        )
        .first();

      await userInput.waitFor({ state: "visible", timeout: 10000 });
      await userInput.fill(user);
      await passInput.fill(pass);
      await page
        .getByRole("button", { name: /log ?in|sign ?in/i })
        .first()
        .click();

      // Verify login success
      if (login.type === "woo") {
        // Use .first() to handle multiple "Log out" links
        await expect(
          page.getByRole("link", { name: /log out/i }).first()
        ).toBeVisible({ timeout: 15000 });
      } else {
        await expect(
          page.getByText(/invalid|incorrect|unknown|error/i)
        ).toBeHidden({ timeout: 15000 });
        await expect(page).not.toHaveURL(/wp-login\.php|\/login\/?$/);
      }
    });
  });
}
