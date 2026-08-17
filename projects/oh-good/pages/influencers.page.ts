import { Page, Locator } from "@playwright/test";

export class InfluencersPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchBox: Locator;
  readonly searchButton: Locator;
  readonly sortCombobox: Locator;
  readonly viewProfileLinks: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", { name: /^search$/i });
    // The search combobox lives inside the <search> landmark
    this.searchBox = page.getByRole("search").getByRole("combobox");
    this.searchButton = page.getByRole("search").getByRole("button", {
      name: "Search",
    });

    // The sort dropdown sits inside an unnamed form — locate it by its options
    // instead of relying on position within the page.
    this.sortCombobox = page
      .getByRole("combobox")
      .filter({ has: page.getByRole("option", { name: "Best Match" }) });

    this.viewProfileLinks = page.getByRole("link", { name: "View Profile" });
  }

  async goto() {
    // Staging is slow under parallel load and the load event can stall —
    // navigate with "commit" and wait for the page heading instead. The
    // <search> section hydrates after the heading, so wait for the combobox
    // too — it's the signal that the interactive search UI is ready.
    await this.page.goto("/influencers/", {
      waitUntil: "commit",
      timeout: 60000,
    });
    await this.searchBox.waitFor({ state: "visible" });
  }
}
