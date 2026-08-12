import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class LoginPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly emailOrUsernameInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly loginButton: Locator;
  readonly forgotPasswordLink: Locator;
  readonly signUpLink: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole("heading", {
      name: /sign in to your account/i,
    });

    // The discovery showed both inputs as "textbox" in the accessibility tree
    this.emailOrUsernameInput = page.getByRole("textbox", {
      name: /enter your email or username/i,
    });
    this.passwordInput = page.getByRole("textbox", {
      name: /enter your password/i,
    });

    this.rememberMeCheckbox = page.getByRole("checkbox", {
      name: "Remember me",
    });
    this.loginButton = page.getByRole("button", { name: "Login" });
    this.forgotPasswordLink = page.getByRole("link", {
      name: /forget password/i,
    });
    this.signUpLink = page.getByRole("link", { name: "Sign up" });
  }

  async goto() {
    await this.page.goto("/login/");
    await bypassPasswordGate(this.page);
    await this.heading.waitFor({ state: "visible" });
  }

  async login(emailOrUsername: string, password: string) {
    await this.emailOrUsernameInput.fill(emailOrUsername);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
