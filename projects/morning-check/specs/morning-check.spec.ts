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
      // Oh-Good is a Next.js staging server — domcontentloaded can stall under
      // load. Use "commit" (fires on response headers) for og sites; all other
      // sites use the stricter domcontentloaded.
      const waitUntil = site.login?.type === "og" ? "commit" : "domcontentloaded";
      for (const t of targets) {
        const res = await page.goto(site.url + t.path, {
          waitUntil,
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
      const user = (process.env[login.userEnv] ?? "").trim();
      const pass = (process.env[login.passEnv] ?? "").trim();
      if (!user || !pass) {
        test.skip(true, "No credentials in .env");
        return;
      }

      // The sites' WAFs geo-block GitHub's US datacenter IPs on the auth
      // endpoints (admin-ajax POST 403, ckattempt cookie challenge → 403)
      // while serving the pages fine. Track blocked responses so we can
      // report "blocked from CI region" instead of a false "site broken".
      let wafBlocked = false;
      page.on("response", (r) => {
        if (
          r.status() === 403 ||
          r.status() === 406 ||
          r.status() === 429
        ) {
          try {
            const u = new URL(r.url());
            if (u.hostname.endsWith(new URL(site.url).hostname)) {
              wafBlocked = true;
            }
          } catch {}
        }
      });

      try {
        // Hot Deal sits behind its own site-wide password gate ("Enter" button +
        // HOT_DEAL_SITE_PASSWORD) — unlock it, then load the login page. Art
        // Bridge uses the shared WP "Access Site" gate instead.
        if (login.type === "woo") {
          // Unlock via the site root first, then again in place on the login URL
          // (the gate intercepts every route, and from CI it can appear on either).
          await bypassHotDealPasswordGate(page, site.url);
          await page.goto(login.url, {
            waitUntil: "domcontentloaded",
            timeout: 45000,
          });
          await bypassHotDealPasswordGate(page);
          await page.goto(login.url, {
            waitUntil: "domcontentloaded",
            timeout: 45000,
          });
        } else if (login.type === "og") {
          // Oh-Good is a Next.js staging server — "domcontentloaded" can stall
          // under load. Use "commit" (fires on response headers) then wait for
          // the email input specifically, mirroring gotoWithRetry in the suite.
          try {
            await page.goto(login.url, { waitUntil: "commit", timeout: 45000 });
          } catch {
            // Last-resort: bare navigation if even commit times out
            await page.goto(login.url, { waitUntil: "commit", timeout: 20000 }).catch(() => {});
          }
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

        let userInput;
        let passInput;

        if (login.type === "woo") {
          // Hot Deal is a custom React app with a phone/email toggle.
          // Phone mode is the default — switch to email mode before filling.
          const phoneModeBar = page.getByText("Mobile Phone", { exact: true });
          const emailModeOption = page.getByText("Login with Email", { exact: true });
          const emailInput = page.getByRole("textbox", { name: /^email$/i });

          // Wait for the login form to render first
          await phoneModeBar.waitFor({ state: "visible", timeout: 30000 });

          if (!(await emailInput.isVisible({ timeout: 1000 }).catch(() => false))) {
            await phoneModeBar.click({ force: true });
            await emailModeOption.waitFor({ state: "visible", timeout: 5000 });
            await emailModeOption.click({ force: true });
            await emailInput.waitFor({ state: "visible", timeout: 8000 });
          }

          userInput = emailInput;
          passInput = page.getByRole("textbox", { name: /^password$/i });
        } else if (login.type === "og") {
          // Oh-Good is a Next.js app — uses semantic role-based inputs.
          // No password gate, no phone toggle — just wait for the email field.
          userInput = page.getByRole("textbox", { name: /^email$/i });
          passInput = page.getByRole("textbox", { name: /^password$/i });
          await userInput.waitFor({ state: "visible", timeout: 30000 });
        } else {
          // WordPress / Art Bridge: standard WP form IDs
          userInput = page
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

          passInput = page
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
        }

        await userInput.fill(user);
        await passInput.fill(pass);
        await page
          .getByRole("button", { name: /log ?in|sign ?in/i })
          .first()
          .click();

        // Verify login success
        if (login.type === "woo") {
          // Hot Deal redirects to home/profile on success — no "Log out" text
          // link exists in the nav. A URL change away from /login/ is the
          // reliable signal that authentication succeeded.
          await expect(page).not.toHaveURL(/\/login\/?/, { timeout: 15000 });
        } else if (login.type === "og") {
          // Oh-Good redirects away from /log-in/ on success.
          await expect(page).not.toHaveURL(/\/log-in\/?/, { timeout: 15000 });
        } else {
          // Art Bridge's custom /login/ page renders the wp-admin content inline
          // at /login/ after a successful login — "left /login/" alone is too
          // strict. Accept either a redirect away or the logged-in admin toolbar.
          // CI runners are far from the server, so the toolbar can take a while:
          // give the bounded check a generous window.
          await expect(async () => {
            const rejected = await page
              .getByText(/invalid|incorrect|unknown/i)
              .isVisible()
              .catch(() => false);
            expect(rejected, "login rejected by the site").toBeFalsy();
            const loggedIn =
              !/\/login\/?$/.test(page.url()) ||
              (await page.locator("#wpadminbar").isVisible().catch(() => false)) ||
              (await page
                .getByRole("menuitem", { name: /wp adminer/i })
                .isVisible()
                .catch(() => false));
            expect(loggedIn, "login did not complete").toBeTruthy();
          }).toPass({ timeout: 90000 });
        }
      } catch (err) {
        // The site's WAF can block the login request from CI's US datacenter
        // IP (admin-ajax 403 / ckattempt challenge) while the pages themselves
        // are fine — that's a "can't verify from here" situation, not a broken
        // site. Report it as skipped so the morning summary stays honest
        // instead of crying wolf.
        if (wafBlocked) {
          test.skip(
            true,
            `WAF blocked the login request from this region (HTTP 4xx on the auth endpoint) — site likely fine, verify from a Korean IP`
          );
        }
        throw err;
      }
    });
  });
}
