import { test, expect } from "@playwright/test";
import { AdminUsersPage } from "../pages/admin-users.page";

test.describe("Admin Users page (/admin-dashboard/users/)", () => {
  let users: AdminUsersPage;

  test.beforeEach(async ({ page }) => {
    users = new AdminUsersPage(page);
    await users.goto();
  });

  test("renders the users page with management section", async () => {
    await expect(users.heading).toBeVisible();
    await expect(users.managementHeading).toBeVisible();
    await expect(users.description).toBeVisible();
  });

  test("shows the user management toolbar", async () => {
    await expect(users.rolesFilter).toBeVisible();
    await expect(users.statusFilter).toBeVisible();
    await expect(users.exportButton).toBeVisible();
  });

  test("is guest-accessible and shares the admin shell", async () => {
    // No login redirect + the sidebar shell is present
    await expect(users.navDashboard).toBeVisible();
    await expect(users.logoutLink).toBeVisible();
  });
});
