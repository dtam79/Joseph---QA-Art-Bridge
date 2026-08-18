import { Page, Locator } from "@playwright/test";
import { gotoWithRetry } from "../../../shared/utils/navigation";

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly googleButton: Locator;
  readonly tiktokButton: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", { name: /welcome back/i });
    this.emailInput = page.getByRole("textbox", { name: /^email$/i });
    this.passwordInput = page.getByRole("textbox", { name: /^password$/i });
    this.loginButton = page.getByRole("button", { name: "Log in" });
    this.forgotPasswordLink = page.getByRole("link", {
      name: /forgot password/i,
    });
    this.googleButton = page.getByRole("button", {
      name: /continue with google/i,
    });
    this.tiktokButton = page.getByRole("button", { name: /^tiktok$/i });
    this.registerLink = page.getByRole("link", { name: "Register" });
  }

  async goto() {
    await gotoWithRetry(this.page, "/login/", this.heading);
  }
}
