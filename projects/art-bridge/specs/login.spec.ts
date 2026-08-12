import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";

test.describe("Login Page", () => {
  test("displays all login form elements", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.emailOrUsernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();

    // ✨ FIX: Assert the visible text label instead of the hidden native input
    await expect(page.getByText("Remember me", { exact: true })).toBeVisible();

    await expect(loginPage.loginButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.signUpLink).toBeVisible();
  });

  test("Sign up link navigates to role selection", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.signUpLink.click();

    // Based on our discovery, the signup link goes to /roles
    await expect(page).toHaveURL(/.*\/roles.*/);
  });

  test("Forget password link should not lead to a Forbidden error (Bug Catcher)", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.forgotPasswordLink.click();

    // Assert that the user does NOT see the "Forbidden" WordPress error page.
    await expect(
      page.getByRole("heading", { name: "Forbidden" })
    ).not.toBeVisible({ timeout: 5000 });
  });
});
