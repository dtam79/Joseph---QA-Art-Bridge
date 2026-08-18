import { Page, Locator } from "@playwright/test";
import { gotoWithRetry } from "../../../shared/utils/navigation";

export class PasswordResetPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly introParagraph: Locator;
  readonly emailInput: Locator;
  readonly sendCodeButton: Locator;
  readonly backToLoginLink: Locator;
  readonly emptyEmailError: Locator;
  readonly unknownEmailError: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", { name: /forgot password/i });
    this.introParagraph = page.getByText(/we'll send you a verification code/i);
    // NOTE: the field has no accessible label — its accessible name is the
    // placeholder ("e.g. alex@gmail.com"). Match what's really there.
    this.emailInput = page.getByRole("textbox", { name: /e\.g\. alex/i });
    this.sendCodeButton = page.getByRole("button", { name: "Send Code" });
    this.backToLoginLink = page.getByRole("link", { name: "Back to login" });

    // Live-verified submit responses
    this.emptyEmailError = page.getByText(/please enter your email address/i);
    this.unknownEmailError = page.getByText(/no account found with this email/i);
  }

  async goto() {
    await gotoWithRetry(this.page, "/password-reset/", this.heading);
  }
}
