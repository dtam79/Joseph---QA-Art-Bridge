import { Page, Locator } from "@playwright/test";

export class AccountCreationPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly usernameInput: Locator; // ✨ NEW: The field Figma missed!
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly nextButton: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", { name: /create your account/i });
    this.emailInput = page.getByPlaceholder(/enter your email/i);
    this.usernameInput = page.getByPlaceholder(/enter your username/i);
    this.passwordInput = page.getByPlaceholder(/^enter your password$/i);
    this.confirmPasswordInput = page.getByPlaceholder(/confirm password/i);

    this.nextButton = page.getByRole("button", { name: /next/i });
    this.signInLink = page.getByRole("link", { name: /sign in/i });
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillUsername(username: string) {
    await this.usernameInput.fill(username);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  async clickNext() {
    await this.nextButton.click();
  }
}
