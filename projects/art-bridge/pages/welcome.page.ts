import { Page, Locator } from "@playwright/test";

export class WelcomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly guestLink: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Locators based on Figma design
    this.heading = page.getByRole("heading", { name: /welcome/i });
    this.subtitle = page.getByText(
      /connect with artists and art lovers worldwide/i
    );
    // We use .or() because we don't know yet if WP renders these as <button> or <a>
    this.guestLink = page
      .getByRole("link", { name: /continue as guest/i })
      .or(page.getByRole("button", { name: /continue as guest/i }));
    this.signInButton = page
      .getByRole("button", { name: /sign in/i })
      .or(page.getByRole("link", { name: /sign in/i }));
    this.signUpButton = page
      .getByRole("button", { name: /sign up/i })
      .or(page.getByRole("link", { name: /sign up/i }));
  }

  async goto() {
    await this.page.goto("/onboarding/");

    // Automatically handle the password gate if it appears on /onboarding/
    const passwordBox = this.page.getByRole("textbox", {
      name: /enter password/i,
    });
    if (await passwordBox.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("🔐 Password gate on /onboarding/, bypassing...");
      await passwordBox.fill(process.env.ART_BRIDGE_PASSWORD!);
      await this.page.getByRole("button", { name: /access site/i }).click();
      await this.page.waitForLoadState("networkidle");
    }
  }
}
