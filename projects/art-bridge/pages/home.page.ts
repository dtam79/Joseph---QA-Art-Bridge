import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class HomePage {
  readonly page: Page;
  readonly brandHeading: Locator;
  readonly tagline: Locator;
  readonly searchBox: Locator;
  readonly topArtistsHeading: Locator;
  readonly artistsViewAllLink: Locator;
  readonly globalExhibitionsHeading: Locator;
  readonly exhibitionsTab: Locator;
  readonly festivalsTab: Locator;
  readonly openCallsTab: Locator;
  readonly bottomNav: Locator;

  constructor(page: Page) {
    this.page = page;

    this.brandHeading = page.getByRole("heading", {
      name: /global art bridge/i,
    });
    this.tagline = page.getByText(/아트로 연결된 우리 세계/);
    this.searchBox = page.getByRole("textbox", {
      name: /search artists, works, or exhibitions/i,
    });

    this.topArtistsHeading = page.getByRole("heading", {
      name: /top artists/i,
    });
    // exact:true so we don't match "View All ›" (exhibitions)
    this.artistsViewAllLink = page.getByRole("link", {
      name: "View All",
      exact: true,
    });

    this.globalExhibitionsHeading = page.getByRole("heading", {
      name: /global exhibitions/i,
    });
    this.exhibitionsTab = page.getByRole("button", {
      name: "Exhibitions",
      exact: true,
    });
    this.festivalsTab = page.getByRole("button", { name: "Festivals" });
    this.openCallsTab = page.getByRole("button", { name: "Open Calls" });

    this.bottomNav = page.getByRole("contentinfo");
  }

  async goto() {
    await this.page.goto("/");
    await bypassPasswordGate(this.page);
    await this.brandHeading.waitFor({ state: "visible" });
  }
}
