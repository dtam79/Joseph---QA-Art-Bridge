import { test, expect } from "@playwright/test";
import { RegisterPage } from "../pages/register.page";

test.describe("Register Page", () => {
  test("displays all registration form fields", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    await expect(registerPage.fullNameInput).toBeVisible();
    await expect(registerPage.emailInput).toBeVisible();
    await expect(registerPage.phoneInput).toBeVisible();
    await expect(registerPage.passwordInput).toBeVisible();
    await expect(registerPage.confirmPasswordInput).toBeVisible();
    await expect(registerPage.agreeCheckbox).toBeVisible();
    await expect(registerPage.registerButton).toBeVisible();
  });

  test("mismatched passwords do not create an account", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.goto();

    const ts = Date.now();
    await registerPage.fillDetails({
      fullName: "QA Mismatch",
      email: `qa.mismatch.${ts}@example.com`,
      phone: `98${String(ts).slice(-8)}`,
      password: "TAM!@tam12",
      confirmPassword: "DIFFERENT_999",
    });
    await registerPage.register();

    // Rejected: the user must stay on the register flow (no auto-login redirect)
    await expect(page).toHaveURL(/register/, { timeout: 15000 });
  });
});
