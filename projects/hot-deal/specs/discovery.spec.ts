import { test } from "@playwright/test";
import { saveEvidence } from "../../../shared/utils/evidence.js";
import { bypassHotDealPasswordGate } from "../../../shared/utils/password-bypass.js";

test.describe("hot-deal Discover Archive Pages", () => {
  test("DISCOVERY: map the store and archive pages", async ({ page }) => {
    await bypassHotDealPasswordGate(page);

    const routes = [
      "/hot-deal/",
      "/auctions/",
      "/regular-store/",
      "/categories/",
      "/product/red-cookies-marshmallow-powder-lipstick-scarlet-laurent/",
      "/profile/",
    ];

    for (const route of routes) {
      const name = route.replace(/^\/|\/$/g, "").replace(/\W+/g, "-") || "home";
      await page.goto(route, { waitUntil: "load", timeout: 30000 }).catch(() => {});
      await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
      await saveEvidence(page, "hot-deal", "discovery", `discover-${name}`);
      console.log(`✅ captured /${name}/`);
    }

    console.log(
      "✅ Archive discovery complete — snapshots in projects/hot-deal/data/snapshots/discovery/"
    );
  });
});
