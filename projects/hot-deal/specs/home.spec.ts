import { test, expect } from "@playwright/test";
import { HomePage } from "../pages/home.page";

test.describe("Home Page", () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.goto();
  });

  test("shows search, cart link and category bar", async () => {
    await expect(home.searchBox).toBeVisible();
    await expect(home.cartLink).toBeVisible();
    await expect(home.categoriesLink).toBeVisible();
  });

  test("shows all three deal sections", async () => {
    await expect(home.hotDealsText).toBeVisible();
    await expect(home.auctionsText).toBeVisible();
    await expect(home.storeText).toBeVisible();
  });

  test("each deal section's View All links to its archive page", async () => {
    await home.hotDealsViewAll.click();
    await expect(home.page).toHaveURL(/\/hot-deal\//);

    await home.goto();
    await home.auctionsViewAll.click();
    await expect(home.page).toHaveURL(/\/auctions\//);

    await home.goto();
    await home.storeViewAll.click();
    await expect(home.page).toHaveURL(/\/regular-store\//);
  });

  test("lists products with add-to-cart actions", async () => {
    await expect(home.productLinks.first()).toBeVisible();
    await expect(home.addToCartLinks.first()).toBeVisible();
  });

  test("footer shows site nav and the profile link", async () => {
    await expect(home.footer).toBeVisible();
    await expect(home.footerProfileLink).toBeVisible();
  });
});
