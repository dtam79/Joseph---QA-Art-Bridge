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
    await expect(resetPage.backToLoginLink).toBeVisible();
  });

  test("Send Code with an empty email shows validation", async ({ page }) => {
    const resetPage = new PasswordResetPage(page);
    await resetPage.goto();

    await resetPage.sendCodeButton.click();

    await expect(resetPage.emptyEmailError).toBeVisible();
  });

  test("Send Code with an unknown email reports no account found", async ({
    page,
  }) => {
    const resetPage = new PasswordResetPage(page);
    await resetPage.goto();

    await resetPage.emailInput.fill("qa-probe@example.com");
    await resetPage.sendCodeButton.click();

    // Server-backed response — allow extra time under parallel suite load
    await expect(resetPage.unknownEmailError).toBeVisible({ timeout: 15000 });
  });

  test("Back to login link navigates to the login page", async ({ page }) => {
    const resetPage = new PasswordResetPage(page);
    await resetPage.goto();

    await resetPage.backToLoginLink.click();

    await expect(page).toHaveURL(/log-in/);
  });
});
