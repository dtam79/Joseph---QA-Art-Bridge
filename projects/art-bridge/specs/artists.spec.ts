import { test, expect } from "@playwright/test";
import { ArtistsPage } from "../pages/artists.page";

test.describe("Artists page (/artists-art-page/)", () => {
  let artists: ArtistsPage;

  test.beforeEach(async ({ page }) => {
    artists = new ArtistsPage(page);
    await artists.goto();
  });

  test("shows heading, search, filter and at least one artist card", async () => {
    await expect(artists.heading).toBeVisible();
    await expect(artists.searchBox).toBeVisible();
    await expect(artists.filterButton).toBeVisible();
    await expect(artists.resultCount).toBeVisible();
    await expect(artists.artistCards.first()).toBeVisible();
  });

  test("documents the wrong search placeholder (GAB-10 bug-catcher)", async () => {
    // This PASSES today because the bug exists. When devs fix the placeholder
    // to mention "artists", this test will FAIL — reminding us to update it.
    await expect(artists.searchBox).toHaveAttribute(
      "placeholder",
      /exhibitions or locations/i
    );
  });

  test("category chips are present and clickable", async ({ page }) => {
    await expect(artists.categoryAll).toBeVisible();
    // Click "All" — page must survive (no crash / no 404)
    await artists.categoryAll.click();
    await expect(artists.heading).toBeVisible();
  });

  test("clicking an artist card opens a detail page", async ({ page }) => {
    await artists.artistCards.first().click();
    await expect(page).toHaveURL(/artists-details-page/);
  });
});
