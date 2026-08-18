import { Page, Locator } from "@playwright/test";
import { gotoWithRetry } from "../../../shared/utils/navigation";

export class RegisterPage {
  readonly page: Page;

  // Step 1 — account type
  readonly accountTypeHeading: Locator;
  readonly advertiserRadio: Locator;
  readonly influencerRadio: Locator;
  readonly loginLink: Locator;

  // Step 2 — credentials
  readonly credentialsHeading: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly backButton: Locator;
  readonly continueButton: Locator;

  // Step 3 — profile (advertiser view)
  readonly profileHeading: Locator;
  readonly companyNameInput: Locator;
  readonly industrySelect: Locator;
  readonly companyTypeSelect: Locator;
  readonly companySizeSelect: Locator;
  readonly websiteInput: Locator;
  readonly countrySelect: Locator;
  readonly brandDescriptionInput: Locator;
  readonly termsCheckbox: Locator;
  readonly createAccountButton: Locator;

  // Post-registration success
  readonly successHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Step 1 — account type
    this.accountTypeHeading = page.getByRole("heading", {
      name: /choose your account type/i,
    });
    // Anchor to the start of the accessible name: /advertiser/i would also match
    // the Influencer radio (its copy mentions "collaborate with influencers").
    this.advertiserRadio = page.getByRole("radio", { name: /^advertiser/i });
    this.influencerRadio = page.getByRole("radio", { name: /^influencer/i });
    this.loginLink = page.getByRole("link", { name: "Login" });

    // Step 2 — credentials
    this.credentialsHeading = page.getByRole("heading", {
      name: /create your login credentials/i,
    });
    this.fullNameInput = page.getByRole("textbox", { name: /full name/i });
    this.emailInput = page.getByRole("textbox", { name: /email address/i });
    this.passwordInput = page.getByRole("textbox", { name: /^password$/i });
    this.confirmPasswordInput = page.getByRole("textbox", {
      name: /confirm password/i,
    });
    this.backButton = page.getByRole("button", { name: /← back/i });
    this.continueButton = page.getByRole("button", { name: /continue/i });

    // Step 3 — profile (advertiser view)
    this.profileHeading = page.getByRole("heading", {
      name: /complete your profile/i,
    });
    this.companyNameInput = page.getByRole("textbox", {
      name: /company or brand name/i,
    });
    this.industrySelect = page.getByRole("combobox", { name: "Industry" });
    this.companyTypeSelect = page.getByRole("combobox", {
      name: "Company type",
    });
    this.companySizeSelect = page.getByRole("combobox", {
      name: "Company size",
    });
    this.websiteInput = page.getByRole("textbox", {
      name: /company website/i,
    });
    this.countrySelect = page.getByRole("combobox", {
      name: /country/i,
    });
    this.brandDescriptionInput = page.getByRole("textbox", {
      name: /brand description/i,
    });
    this.termsCheckbox = page.getByRole("checkbox", {
      name: /terms and privacy/i,
    });
    this.createAccountButton = page.getByRole("button", {
      name: /create account/i,
    });

    // Post-registration success
    this.successHeading = page.getByRole("heading", {
      name: /account created successfully/i,
    });
  }

  async goto() {
    await gotoWithRetry(this.page, "/register/", this.accountTypeHeading);
  }

  async chooseAccountType(accountType: "Advertiser" | "Influencer") {
    const radio =
      accountType === "Advertiser"
        ? this.advertiserRadio
        : this.influencerRadio;
    await radio.check();
    await this.credentialsHeading.waitFor({ state: "visible" });
  }

  async backToAccountType() {
    await this.backButton.click();
    await this.accountTypeHeading.waitFor({ state: "visible" });
  }

  /**
   * Walk the whole flow (account type → credentials) to reach step 3.
   * Each call must use a fresh, unique email — the site rejects duplicates.
   */
  async gotoProfileStep(
    accountType: "Advertiser" | "Influencer",
    email: string,
    password: string = "TestPass123!"
  ) {
    await this.goto();
    await this.chooseAccountType(accountType);
    await this.fullNameInput.fill("QA Disposable Tester");
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);
    await this.continueButton.click();
    await this.profileHeading.waitFor({ state: "visible" });
  }

  /** Fill the advertiser profile form and submit. */
  async completeProfile() {
    await this.companyNameInput.fill("QA Disposable Studio");
    await this.industrySelect.selectOption({ label: "Technology" });
    await this.companyTypeSelect.selectOption({ label: "Startup" });
    await this.companySizeSelect.selectOption({ label: "1–10 employees" });
    await this.countrySelect.selectOption({ label: "Myanmar" });
    await this.brandDescriptionInput.fill(
      "QA disposable account for automated testing."
    );
    await this.termsCheckbox.check();
    await this.createAccountButton.click();
  }
}
