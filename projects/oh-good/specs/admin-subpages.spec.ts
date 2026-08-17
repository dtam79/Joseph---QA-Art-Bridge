import { test, expect } from "@playwright/test";
import { AdminSubpage } from "../pages/admin-subpage.page";

// The campaigns, reports and points & payment sections are all reachable
// without login (guest viewer role). Content-level locators will be added
// once their structure is captured live — these specs verify guest access
// and the shared admin shell.
const subpages = [
  ["Campaigns", "/admin-dashboard/campaigns/"],
  ["Reports", "/admin-dashboard/reports/"],
  ["Points & Payment", "/admin-dashboard/points-payment/"],
] as const;

for (const [name, path] of subpages) {
  test.describe(`Admin ${name} page (${path})`, () => {
    test("is guest-accessible and renders the admin shell", async ({
      page,
    }) => {
      const subpage = new AdminSubpage(page);
      await subpage.goto(path);

      // Not redirected to login + page title + sidebar + logout all present
      await expect(page).not.toHaveURL(/log-in/);
      await expect(subpage.heading).toBeVisible();
      await expect(subpage.navDashboard).toBeVisible();
      await expect(subpage.logoutLink).toBeVisible();
    });
  });
}
