import { test, expect } from "@playwright/test";
import { RoleSelectionPage } from "../pages/role-selection.page";

test.describe("Role Selection Page (/roles)", () => {
  test("displays the heading and all 3 role options", async ({ page }) => {
    const rolesPage = new RoleSelectionPage(page);
    await rolesPage.goto();

    await expect(rolesPage.heading).toBeVisible();
    await expect(rolesPage.exploreArtistsOption).toBeVisible();
    await expect(rolesPage.imAnArtistOption).toBeVisible();
    await expect(rolesPage.imAnOrganizerOption).toBeVisible();
  });

  test('clicking "Explore Artists" proceeds to account creation', async ({
    page,
  }) => {
    const rolesPage = new RoleSelectionPage(page);
    await rolesPage.goto();

    await rolesPage.exploreArtistsOption.click();

    // Figma says the next screen has the heading "Create your account"
    await expect(
      page.getByRole("heading", { name: /create your account/i })
    ).toBeVisible({ timeout: 10000 });
  });

  test('clicking "I\'m an Artist" proceeds to account creation', async ({
    page,
  }) => {
    const rolesPage = new RoleSelectionPage(page);
    await rolesPage.goto();

    await rolesPage.imAnArtistOption.click();

    await expect(
      page.getByRole("heading", { name: /create your account/i })
    ).toBeVisible({ timeout: 10000 });
  });
});
