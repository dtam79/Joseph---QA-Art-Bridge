import { test, expect } from "@playwright/test";
import { AdminDashboardPage } from "../pages/admin-dashboard.page";

test.describe("Admin Dashboard (/admin-dashboard/)", () => {
  let admin: AdminDashboardPage;

  test.beforeEach(async ({ page }) => {
    admin = new AdminDashboardPage(page);
    await admin.goto();
  });

  test("renders the dashboard shell for the guest viewer role", async () => {
    await expect(admin.heading).toBeVisible();
    await expect(admin.guestViewerLabel).toBeVisible();
    await expect(admin.navDashboard).toBeVisible();
    await expect(admin.navUsers).toBeVisible();
    await expect(admin.navCampaigns).toBeVisible();
    await expect(admin.navReports).toBeVisible();
    await expect(admin.logoutLink).toBeVisible();
  });

  test("shows live campaign status distribution data", async () => {
    await expect(admin.campaignStatusHeading).toBeVisible();
    // Data-safe: the distribution is live data — assert the section renders
    // and contains at least one status bucket label.
    await expect(admin.campaignStatusText).toBeVisible();
  });

  test("pending report approvals shows the reports table with empty state", async () => {
    await expect(admin.pendingApprovalsHeading).toBeVisible();
    await expect(admin.viewAllReportsLink).toBeVisible();
    // Currently guest-viewer sees no pending reports — assert the empty row
    await expect(admin.reportsEmptyState).toBeVisible();
  });

  test("View All Reports navigates to the reports section", async ({
    page,
  }) => {
    // These admin pages never fire the load event (a resource hangs), so skip
    // the post-click load wait and watch the URL directly.
    await admin.viewAllReportsLink.click({ noWaitAfter: true });
    await page.waitForURL(/admin-dashboard\/reports\//);
  });

  test("sidebar Users link navigates to the users section", async ({
    page,
  }) => {
    await admin.navUsers.click({ noWaitAfter: true });
    await page.waitForURL(/admin-dashboard\/users\//);
  });
});

test.describe("Role dashboards require login (logged-out)", () => {
  test("/advertiser-dashboard/ redirects to the login page", async ({
    page,
  }) => {
    // Redirect chains never fire the load event here — wait for the URL with
    // domcontentloaded instead of Playwright's default "load".
    await page.goto("/advertiser-dashboard/", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/log-in/);
    await expect(
      page.getByRole("heading", { name: /welcome back/i })
    ).toBeVisible();
  });

  test("/influencer-dashboard/ redirects to the login page", async ({
    page,
  }) => {
    await page.goto("/influencer-dashboard/", {
      waitUntil: "domcontentloaded",
    });
    await expect(page).toHaveURL(/log-in/);
    await expect(
      page.getByRole("heading", { name: /welcome back/i })
    ).toBeVisible();
  });
});
