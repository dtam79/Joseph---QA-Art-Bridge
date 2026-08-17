import { test, expect } from "@playwright/test";
import { RegisterPage } from "../pages/register.page";
import { saveEvidence } from "../../../shared/utils/evidence";

test.describe("Register Step 3 — Complete your profile", () => {
  // Every test that reaches step 3 registers a fresh disposable account on the
  // staging site, so each run must use a unique email (duplicates are rejected).
  const freshEmail = () => `qa.spec.${Date.now()}@example.com`;

  test("step 3 shows the full advertiser profile form", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.gotoProfileStep("Advertiser", freshEmail());

    await expect(registerPage.profileHeading).toBeVisible();
    await expect(registerPage.companyNameInput).toBeVisible();
    await expect(registerPage.industrySelect).toBeVisible();
    await expect(registerPage.companyTypeSelect).toBeVisible();
    await expect(registerPage.companySizeSelect).toBeVisible();
    await expect(registerPage.websiteInput).toBeVisible();
    await expect(registerPage.countrySelect).toBeVisible();
    await expect(registerPage.brandDescriptionInput).toBeVisible();
    await expect(registerPage.termsCheckbox).toBeVisible();
    await expect(registerPage.createAccountButton).toBeVisible();

    // Spot-check that the Industry dropdown exposes real options
    await expect(registerPage.industrySelect).toContainText("Technology");
    await expect(registerPage.industrySelect).toContainText("Beauty");
  });

  test("Create Account with missing required fields shows validation", async ({
    page,
  }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.gotoProfileStep("Advertiser", freshEmail());

    await registerPage.createAccountButton.click();

    // Live-verified: empty form shows "Required." (brand description) and a
    // terms error — the account must NOT be created. NOTE: the terms error is
    // rendered once per account type (advertiser + influencer) with one shown;
    // .first() matches the shown advertiser error.
    await expect(
      page.getByText("Required.", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("You must accept the terms.", { exact: true }).first()
    ).toBeVisible();
    await expect(registerPage.profileHeading).toBeVisible();
  });

  test("completing the profile creates the account", async ({ page }) => {
    const registerPage = new RegisterPage(page);
    await registerPage.gotoProfileStep("Advertiser", freshEmail());

    await registerPage.completeProfile();

    // The account POST + redirect can take a while on slow staging under
    // parallel load — bound the wait at the project timeout rather than a
    // tight 15s that flakes.
    await expect(registerPage.successHeading).toBeVisible({
      timeout: 60000,
    });

    // Persist evidence of the post-registration state (step 3 was previously
    // only captured up to the credentials step in the discovery snapshots)
    await saveEvidence(page, "oh-good", "discover", "register-3-profile");
  });
});
