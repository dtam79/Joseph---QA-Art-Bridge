import { test, expect } from "@playwright/test";
import { RoleSelectionPage } from "../pages/role-selection.page";
import { AccountCreationPage } from "../pages/account-creation.page";

test.describe("Account Creation (User Role)", () => {
  let rolesPage: RoleSelectionPage;
  let accountPage: AccountCreationPage;

  test.beforeEach(async ({ page }) => {
    rolesPage = new RoleSelectionPage(page);
    await rolesPage.goto();
    await rolesPage.exploreArtistsOption.click();

    accountPage = new AccountCreationPage(page);
    await expect(accountPage.heading).toBeVisible({ timeout: 15000 });
  });

  test("displays all fields (including missing Username)", async () => {
    await expect(accountPage.emailInput).toBeVisible();
    await expect(accountPage.usernameInput).toBeVisible();
    await expect(accountPage.passwordInput).toBeVisible();
    await expect(accountPage.confirmPasswordInput).toBeVisible();
    await expect(accountPage.nextButton).toBeVisible();
  });

  test("Empty submission shows validation errors", async ({ page }) => {
    await accountPage.clickNext();

    // Assert we stayed on the page and the Username error text appeared
    await expect(accountPage.heading).toBeVisible();
    await expect(page.getByText(/enter your username/i)).toBeVisible();
  });

  test("Valid submission proceeds to the next step", async ({ page }) => {
    // Generate unique identifiers to prevent database collisions on staging
    const timestamp = Date.now();
    const uniqueEmail = `qa-user-${timestamp}@example.com`;
    const uniqueUsername = `qauser${timestamp}`;

    await accountPage.fillEmail(uniqueEmail);
    await accountPage.fillUsername(uniqueUsername);
    await accountPage.fillPassword("SecurePass123!");
    await accountPage.fillConfirmPassword("SecurePass123!");

    await accountPage.clickNext();

    // Now that the form is valid, we expect it to navigate away from "Create your account".
    // We will check that the heading is NO LONGER visible (proving we advanced).
    await expect(accountPage.heading).not.toBeVisible({ timeout: 10000 });

    // Log the new URL so we know what the next screen is for the next step!
    console.log("\n🔗 Navigated to next step URL:", page.url());
  });
});
