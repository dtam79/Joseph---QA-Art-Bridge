import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class RoleSelectionPage {
  readonly page: Page;
  readonly heading: Locator;

  readonly exploreArtistsOption: Locator;
  readonly imAnArtistOption: Locator;
  readonly imAnOrganizerOption: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /select your role/i });

    this.exploreArtistsOption = page.getByText(/explore artists/i);
    this.imAnArtistOption = page.getByText(/i'm an artist/i);
    this.imAnOrganizerOption = page.getByText(/i'm an organizer/i);
  }

  async goto() {
    // 1. Navigate to /login/ first to boot the SPA and handle the password gate
    await this.page.goto("/login/");
    await bypassPasswordGate(this.page);

    // 2. Try direct deep-link to /roles
    await this.page.goto("/roles");

    // 3. If the SPA fails to load the roles screen directly (404/redirect),
    // fall back to the actual user flow: clicking "Sign up" from the login page.
    try {
      await this.heading.waitFor({ state: "visible", timeout: 5000 });
    } catch (e) {
      console.log(
        '⚠️ Direct /roles link failed. Falling back to click "Sign up" from /login/...'
      );
      await this.page.goto("/login/");
      await this.page.getByRole("link", { name: "Sign up" }).click();
      await this.heading.waitFor({ state: "visible" });
    }
  }
}
