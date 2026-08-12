import { test, expect } from "@playwright/test";
import { OnboardingPage } from "../pages/onboarding.page";

test.describe("Onboarding Carousel", () => {
  test("displays the first slide by default", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await expect(onboarding.slide1Heading).toBeVisible();
    await expect(onboarding.nextButton).toBeVisible();
    await expect(onboarding.skipButton).toBeVisible();
  });

  test("navigates through all 3 slides using Next button", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    // Slide 1 is already visible from goto()

    // Go to Slide 2
    await onboarding.clickNext();
    await expect(onboarding.slide2Heading).toBeVisible();

    // Go to Slide 3
    await onboarding.clickNext();
    await expect(onboarding.slide3Heading).toBeVisible();
  });

  test("Skip button allows bypassing the carousel", async ({ page }) => {
    const onboarding = new OnboardingPage(page);
    await onboarding.goto();

    await onboarding.clickSkip();

    // Assert that we left the /onboarding/ page
    // (Usually skipping onboarding takes you to the Home page or Login)
    await expect(page).not.toHaveURL(/.*onboarding.*/);
  });
});
