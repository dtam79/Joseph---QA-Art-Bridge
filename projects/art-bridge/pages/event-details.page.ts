import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class EventDetailsPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly statusBadge: Locator;
  readonly eventTitle: Locator;
  readonly location: Locator;
  readonly dates: Locator;
  readonly categories: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole("button", { name: "←" });
    this.statusBadge = page.getByText(/^(ongoing|upcoming|past)$/i).first();
    this.eventTitle = page.getByRole("heading", { level: 2 });
    this.location = page.locator("p").filter({ hasText: /📍/ }).first();
    this.dates = page.locator("p").filter({ hasText: /📅/ }).first();
    this.categories = page
      .getByText(/minhwa|hanbok|embroidery|oil-painting/i)
      .first();
  }

  async goto(eventId: string) {
    await this.page.goto(`/event-details/?event_id=${eventId}`);
    await bypassPasswordGate(this.page);
    await this.eventTitle.waitFor({ state: "visible" });
  }
}
