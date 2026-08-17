import { Page, Locator } from "@playwright/test";
import { bypassHotDealPasswordGate } from "../../../shared/utils/password-bypass";

export type ArchiveRoute = "hot-deal" | "regular-store" | "auctions" | "categories";

// Structure evidence comes from the discovery snapshots in
// projects/hot-deal/data/snapshots/discovery/ (per-route titles, search
// placeholders) and live probing of the staging site.
const ARCHIVE_CONFIG: Record<
  ArchiveRoute,
  { path: string; title: string; searchPlaceholder: string }
> = {
  "hot-deal": {
    path: "/hot-deal/",
    title: "Hot Deals",
    searchPlaceholder: "Search auctions...",
  },
  "regular-store": {
    path: "/regular-store/",
    title: "Store",
    searchPlaceholder: "Search store...",
  },
  auctions: {
    path: "/auctions/",
    title: "Auctions",
    searchPlaceholder: "Search auctions...",
  },
  categories: {
    path: "/categories/",
    title: "Categories",
    searchPlaceholder: "Search products...",
  },
};

export class ArchivePage {
  readonly page: Page;
  readonly route: ArchiveRoute;
  readonly title: Locator;
  readonly searchBox: Locator;
  readonly productLinks: Locator;

  constructor(page: Page, route: ArchiveRoute) {
    this.page = page;
    this.route = route;
    const cfg = ARCHIVE_CONFIG[route];

    // /categories/ exposes its title as a heading; the other archives show it in
    // the banner. The mobile + desktop layouts duplicate the banner text, one of
    // them hidden — filter to the visible copy.
    this.title =
      route === "categories"
        ? page.getByRole("heading", { name: cfg.title, exact: true })
        : page
            .getByRole("banner")
            .getByText(cfg.title, { exact: true })
            .filter({ visible: true })
            .first();
    this.searchBox = page.getByPlaceholder(cfg.searchPlaceholder);
    this.productLinks = page.locator('a[href*="/product/"]');
  }

  async goto() {
    await bypassHotDealPasswordGate(this.page);
    await this.page.goto(ARCHIVE_CONFIG[this.route].path, {
      waitUntil: "domcontentloaded",
    });
    await this.title.waitFor({ state: "visible" });
  }

  tab(name: string) {
    return this.page.getByRole("tab", { name });
  }

  button(name: string | RegExp) {
    return this.page.getByRole("button", { name });
  }
}
