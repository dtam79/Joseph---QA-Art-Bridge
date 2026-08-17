import { Page, Locator } from "@playwright/test";
import { bypassHotDealPasswordGate } from "../../../shared/utils/password-bypass";

export class RegisterPage {
  readonly page: Page;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly agreeCheckbox: Locator;
  readonly registerButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Field names come from the auth QA suite's fill steps
    this.fullNameInput = page.getByRole("textbox", { name: /full name/i });
    this.emailInput = page.getByRole("textbox", { name: /^email$/i });
    this.phoneInput = page.getByRole("textbox", { name: /phone number/i });
    this.passwordInput = page.getByRole("textbox", { name: /^password$/i });
    this.confirmPasswordInput = page.getByRole("textbox", {
      name: /confirm password/i,
    });
    this.agreeCheckbox = page.getByRole("checkbox", { name: /i agree to/i });
    this.registerButton = page.getByRole("button", { name: /register/i });
  }

  async goto() {
    await bypassHotDealPasswordGate(this.page);
    await this.page.goto("/register/");
    await this.fullNameInput.waitFor({ state: "visible" });
  }

  async fillDetails(opts: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }) {
    await this.fullNameInput.fill(opts.fullName);
    await this.emailInput.fill(opts.email);
    await this.phoneInput.fill(opts.phone);
    await this.passwordInput.fill(opts.password);
    await this.confirmPasswordInput.fill(opts.confirmPassword);
    await this.agreeCheckbox.check();
  }

  async register() {
    await this.registerButton.click();
  }
}
