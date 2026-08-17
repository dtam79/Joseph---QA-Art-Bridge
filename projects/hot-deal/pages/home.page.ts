import { Page, Locator } from "@playwright/test";
import { bypassHotDealPasswordGate } from "../../../shared/utils/password-bypass";

export class HomePage {
  readonly page: Page;

  // Header / search
  readonly cartLink: Locator;
  readonly searchBox: Locator;

  // Categories bar — the "Sports" link is the stable single-element anchor
  readonly categoriesLink: Locator;

  // Deal sections ("View All" links are matched by href, not name — there are
  // three identical "View All" links on the page). Section titles are split
  // across elements on the live site (e.g. "Hot Deals" / "Ending soon - grab
  // them now!"), so each title is matched by its stable single-element fragment.
  readonly hotDealsText: Locator;
  readonly hotDealsViewAll: Locator;
  readonly auctionsText: Locator;
  readonly auctionsViewAll: Locator;
  readonly storeText: Locator;
  readonly storeViewAll: Locator;

  // Products
  readonly productLinks: Locator;
  readonly addToCartLinks: Locator;

  // Footer
  readonly footer: Locator;
  readonly footerProfileLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // The cart link is an unnamed image link in the banner
    this.cartLink = page.locator('a[href="/cart"]').first();
    this.searchBox = page.getByRole("textbox", { name: "Search products" });

    this.categoriesLink = page.getByRole("link", { name: "Sports" });

    this.hotDealsText = page.getByText("Ending soon - grab them now!", {
      exact: true,
    });
    this.hotDealsViewAll = page.locator('a[href="/hot-deal/"]').first();
    this.auctionsText = page.getByText("Fast bids. Fair wins", {
      exact: true,
    });
    this.auctionsViewAll = page.locator('a[href="/auctions/"]').first();
    this.storeText = page.getByText("Browse our full collection", {
      exact: true,
    });
    this.storeViewAll = page.locator('a[href="/regular-store/"]').first();

    this.productLinks = page.locator('a[href*="/product/"]');
    this.addToCartLinks = page.getByRole("link", { name: "Add to cart" });

    this.footer = page.getByRole("contentinfo");
    // Logged out the footer shows "Login" → /login/; logged in it shows the
    // profile link. Match either so the test survives both states.
    this.footerProfileLink = this.footer.getByRole("link", {
      name: /go to profile|login/i,
    });
  }

  async goto() {
    // bypassHotDealPasswordGate lands on "/" and unlocks the site
    await bypassHotDealPasswordGate(this.page);
    await this.searchBox.waitFor({ state: "visible" });
  }
}
