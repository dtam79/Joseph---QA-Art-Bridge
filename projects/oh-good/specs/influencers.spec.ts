import { test, expect } from "@playwright/test";
import { InfluencersPage } from "../pages/influencers.page";

test.describe("Influencers page (/influencers/)", () => {
  let influencers: InfluencersPage;

  test.beforeEach(async ({ page }) => {
    influencers = new InfluencersPage(page);
    await influencers.goto();
  });

  test("shows search section with combobox and button", async () => {
    await expect(influencers.heading).toBeVisible();
    await expect(influencers.searchBox).toBeVisible();
    await expect(influencers.searchButton).toBeVisible();
  });

  test("sort dropdown offers all 5 sort options", async () => {
    await expect(influencers.sortCombobox).toBeVisible();
    for (const option of [
      "Best Match",
      "Highest Engagement",
      "Most Followers",
      "Top Points",
      "Best Rating",
    ]) {
      await expect(influencers.sortCombobox).toContainText(option);
    }
  });

  test("lists at least one influencer with a View Profile link", async () => {
    // Data-safe: the influencer list is live data, so only assert structure
    await expect(influencers.viewProfileLinks.first()).toBeVisible();
  });

  test("View Profile navigates to an influencer detail page", async ({
    page,
  }) => {
    await influencers.viewProfileLinks.first().click();
    await expect(page).toHaveURL(/\/influencer\//);
  });
});
