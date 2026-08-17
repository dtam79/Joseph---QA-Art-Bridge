import { Page, Locator } from "@playwright/test";

export class AdminDashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly guestViewerLabel: Locator;
  readonly logoutLink: Locator;
  readonly sidebarNav: Locator;
  readonly navDashboard: Locator;
  readonly navUsers: Locator;
  readonly navCampaigns: Locator;
  readonly navReports: Locator;
  readonly campaignStatusHeading: Locator;
  readonly campaignStatusText: Locator;
  readonly pendingApprovalsHeading: Locator;
  readonly viewAllReportsLink: Locator;
  readonly reportsEmptyState: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", { name: /admin dashboard/i });
    // NOTE: the guest viewer is a seeded read-only role — visible to logged-out
    // visitors. In the DOM it's a <span class="db-profile-name">Guest</span> (the
    // ARIA snapshot merges it with the adjacent avatar/role text).
    this.guestViewerLabel = page.getByText("Guest", { exact: true });
    this.logoutLink = page.getByRole("link", { name: "Logout" });

    // The sidebar is the first navigation landmark on the page
    this.sidebarNav = page.getByRole("navigation").first();
    this.navDashboard = this.sidebarNav.getByRole("link", {
      name: "Dashboard",
      exact: true,
    });
    this.navUsers = this.sidebarNav.getByRole("link", { name: "Users" });
    this.navCampaigns = this.sidebarNav.getByRole("link", {
      name: "Campaigns",
    });
    this.navReports = this.sidebarNav.getByRole("link", {
      name: /reports approval/i,
    });

    this.campaignStatusHeading = page.getByRole("heading", {
      name: /campaign status distribution/i,
    });
    this.campaignStatusText = page.getByText(/waiting influencer/i);
    this.pendingApprovalsHeading = page.getByRole("heading", {
      name: /pending report approvals/i,
    });
    this.viewAllReportsLink = page.getByRole("link", {
      name: "View All Reports",
    });
    this.reportsEmptyState = page.getByText(/no pending reports found/i);
  }

  async goto() {
    // Staging is slow under parallel load and the load event can stall —
    // navigate with "commit" and wait for the page heading instead.
    await this.page.goto("/admin-dashboard/", {
      waitUntil: "commit",
      timeout: 60000,
    });
    await this.heading.waitFor({ state: "visible" });
  }
}
