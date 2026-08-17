import { test, expect } from "@playwright/test";
import { PasswordResetPage } from "../pages/password-reset.page";

test.describe("Password Reset Page (/password-reset/)", () => {
  test("displays all password reset form elements", async ({ page }) => {
    const resetPage = new PasswordResetPage(page);
    await resetPage.goto();

    await expect(resetPage.heading).toBeVisible();
    await expect(resetPage.introParagraph).toBeVisible();
    await expect(resetPage.emailInput).toBeVisible();
    await expect(resetPage.sendCodeButton).toBeVisible();
  });

  test("Send Code with an email shows the success state", async ({ page }) => {
    const resetPage = new PasswordResetPage(page);
    await resetPage.goto();

    await resetPage.sendCode("random@gmail.com");

    // Snapshot evidence: success shows "New code sent!" + "Check your email..."
    await expect(resetPage.successMessage).toBeVisible({ timeout: 15000 });
  });

  test("back link returns to the login page", async ({ page }) => {
    const resetPage = new PasswordResetPage(page);
    await resetPage.goto();

    await resetPage.backToLoginLink.click();

    await expect(page).toHaveURL(/login/);
  });
});
