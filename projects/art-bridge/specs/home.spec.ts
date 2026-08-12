import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

test.describe("Home Page", () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test("shows brand heading, tagline and search box", async () => {
    await expect(home.brandHeading).toBeVisible();
    await expect(home.tagline).toBeVisible();
    await expect(home.searchBox).toBeVisible();
  });

  test("Top Artists section lists artists and View All navigates", async ({
    page,
  }) => {
    await expect(home.topArtistsHeading).toBeVisible();

    // Data-safe: at least one artist card (level-3 heading) must exist
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();

    await home.artistsViewAllLink.click();
    await expect(page).toHaveURL(/artists-art-page/);
  });

  test("Global Exhibitions shows all 3 tabs and they are clickable", async () => {
    await expect(home.globalExhibitionsHeading).toBeVisible();
    await expect(home.exhibitionsTab).toBeVisible();
    await expect(home.festivalsTab).toBeVisible();
    await expect(home.openCallsTab).toBeVisible();

    // Switch tabs — page must stay alive (no crash / no 404)
    await home.festivalsTab.click();
    await expect(home.globalExhibitionsHeading).toBeVisible();
    await home.openCallsTab.click();
    await expect(home.globalExhibitionsHeading).toBeVisible();
  });

  test("bottom navigation shows all 5 tabs", async () => {
    for (const item of ["Home", "Artists", "Gallery", "Chat", "Profile"]) {
      await expect(
        home.bottomNav.getByRole("link", { name: item })
      ).toBeVisible();
    }
  });
});
