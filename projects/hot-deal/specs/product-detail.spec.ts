import { test, expect } from "@playwright/test";
import { ProductDetailPage } from "../pages/product-detail.page";

// Evidence-backed product (linked from the home page snapshot)
const PRODUCT = {
  url: "/product/red-cookies-marshmallow-powder-lipstick-scarlet-laurent/",
  titleFragment: /red cookies marshmallow powder lipstick/i,
  price: "45,000 Ks",
};

test.describe("Product Detail Page (/product/)", () => {
  test("shows the product title, price and availability", async ({ page }) => {
    const product = new ProductDetailPage(page, PRODUCT);
    await product.goto();

    await expect(product.titleHeading).toContainText(PRODUCT.titleFragment);
    await expect(product.price).toBeVisible();
    await expect(product.availability).toBeVisible();
  });

  test("shows purchase controls (quantity + Add to Cart)", async ({ page }) => {
    const product = new ProductDetailPage(page, PRODUCT);
    await product.goto();

    await expect(product.quantitySpinbutton).toBeVisible();
    await expect(product.addToCartButton).toBeVisible();
  });

  test("shows the info sections", async ({ page }) => {
    const product = new ProductDetailPage(page, PRODUCT);
    await product.goto();

    await expect(product.detailsHeading).toBeVisible();
    await expect(product.shippingHeading).toBeVisible();
  });
});
