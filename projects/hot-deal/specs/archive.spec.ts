import { test, expect } from "@playwright/test";
import { ArchivePage } from "../pages/archive.page";

test.describe("Hot Deals page (/hot-deal/)", () => {
  let pageObj: ArchivePage;

  test.beforeEach(async ({ page }) => {
    pageObj = new ArchivePage(page, "hot-deal");
    await pageObj.goto();
  });

  test("shows banner title and search box", async () => {
    await expect(pageObj.title).toBeVisible();
    await expect(pageObj.searchBox).toBeVisible();
  });

  test("shows the deal filter tabs", async () => {
    for (const name of ["All", "Ending Soon", "Trending", "Coming Soon"]) {
      await expect(pageObj.tab(name)).toBeVisible();
    }
  });

  test("lists products in the grid", async () => {
    // Products load asynchronously after the page shell — give them time
    await expect(pageObj.productLinks.first()).toBeVisible({ timeout: 30000 });
  });
});

test.describe("Store page (/regular-store/)", () => {
  let pageObj: ArchivePage;

  test.beforeEach(async ({ page }) => {
    pageObj = new ArchivePage(page, "regular-store");
    await pageObj.goto();
  });

  test("shows banner title, search and sort control", async () => {
    await expect(pageObj.title).toBeVisible();
    await expect(pageObj.searchBox).toBeVisible();
    await expect(pageObj.button("Sort products")).toBeVisible();
  });

  test("shows the store filter tabs", async () => {
    for (const name of ["All", "New Arrival", "Best Seller", "Limited Stock"]) {
      await expect(pageObj.tab(name)).toBeVisible();
    }
  });
});

test.describe("Auctions page (/auctions/)", () => {
  let pageObj: ArchivePage;

  test.beforeEach(async ({ page }) => {
    pageObj = new ArchivePage(page, "auctions");
    await pageObj.goto();
  });

  test("shows banner title and search box", async () => {
    await expect(pageObj.title).toBeVisible();
    await expect(pageObj.searchBox).toBeVisible();
  });

  test("shows the category and status filters", async () => {
    await expect(pageObj.button("All Categories")).toBeVisible();
    await expect(pageObj.button("Live Now")).toBeVisible();
    await expect(pageObj.button("Completed")).toBeVisible();
  });
});

test.describe("Categories page (/categories/)", () => {
  let pageObj: ArchivePage;

  test.beforeEach(async ({ page }) => {
    pageObj = new ArchivePage(page, "categories");
    await pageObj.goto();
  });

  test("shows the title, search and store-type tabs", async () => {
    await expect(pageObj.title).toBeVisible();
    await expect(pageObj.searchBox).toBeVisible();
    await expect(pageObj.button("Hot Deals")).toBeVisible();
    await expect(pageObj.button("Regular Store")).toBeVisible();
  });

  test("shows the category buttons", async () => {
    for (const name of ["Beauty", "Fashion", "Mobile", "Sports"]) {
      await expect(pageObj.button(new RegExp(`^${name} `))).toBeVisible();
    }
  });
});
