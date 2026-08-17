import { Page, Locator } from "@playwright/test";
import { bypassHotDealPasswordGate } from "../../../shared/utils/password-bypass";

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly phoneModeBar: Locator;
  readonly emailModeOption: Locator;
  readonly phoneInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Live evidence: the intro is split across elements ("Welcome Back!" /
    // "Please log in to continue"), so match the first fragment exactly.
    this.heading = page.getByText("Welcome Back!", { exact: true });
    this.phoneModeBar = page.getByText("Mobile Phone", { exact: true });
    this.emailModeOption = page.getByText("Login with Email", { exact: true });
    this.phoneInput = page.getByRole("textbox", { name: /phone number/i });
    this.emailInput = page.getByRole("textbox", { name: /^email$/i });
    this.passwordInput = page.getByRole("textbox", { name: /^password$/i });
    this.loginButton = page.getByRole("button", { name: "Login" });
    this.forgotPasswordLink = page.getByRole("link", {
      name: /forgot password/i,
    });
    this.registerLink = page.getByRole("link", { name: "Register" });
  }

  async goto() {
    await bypassHotDealPasswordGate(this.page);
    await this.page.goto("/login/");
    await this.heading.waitFor({ state: "visible" });
  }

  // Default mode is "Mobile Phone"; switch to the email form when needed.
  // Retries once: the method dropdown can be janky on the slow staging site.
  async switchToEmailMode() {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (await this.emailInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        return; // already in email mode
      }
      if (!(await this.phoneModeBar.isVisible({ timeout: 3000 }).catch(() => false))) {
        throw new Error("Login method selector (Mobile Phone) not found");
      }
      await this.phoneModeBar.click({ force: true });
      await this.page.waitForTimeout(500); // dropdown render
      if (!(await this.emailModeOption.isVisible({ timeout: 3000 }).catch(() => false))) {
        continue; // dropdown didn't open; retry
      }
      await this.emailModeOption.click({ force: true });
      try {
        await this.emailInput.waitFor({ state: "visible", timeout: 8000 });
        return;
      } catch {
        // fall through to retry
      }
    }
    throw new Error("Failed to switch login to Email mode");
  }

  async login(identifier: string, password: string) {
    await this.emailInput.fill(identifier);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
