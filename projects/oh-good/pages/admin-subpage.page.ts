import { Page, Locator } from "@playwright/test";
import { gotoWithRetry } from "../../../shared/utils/navigation";

/**
 * Generic page object for guest-accessible /admin-dashboard/ subpages
 * (campaigns, reports, points & payment). Each renders the shared admin shell
 * with a level-1 page title heading.
 */
export class AdminSubpage {
  readonly page: Page;
  readonly heading: Locator;
  readonly sidebarNav: Locator;
  readonly navDashboard: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", { level: 1 });
    this.sidebarNav = page.getByRole("navigation").first();
    this.navDashboard = this.sidebarNav.getByRole("link", {
      name: "Dashboard",
      exact: true,
    });
    this.logoutLink = page.getByRole("link", { name: "Logout" });
  }

  async goto(path: string) {
    await gotoWithRetry(this.page, path, this.heading);
  }
}
