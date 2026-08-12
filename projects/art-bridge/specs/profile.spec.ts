import { test, expect } from "@playwright/test";
import { ProfilePage } from "../pages/profile.page";

test.describe("Profile page (/profile/) — guest state", () => {
  let profile: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profile = new ProfilePage(page);
    await profile.goto();
  });

  test("shows heading, guest sign-in prompt, links and version", async () => {
    await expect(profile.heading).toBeVisible();
    await expect(profile.guestSignInLink).toBeVisible();
    await expect(profile.savedLink).toBeVisible();
    await expect(profile.aboutLink).toBeVisible();
    await expect(profile.settingsLink).toBeVisible();
    await expect(profile.versionText).toBeVisible();
  });

  test("guest sign-in link leads to /login (same tab or new tab)", async ({
    page,
  }) => {
    // 1. The link itself must point to /login
    const href = await profile.guestSignInLink.getAttribute("href");
    expect(href).toMatch(/\/login/);

    // 2. Click and detect whether a NEW TAB (popup) opens
    const popupPromise = page
      .waitForEvent("popup", { timeout: 5000 })
      .catch(() => null);
    await profile.guestSignInLink.click();
    const popup = await popupPromise;

    if (popup) {
      await popup.waitForLoadState("domcontentloaded").catch(() => {});
      console.log("\n🔗 Sign-in opened in a NEW TAB:", popup.url());
      expect(popup.url()).toMatch(/\/login/);
    } else {
      console.log("\n🔗 Sign-in navigated in the SAME tab:", page.url());
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
    }
  });

  test("language widget is present with Save Changes", async () => {
    await expect(profile.languageHeading).toBeVisible();
    await expect(profile.saveChangesButton).toBeVisible();
  });
});
