import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class OnboardingPage {
  readonly page: Page;
  readonly skipButton: Locator;
  readonly nextButton: Locator;
  readonly slide1Heading: Locator;
  readonly slide2Heading: Locator;
  readonly slide3Heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.skipButton = page.getByRole("button", { name: "Skip" });
    this.nextButton = page.getByRole("button", { name: "Next" });

    this.slide1Heading = page.getByRole("heading", {
      name: /discover artists worldwide/i,
    });
    this.slide2Heading = page.getByRole("heading", {
      name: /explore exhibitions and festivals/i,
    });
    this.slide3Heading = page.getByRole("heading", {
      name: /connect with global opportunities/i,
    });
  }

  async goto() {
    await this.page.goto("/onboarding/");

    // ✨ NEW: Use our shared utility to handle the password gate!
    await bypassPasswordGate(this.page);

    await this.slide1Heading.waitFor({ state: "visible" });
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickSkip() {
    await this.skipButton.click();
  }
}
