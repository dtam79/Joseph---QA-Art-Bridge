import { Page, Locator } from "@playwright/test";
import { bypassHotDealPasswordGate } from "../../../shared/utils/password-bypass";

export type ProductDetailOptions = {
  url: string;
  price: string;
};

export class ProductDetailPage {
  readonly page: Page;
  readonly url: string;
  readonly titleHeading: Locator; // level 1 = the canonical product title
  readonly price: Locator;
  readonly availability: Locator;
  readonly quantitySpinbutton: Locator;
  readonly addToCartButton: Locator;
  readonly detailsHeading: Locator;
  readonly shippingHeading: Locator;
  readonly backLink: Locator;

  constructor(page: Page, opts: ProductDetailOptions) {
    this.page = page;
    this.url = opts.url;

    this.titleHeading = page.getByRole("heading", { level: 1 });
    this.price = page.getByText(opts.price, { exact: true }).first();
    this.availability = page.getByText(/in stock/i).first();
    this.quantitySpinbutton = page.getByRole("spinbutton", {
      name: /product quantity/i,
    });
    // The mobile and desktop layouts each render an Add to Cart button
    this.addToCartButton = page
      .getByRole("button", { name: /add to cart/i })
      .first();
    this.detailsHeading = page
      .getByRole("heading", { name: /product details/i, level: 3 })
      .first();
    this.shippingHeading = page
      .getByRole("heading", { name: /shipping/i, level: 3 })
      .first();
    this.backLink = page.getByRole("link", { name: "Go back" });
  }

  async goto() {
    await bypassHotDealPasswordGate(this.page);
    await this.page.goto(this.url, { waitUntil: "domcontentloaded" });
    await this.titleHeading.waitFor({ state: "visible" });
  }
}
