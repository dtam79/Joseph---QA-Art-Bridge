import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class ArtistsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchBox: Locator;
  readonly filterButton: Locator;
  readonly categoryAll: Locator;
  readonly resultCount: Locator;
  readonly artistCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /^artists$/i });
    // NOTE: live placeholder is the WRONG copy (GAB-10) — we match what's really there
    this.searchBox = page.getByRole("textbox", {
      name: /search exhibitions or locations/i,
    });
    this.filterButton = page.getByRole("button", { name: "Filter" });
    this.categoryAll = page.getByRole("button", { name: /all/i });
    this.resultCount = page.getByText(/artists found/i);
    this.artistCards = page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { level: 3 }) });
  }

  async goto() {
    await this.page.goto("/artists-art-page/");
    await bypassPasswordGate(this.page);
    await this.heading.waitFor({ state: "visible" });
  }
}
