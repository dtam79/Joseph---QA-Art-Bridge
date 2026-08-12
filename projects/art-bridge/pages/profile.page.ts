import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class ProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly guestSignInLink: Locator;
  readonly savedLink: Locator;
  readonly aboutLink: Locator;
  readonly settingsLink: Locator;
  readonly languageHeading: Locator;
  readonly saveChangesButton: Locator;
  readonly versionText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: /^profile$/i });
    this.guestSignInLink = page.getByRole("link", {
      name: /guest user sign in/i,
    });
    this.savedLink = page.getByRole("link", { name: /^saved$/i });
    this.aboutLink = page.getByRole("link", { name: /^about$/i });
    this.settingsLink = page.getByRole("link", { name: /^settings$/i });
    this.languageHeading = page.getByRole("heading", {
      name: /select language/i,
    });
    this.saveChangesButton = page.getByRole("button", {
      name: /save changes/i,
    });
    this.versionText = page.getByText(/global art bridge v/i);
  }

  async goto() {
    await this.page.goto("/profile/");
    await bypassPasswordGate(this.page);
    await this.heading.waitFor({ state: "visible" });
  }
}
