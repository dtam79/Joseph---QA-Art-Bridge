import { Page, Locator } from "@playwright/test";

export class HomePage {
  readonly page: Page;

  // Top banner
  readonly brandLink: Locator;
  readonly navHome: Locator;
  readonly navServices: Locator;
  readonly navPricing: Locator;
  readonly languageButton: Locator;
  readonly getStartedLink: Locator;

  // Hero
  readonly heroText: Locator;
  readonly heroTagline: Locator;
  readonly browseInfluencersLink: Locator;
  readonly signUpLink: Locator;

  // How It Works
  readonly howItWorksHeading: Locator;
  readonly advertisersTab: Locator;
  readonly influencersTab: Locator;

  // Featured Influencers
  readonly featuredInfluencersHeading: Locator;
  readonly viewProfileLinks: Locator;

  // Footer
  readonly footer: Locator;
  readonly footerHeading: Locator;
  readonly footerMenuHome: Locator;

  constructor(page: Page) {
    this.page = page;

    // Top banner — scope to the banner so we don't match the footer "Menu" nav.
    // exact:true so "Home" doesn't also match the footer's "Home Page" link.
    this.brandLink = page.getByRole("banner").getByRole("link", {
      name: "Oh Good",
    });
    this.navHome = page.getByRole("banner").getByRole("link", {
      name: "Home",
      exact: true,
    });
    this.navServices = page.getByRole("banner").getByRole("link", {
      name: "Services",
    });
    this.navPricing = page.getByRole("banner").getByRole("link", {
      name: "Pricing",
    });
    this.languageButton = page.getByRole("banner").getByRole("button", {
      name: /EN/i,
    });
    this.getStartedLink = page.getByRole("banner").getByRole("link", {
      name: "Get Started",
    });

    // Hero
    this.heroText = page.getByText(/trusted by 160k\+ creators worldwide/i);
    // NOTE: the live copy has a missing space ("Influencersthat") — match the
    // real text with a loose regex so a copy fix doesn't break the test.
    this.heroTagline = page.getByText(/match your brand/i);
    this.browseInfluencersLink = page.getByRole("link", {
      name: "Browse Influencers",
    });
    this.signUpLink = page.getByRole("link", { name: "Sign Up" });

    // How It Works
    this.howItWorksHeading = page.getByRole("heading", {
      name: /how it works/i,
    });
    this.advertisersTab = page.getByRole("button", {
      name: "For Advertisers",
    });
    this.influencersTab = page.getByRole("button", {
      name: "For Influencers",
    });

    // Featured Influencers
    this.featuredInfluencersHeading = page.getByRole("heading", {
      name: /featured influencers/i,
    });
    this.viewProfileLinks = page.getByRole("link", { name: "View Profile" });

    // Footer
    this.footer = page.getByRole("contentinfo");
    this.footerHeading = this.footer.getByRole("heading", { name: "Oh Good" });
    this.footerMenuHome = this.footer.getByRole("link", { name: "Home Page" });
  }

  async goto() {
    // Staging is slow under parallel load and the load event can stall —
    // navigate with "commit" and wait for the page heading instead.
    await this.page.goto("/", { waitUntil: "commit", timeout: 60000 });
    await this.brandLink.waitFor({ state: "visible" });
  }
}
