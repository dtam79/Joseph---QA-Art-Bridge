import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class ListEventsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchBox: Locator;
  readonly resultCount: Locator;
  readonly eventCards: Locator;
  readonly statusBadges: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /^events$/i });
    this.searchBox = page.getByRole("textbox", {
      name: /search exhibitions or locations/i,
    });
    this.resultCount = page.getByText(/exhibitions found/i);
    // Each event card is a link containing a level-3 heading
    this.eventCards = page
      .getByRole("link")
      .filter({ has: page.getByRole("heading", { level: 3 }) });
    this.statusBadges = page.getByText(/^(upcoming|ongoing|past)$/i);
  }

  async goto() {
    await this.page.goto("/list-events/");
    await bypassPasswordGate(this.page);
    await this.heading.waitFor({ state: "visible" });
  }
}
