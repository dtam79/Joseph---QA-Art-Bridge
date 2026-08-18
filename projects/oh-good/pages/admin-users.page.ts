import { Page, Locator } from "@playwright/test";
import { gotoWithRetry } from "../../../shared/utils/navigation";

export class AdminUsersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly managementHeading: Locator;
  readonly description: Locator;
  readonly exportButton: Locator;
  readonly rolesFilter: Locator;
  readonly statusFilter: Locator;
  readonly sidebarNav: Locator;
  readonly navDashboard: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", { name: "Users" });
    this.managementHeading = page.getByRole("heading", {
      name: /user management/i,
    });
    this.description = page.getByText(/manage users across all roles/i);
    // The ARIA snapshot shows "Export" as text inside the management bar —
    // it may be a button or a link depending on how it's rendered.
    this.exportButton = page
      .getByRole("button", { name: "Export" })
      .or(page.getByRole("link", { name: "Export" }));
    // The dropdown renders the label AND the selected option with the same
    // text — use .first() to avoid a strict-mode violation.
    this.rolesFilter = page.getByText("All roles", { exact: true }).first();
    this.statusFilter = page.getByText("All status", { exact: true }).first();

    // Shared admin shell
    this.sidebarNav = page.getByRole("navigation").first();
    this.navDashboard = this.sidebarNav.getByRole("link", {
      name: "Dashboard",
      exact: true,
    });
    this.logoutLink = page.getByRole("link", { name: "Logout" });
  }

  async goto() {
    await gotoWithRetry(this.page, "/admin-dashboard/users/", this.heading);
  }
}
