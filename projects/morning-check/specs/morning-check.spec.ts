import { test, expect } from "@playwright/test";
import { SITES } from "../sites.config";
import {
  bypassPasswordGate,
  bypassHotDealPasswordGate,
} from "../../../shared/utils/password-bypass";

for (const site of SITES) {
  test.describe(`${site.name} [${site.env}]`, () => {
    test("home, login & register pages accessible", async ({ page }) => {
      if (!site.url) {
        test.skip(true, "URL not configured in .env");
        return;
      }
      // Home page plus any extra pages configured for the site (login, register…)
      const targets = [{ label: "home", path: "" }, ...(site.pages ?? [])];
      for (const t of targets) {
        const res = await page.goto(site.url + t.path, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });
        expect(
          res?.status() ?? 999,
          `HTTP ${res?.status()} for the ${t.label} page`
        ).toBeLessThan(400);
        // More lenient: wait for ANY visible content (handles JS-rendered SPAs)
        await page.waitForTimeout(2000);
        const hasContent =
          (await page.locator("body > *").count()) > 0 ||
          ((await page.locator("body").textContent()) ?? "").trim().length > 0;
        expect(
          hasContent,
          `${t.label} page body is empty — site may be broken`
        ).toBeTruthy();
      }
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

      // Hot Deal sits behind its own site-wide password gate ("Enter" button +
      // HOT_DEAL_SITE_PASSWORD) — unlock via the site root first, then load the
      // login page. Art Bridge uses the shared WP "Access Site" gate instead.
      if (login.type === "woo") {
        await bypassHotDealPasswordGate(page, site.url);
        await page.goto(login.url, {
          waitUntil: "domcontentloaded",
          timeout: 45000,
        });
      } else {
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

      // CI runners are far from the staging servers — give the form time to render
      await userInput.waitFor({ state: "visible", timeout: 30000 });
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
        // Art Bridge's custom /login/ page renders the wp-admin content inline
        // at /login/ after a successful login — "left /login/" alone is too
        // strict. Accept either a redirect away or the logged-in admin toolbar.
        await expect(async () => {
          const rejected = await page
            .getByText(/invalid|incorrect|unknown/i)
            .isVisible()
            .catch(() => false);
          expect(rejected, "login rejected by the site").toBeFalsy();
          const loggedIn =
            !/\/login\/?$/.test(page.url()) ||
            (await page
              .getByRole("menuitem", { name: /wp adminer/i })
              .isVisible()
              .catch(() => false));
          expect(loggedIn, "login did not complete").toBeTruthy();
        }).toPass({ timeout: 45000 });
      }
    });
  });
}
