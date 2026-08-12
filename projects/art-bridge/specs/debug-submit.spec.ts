import { test } from "@playwright/test";
import { RoleSelectionPage } from "../pages/role-selection.page";
import { AccountCreationPage } from "../pages/account-creation.page";

test("DEBUG: Capture hidden JS errors and Console logs", async ({ page }) => {
  // 1. Setup
  const rolesPage = new RoleSelectionPage(page);
  await rolesPage.goto();
  await rolesPage.exploreArtistsOption.click();

  const accountPage = new AccountCreationPage(page);
  await accountPage.heading.waitFor({ state: "visible" });

  const timestamp = Date.now();
  await accountPage.fillEmail(`qa-js-${timestamp}@example.com`);
  await accountPage.fillUsername(`qauser${timestamp}`);
  await accountPage.fillPassword("SecurePass123!");
  await accountPage.fillConfirmPassword("SecurePass123!");

  console.log(`\n👉 Form filled. Turning on JS & Console wiretaps...`);

  // 2. Capture everything the website's JavaScript prints to the browser console
  page.on("console", (msg) => {
    console.log(
      `[BROWSER CONSOLE - ${msg.type().toUpperCase()}] ${msg.text()}`
    );
  });

  // 3. Capture UNCAUGHT JavaScript errors (The smoking gun!)
  page.on("pageerror", (error) => {
    console.log(`\n🚨 UNCAUGHT JS ERROR DETECTED! 🚨`);
    console.log(`Error Message: ${error.message}`);
    console.log(`Stack Trace: \n${error.stack}\n`);
  });

  console.log("👉 Clicking Next...\n");

  // 4. Click Next
  await accountPage.clickNext();

  // 5. Wait 3 seconds to let the JS execute and crash
  await page.waitForTimeout(3000);
});
