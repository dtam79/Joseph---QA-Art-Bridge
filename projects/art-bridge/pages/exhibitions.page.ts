import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class ExhibitionsPage {
  readonly page: Page;
  readonly sectionHeading: Locator;
  readonly cardHeadings: Locator;
  readonly tabExhibitions: Locator;
  readonly tabFestivals: Locator;
  readonly tabOpenCalls: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sectionHeading = page.getByRole("heading", {
      name: /global exhibitions/i,
    });
    // Every exhibition card has a level-3 heading
    this.cardHeadings = page.getByRole("heading", { level: 3 });
    this.tabExhibitions = page.getByRole("button", {
      name: "Exhibitions",
      exact: true,
    });
    this.tabFestivals = page.getByRole("button", { name: "Festivals" });
    this.tabOpenCalls = page.getByRole("button", { name: "Open Calls" });
  }

  async goto() {
    await this.page.goto("/");
    await bypassPasswordGate(this.page);
    await this.sectionHeading.waitFor({ state: "visible" });
  }

  /** All date-range strings visible on the page, e.g. ["Jul 15 - Aug 15, 2026", ...] */
  async getAllDateRanges(): Promise<string[]> {
    const rangeRe =
      /[A-Za-z]{3}\s+\d{1,2}\s*-\s*[A-Za-z]{3}\s+\d{1,2},\s*\d{4}/g;
    const bodyText = await this.page.locator("body").innerText();
    return bodyText.match(rangeRe) ?? [];
  }
}
