import { test } from "@playwright/test";

test("DEBUG: find the login screen", async ({ page }) => {
  await page.goto("/");

  // 1. Bypass password gate
  const passwordBox = page.getByRole("textbox", { name: /enter password/i });
  if (await passwordBox.isVisible()) {
    await passwordBox.fill(process.env.ART_BRIDGE_PASSWORD!);
    await page.getByRole("button", { name: /access site/i }).click();
    await page.waitForTimeout(3000);
  }

  // 2. Click the "Profile" tab in the bottom navigation
  console.log("👉 Clicking Profile tab in bottom nav...");
  await page.getByRole("link", { name: "Profile" }).click();

  // 3. Wait for the page to change
  await page.waitForTimeout(3000);

  // 4. Print the new URL and the new ARIA tree
  console.log("🔗 Current URL:", page.url());
  const snapshot = await page.locator("body").ariaSnapshot();
  console.log(
    "\n===== ARIA SNAPSHOT (Profile Page) =====\n" +
      snapshot +
      "\n========================="
  );
});
