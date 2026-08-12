import { test, expect } from "@playwright/test";
import { EventDetailsPage } from "../pages/event-details.page";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

test.describe("Event Details Page", () => {
  let details: EventDetailsPage;

  test.beforeEach(async ({ page }) => {
    details = new EventDetailsPage(page);
    await details.goto("FST-0010");
  });

  test("shows event metadata (title, status, location, dates)", async () => {
    await expect(details.eventTitle).toHaveText(/traditional lacquerware/i);
    await expect(details.statusBadge).toBeVisible();
    await expect(details.location).toBeVisible();
    await expect(details.dates).toBeVisible();
  });

  test("back button returns to previous page (real user history)", async ({
    page,
  }) => {
    // Build REAL history like a user: list -> details, THEN press back
    await page.goto("/list-events/");
    await page.waitForTimeout(2000);
    await details.goto("FST-0010");

    await details.backButton.click();
    await expect(page).toHaveURL(/list-events/, { timeout: 8000 });
  });

  test("BUG-CATCHER GAB-35: bottom nav must show an active state on /list-events/", async ({
    page,
  }) => {
    await page.goto("/list-events/");
    await bypassPasswordGate(page);

    const galleryLink = page
      .getByRole("contentinfo")
      .getByRole("link", { name: "Gallery" });
    await expect(galleryLink).toBeVisible();

    const ariaCurrent = await galleryLink.getAttribute("aria-current");
    const cls = (await galleryLink.getAttribute("class")) ?? "";
    // Fails today: no aria-current="page" and no active/current class on the Gallery tab
    expect(
      ariaCurrent === "page" || /active|current|selected/i.test(cls),
      "GAB-35: Gallery tab has no active state on /list-events/"
    ).toBeTruthy();
  });

  test("BUG-CATCHER GAB-33: event should have a description or CTA button", async ({
    page,
  }) => {
    const allParagraphs = await page.getByRole("paragraph").count();
    const ctaButton = page.getByRole("button", {
      name: /register|buy|ticket|add to calendar/i,
    });
    const hasDescription = allParagraphs > 2;
    const hasCTA = await ctaButton.isVisible().catch(() => false);
    expect(
      hasDescription || hasCTA,
      "Event detail page is missing a description body and action buttons (GAB-33)"
    ).toBeTruthy();
  });
});
