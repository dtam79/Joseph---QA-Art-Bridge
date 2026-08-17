import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page.js";

test.describe("Home Page", () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test("shows brand banner with nav, language switch and Get Started", async () => {
    await expect(home.brandLink).toBeVisible();
    await expect(home.navHome).toBeVisible();
    await expect(home.navServices).toBeVisible();
    await expect(home.navPricing).toBeVisible();
    await expect(home.languageButton).toBeVisible();
    await expect(home.getStartedLink).toBeVisible();
  });

  test("hero shows tagline and both CTA links", async () => {
    await expect(home.heroText).toBeVisible();
    await expect(home.heroTagline).toBeVisible();
    await expect(home.browseInfluencersLink).toBeVisible();
    await expect(home.signUpLink).toBeVisible();
  });

  test("How It Works shows both tabs and they are clickable", async () => {
    await expect(home.howItWorksHeading).toBeVisible();
    await expect(home.advertisersTab).toBeVisible();
    await expect(home.influencersTab).toBeVisible();

    // Switch tabs — page must stay alive (no crash / no 404)
    await home.influencersTab.click();
    await expect(home.howItWorksHeading).toBeVisible();
    await home.advertisersTab.click();
    await expect(home.howItWorksHeading).toBeVisible();
  });

  test("Featured Influencers lists at least one influencer with View Profile", async () => {
    await expect(home.featuredInfluencersHeading).toBeVisible();

    // Data-safe: at least one "View Profile" card link must exist
    await expect(home.viewProfileLinks.first()).toBeVisible();
  });

  test("footer shows brand heading, menu and is present on the page", async () => {
    await expect(home.footer).toBeVisible();
    await expect(home.footerHeading).toBeVisible();
    await expect(home.footerMenuHome).toBeVisible();
  });
});
