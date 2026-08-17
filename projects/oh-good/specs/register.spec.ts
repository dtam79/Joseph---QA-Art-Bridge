import { test, expect } from "@playwright/test";
import { RegisterPage } from "../pages/register.page.js";

test.describe("Register Page (multi-step)", () => {
  test("step 1 shows account type radios and login link", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await expect(registerPage.accountTypeHeading).toBeVisible();
    await expect(registerPage.advertiserRadio).toBeVisible();
    await expect(registerPage.influencerRadio).toBeVisible();
    await expect(registerPage.loginLink).toBeVisible();
  });

  test("selecting an account type advances to the credentials step", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.chooseAccountType("Influencer");

    await expect(registerPage.credentialsHeading).toBeVisible();
    await expect(registerPage.fullNameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
    await expect(registerPage.backButton).toBeVisible();
    await expect(registerPage.continueButton).toBeVisible();
  });

  test("Back returns from credentials to the account type step", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.chooseAccountType("Advertiser");
    await registerPage.backToAccountType();

    await expect(registerPage.accountTypeHeading).toBeVisible();
  });

  test("Login link navigates to the login page", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await registerPage.loginLink.click();
    await expect(page).toHaveURL(/log-in/);
  });
});
