import { Page, Locator } from "@playwright/test";
import { bypassHotDealPasswordGate } from "../../../shared/utils/password-bypass";

export class PasswordResetPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly introParagraph: Locator;
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly backToLoginLink: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    // Snapshot evidence for /password-reset/
    this.heading = page.getByRole("heading", { name: /forgot password/i });
    this.introParagraph = page.getByText(
      /enter your email address and we'll send you a verification code/i
    );
    this.emailInput = page.getByRole("textbox", { name: /^email$/i });
    this.sendCodeButton = page.getByRole("button", { name: "Send Code" });
    // The back arrow is an unnamed image link to /login
    this.backToLoginLink = page.locator('a[href*="/login"]').first();
    this.successMessage = page.getByText(/new code sent!/i);
  }

  async goto() {
    await bypassHotDealPasswordGate(this.page);
    await this.page.goto("/password-reset/");
    await this.heading.waitFor({ state: "visible" });
  }

  async sendCode(email: string) {
    await this.emailInput.fill(email);
    await this.sendCodeButton.click();
  }
}
