import { test, expect } from "@playwright/test";
import { WelcomePage } from "../pages/welcome.page";

test.describe("Onboarding (Welcome) screen", () => {
  test("shows brand heading and subtitle", async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();

    await expect(welcome.heading).toBeVisible();
    await expect(welcome.subtitle).toBeVisible();
    await expect(welcome.guestLink).toBeVisible();
  });

  test("Sign in opens the sign-in screen", async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();

    await welcome.signInButton.click();

    // Assert we landed on the sign-in screen (based on Figma: "Sign in to your account")
    await expect(
      page.getByRole("heading", { name: /sign in to your account/i })
    ).toBeVisible();
  });

  test("Sign up opens the role selection screen", async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();

    await welcome.signUpButton.click();

    // Assert we landed on the role selection screen (based on Figma: "Select your Role")
    await expect(
      page.getByRole("heading", { name: /select your role/i })
    ).toBeVisible();
  });
});
