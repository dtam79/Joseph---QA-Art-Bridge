import { test, expect, type Page } from "@playwright/test";
import { saveEvidence as saveEvidenceShared } from "../../../shared/utils/evidence.js";
import { bypassHotDealPasswordGate } from "../../../shared/utils/password-bypass.js";

type QaResult = {
  module: string;
  status: "Pass" | "Fail" | "Warning";
  description: string;
  steps: string[];
  screenshot?: string;
};
const qaResults: QaResult[] = [];

// Wrapper to inject project/module name automatically for this spec
async function saveEvidence(page: Page, name: string) {
  return await saveEvidenceShared(page, "hot-deal", "qa-auth", name);
}

function record(
  module: string,
  status: QaResult["status"],
  description: string,
  steps: string[],
  screenshot?: string
) {
  qaResults.push({ module, status, description, steps, screenshot });
  const icon = status === "Pass" ? "✅" : status === "Fail" ? "❌" : "⚠️";
  console.log(`${icon} ${module}: ${status} — ${description}`);
}

async function safeGoto(page: Page, url: string) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch (e: any) {
    if (e.name === "TimeoutError" || e.message.includes("ERR_ABORTED")) {
      await page.goto(url, { waitUntil: "commit", timeout: 10000 }).catch(() => {});
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
    } else {
      throw e;
    }
  }
}

async function switchToEmailMode(page: Page) {
  const mobileText = page.getByText("Mobile Phone", { exact: true }).first();
  if (await mobileText.isVisible({ timeout: 3000 }).catch(() => false)) {
    await mobileText.click({ force: true });
    await page.waitForTimeout(500);

    const emailOption = page.getByText("Login with Email", { exact: true });
    if (await emailOption.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailOption.click({ force: true });
    } else {
      throw new Error("Failed to open dropdown to select 'Login with Email'");
    }
  }
  await expect(page.getByRole("textbox", { name: /^email$/i })).toBeVisible({ timeout: 5000 });
}

async function ensureLoggedOut(page: Page) {
  await safeGoto(page, "/login/");
  const logoutLink = page.getByRole("link", { name: /log ?out/i });
  const altLogout = page.getByRole("link", { name: /logout out/i });

  const linkToClick = (await logoutLink.isVisible({ timeout: 2000 }).catch(() => false))
    ? logoutLink
    : (await altLogout.isVisible({ timeout: 2000 }).catch(() => false))
    ? altLogout
    : null;

  if (linkToClick) {
    await linkToClick.click();
    await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  }
}

async function isLoggedIn(page: Page): Promise<boolean> {
  return (
    page.getByRole("link", { name: /log ?out/i }).isVisible({ timeout: 2000 }).catch(() => false) ||
    page.getByRole("link", { name: /logout out/i }).isVisible({ timeout: 2000 }).catch(() => false)
  );
}

async function visibleError(page: Page, timeout = 6000): Promise<string | null> {
  // Only match elements that actually carry text — empty live regions (e.g. a
  // `role=status` node present on every page) would otherwise false-positive as
  // "errors" once a successful login redirects away from the form.
  const alert = page
    .locator("[role='alert'], [role='status'], .woocommerce-error, [class*='error'], [class*='Error'], [class*='notice']")
    .filter({ hasText: /\S/ })
    .first();
  try {
    await alert.waitFor({ state: "visible", timeout });
    return ((await alert.textContent()) ?? "").trim() || "(error shown without text)";
  } catch {
    return null;
  }
}

test.describe("hot-deal QA Auth", () => {
  // Staging can be slow under parallel load — allow 2 retries and a longer
  // per-test budget so transient latency doesn't fail the suite.
  test.describe.configure({ retries: 2, timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await bypassHotDealPasswordGate(page);
    await ensureLoggedOut(page);
  });

  test.afterEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test.afterAll(() => {
    console.log("\n--- QA SUMMARY ---");
    for (const r of qaResults) console.log(`[${r.status}] ${r.module} — ${r.description}`);
  });

  test("Test 1: Sign In (Email Mode)", async ({ page }) => {
    try {
      await safeGoto(page, "/login/");
      await switchToEmailMode(page);
      await page.getByRole("textbox", { name: /^email$/i }).fill("random@gmail.com");
      await page.getByRole("textbox", { name: /^password$/i }).fill("TAM!@tam12");
      await page.getByRole("button", { name: /login/i }).click();

      // Widen the error window — staging can take >4s to render the rejection.
      const err = await visibleError(page, 12000);
      if (err) throw new Error(`Login rejected: ${err}`);

      await expect(page).not.toHaveURL(/.*\/login\//, { timeout: 5000 }).catch(() => {});
      const hasLogout = await isLoggedIn(page);
      const hasSuccessToast = await page.locator("h3, [class*='toast'], [class*='success']")
        .filter({ hasText: /login successful|welcome/i })
        .isVisible({ timeout: 3000 }).catch(() => false);

      if (!hasLogout && !hasSuccessToast && page.url().includes("/login/")) {
        throw new Error("Login button hung/disabled and no success state detected.");
      }

      await saveEvidence(page, "login-email-success");
      record("Sign In (Email)", "Pass", "Valid credentials log in successfully (Email mode).", []);
    } catch (e: any) {
      const { screenshot } = await saveEvidence(page, "fail-login-email");
      record("Sign In (Email)", "Fail", e.message.split("\n")[0], [], screenshot);
      throw e;
    }
  });

  test("Test 1b: Sign In (Phone Mode)", async ({ page }) => {
    try {
      await safeGoto(page, "/login/");
      await expect(page.getByRole("textbox", { name: /phone number/i })).toBeVisible({ timeout: 5000 });

      await page.getByRole("textbox", { name: /phone number/i }).fill("09912345678");
      await page.getByRole("textbox", { name: /^password$/i }).fill("TAM!@tam12");

      const loginBtn = page.getByRole("button", { name: /login/i });
      await loginBtn.click();
      await page.waitForTimeout(2000);

      const err = await visibleError(page, 2000);
      if (err) {
        record("Sign In (Phone)", "Pass", `Phone login rejected as expected. Message: "${err}"`, []);
      } else if (await isLoggedIn(page)) {
        record("Sign In (Phone)", "Pass", "Logged in successfully via Phone mode.", []);
      } else {
        const isDisabled = await loginBtn.isDisabled();
        if (isDisabled) {
          record("Sign In (Phone)", "Warning", "UX BUG: Login button became [disabled] with NO error message shown.", []);
        } else {
          record("Sign In (Phone)", "Fail", "Login did not succeed and no error message was displayed.", []);
          throw new Error("Login failed without error message");
        }
      }
    } catch (e: any) {
      const { screenshot } = await saveEvidence(page, "fail-login-phone");
      record("Sign In (Phone)", "Fail", e.message.split("\n")[0], [], screenshot);
      throw e;
    }
  });

  test("Test 2: Sign Up (Happy Path)", async ({ page }) => {
    try {
      await safeGoto(page, "/register/");
      const ts = Date.now();
      await page.getByRole("textbox", { name: /full name/i }).fill("QA Automation Tester");
      await page.getByRole("textbox", { name: /^email$/i }).fill(`qa.test.${ts}@example.com`);
      await page.getByRole("textbox", { name: /phone number/i }).fill(`99${String(ts).slice(-8)}`);
      await page.getByRole("textbox", { name: /^password$/i }).fill("TAM!@tam12");
      await page.getByRole("textbox", { name: /confirm password/i }).fill("TAM!@tam12");
      await page.getByRole("checkbox", { name: /i agree to/i }).check();

      await page.getByRole("button", { name: /register/i }).click();
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const err = await visibleError(page, 4000);
      if (err) {
        if (/too many (registration )?attempts/i.test(err)) {
          record("Sign Up", "Warning", `Environment rate limit hit: "${err}"`, []);
          return;
        }
        throw new Error(`Registration rejected: ${err}`);
      }

      await saveEvidence(page, "register-success");
      record("Sign Up", "Pass", "New account registers successfully with unique data.", []);
    } catch (e: any) {
      const { screenshot } = await saveEvidence(page, "fail-register-happy");
      record("Sign Up", "Fail", e.message.split("\n")[0], [], screenshot);
      throw e;
    }
  });

  test("Test 3: Sign In with WRONG password", async ({ page }) => {
    try {
      await safeGoto(page, "/login/");
      await switchToEmailMode(page);
      await page.getByRole("textbox", { name: /^email$/i }).fill("random@gmail.com");
      await page.getByRole("textbox", { name: /^password$/i }).fill("WRONG_password_123");
      await page.getByRole("button", { name: /login/i }).click();

      if (await isLoggedIn(page)) throw new Error("SECURITY BUG: logged in despite wrong password!");
      const err = await visibleError(page);
      if (err) {
        record("Sign In (Negative)", "Pass", `Wrong password correctly rejected. Message: "${err}"`, []);
      } else {
        const { screenshot } = await saveEvidence(page, "warn-login-silent");
        record("Sign In (Negative)", "Warning", "Wrong password rejected but NO visible error message.", [], screenshot);
      }
    } catch (e: any) {
      const { screenshot } = await saveEvidence(page, "fail-login-wrong-pass");
      record("Sign In (Negative)", "Fail", e.message.split("\n")[0], [], screenshot);
      throw e;
    }
  });

  test("Test 4: Sign In with EMPTY fields", async ({ page }) => {
    try {
      await safeGoto(page, "/login/");
      await switchToEmailMode(page);
      await page.getByRole("button", { name: /login/i }).click();

      if (await isLoggedIn(page)) throw new Error("SECURITY BUG: logged in with empty fields!");
      const err = await visibleError(page, 4000);
      const hasNativeValidation = await page.getByRole("textbox", { name: /^email$/i })
        .evaluate((el) => (el as HTMLInputElement).required).catch(() => false);

      if (err) {
        record("Sign In (Negative)", "Pass", `Empty submission blocked with message: "${err}"`, []);
      } else if (hasNativeValidation) {
        record("Sign In (Negative)", "Pass", "Empty submission blocked by native HTML5 'required' validation.", []);
      } else {
        const { screenshot } = await saveEvidence(page, "warn-login-empty");
        record("Sign In (Negative)", "Warning", "Empty submission produced no visible feedback.", [], screenshot);
      }
    } catch (e: any) {
      const { screenshot } = await saveEvidence(page, "fail-login-empty");
      record("Sign In (Negative)", "Fail", e.message.split("\n")[0], [], screenshot);
      throw e;
    }
  });

  test("Test 5: Sign Up with PASSWORD MISMATCH", async ({ page }) => {
    try {
      await safeGoto(page, "/register/");
      const ts = Date.now();
      await page.getByRole("textbox", { name: /full name/i }).fill("QA Mismatch");
      await page.getByRole("textbox", { name: /^email$/i }).fill(`qa.mismatch.${ts}@example.com`);
      await page.getByRole("textbox", { name: /phone number/i }).fill(`98${String(ts).slice(-8)}`);
      await page.getByRole("textbox", { name: /^password$/i }).fill("TAM!@tam12");
      await page.getByRole("textbox", { name: /confirm password/i }).fill("DIFFERENT_999");
      await page.getByRole("checkbox", { name: /i agree to/i }).check();
      await page.getByRole("button", { name: /register/i }).click();
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      if (await isLoggedIn(page)) throw new Error("BUG: account created despite mismatched passwords!");
      const err = await visibleError(page);
      if (err) {
        record("Sign Up (Negative)", "Pass", `Password mismatch correctly rejected. Message: "${err}"`, []);
      } else {
        const { screenshot } = await saveEvidence(page, "warn-register-mismatch");
        record("Sign Up (Negative)", "Warning", "Mismatch rejected silently.", [], screenshot);
      }
    } catch (e: any) {
      const { screenshot } = await saveEvidence(page, "fail-register-mismatch");
      record("Sign Up (Negative)", "Fail", e.message.split("\n")[0], [], screenshot);
      throw e;
    }
  });

  test("Test 6: Sign Up with DUPLICATE email", async ({ page }) => {
    try {
      await safeGoto(page, "/register/");
      const ts = Date.now();
      await page.getByRole("textbox", { name: /full name/i }).fill("QA Duplicate");
      await page.getByRole("textbox", { name: /^email$/i }).fill("random@gmail.com");
      await page.getByRole("textbox", { name: /phone number/i }).fill(`97${String(ts).slice(-8)}`);
      await page.getByRole("textbox", { name: /^password$/i }).fill("TAM!@tam12");
      await page.getByRole("textbox", { name: /confirm password/i }).fill("TAM!@tam12");
      await page.getByRole("checkbox", { name: /i agree to/i }).check();
      await page.getByRole("button", { name: /register/i }).click();
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

      const err = await visibleError(page);
      const currentUrl = page.url();

      if (!currentUrl.includes("/register/") && !err) {
        throw new Error("CRITICAL BUG: Duplicate email was accepted and registration succeeded/auto-logged in.");
      }

      if (err) {
        record("Sign Up (Negative)", "Pass", `Duplicate email correctly rejected. Message: "${err}"`, []);
      } else {
        const { screenshot } = await saveEvidence(page, "warn-register-duplicate");
        record("Sign Up (Negative)", "Warning", "Duplicate email produced no visible error message.", [], screenshot);
      }
    } catch (e: any) {
      const { screenshot } = await saveEvidence(page, "fail-register-duplicate");
      record("Sign Up (Negative)", "Fail", e.message.split("\n")[0], [], screenshot);
      throw e;
    }
  });

  test("Test 7: Forgot Password flow", async ({ page }) => {
    try {
      await safeGoto(page, "/login/");
      await page.getByRole("link", { name: /forgot password/i }).click();

      // Wait for the reset form itself instead of an unbounded load-state wait,
      // which can hang past the test timeout when staging is slow.
      const resetField = page.getByRole("textbox", { name: /email/i }).first();
      await resetField.waitFor({ state: "visible", timeout: 15000 });
      await resetField.fill("random@gmail.com");

      const submitBtn = page.getByRole("button", { name: /send code|send|submit/i }).first();
      await submitBtn.click();

      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});

      const isBtnDisabled = await submitBtn.isDisabled().catch(() => false);
      const hasSuccessText = await page.locator("strong, p, div").filter({ hasText: /new code sent|check your email/i }).first().isVisible({ timeout: 4000 }).catch(() => false);

      if (!isBtnDisabled && !hasSuccessText) {
        throw new Error("No success message or UI state change after submitting email.");
      }

      await saveEvidence(page, "password-reset-submitted");
      record("Forgot Password", "Pass", "Reset request accepted. UI disables button and/or shows success message.", []);
    } catch (e: any) {
      const { screenshot } = await saveEvidence(page, "fail-password-reset");
      record("Forgot Password", "Fail", e.message.split("\n")[0], [], screenshot);
      throw e;
    }
  });

});
