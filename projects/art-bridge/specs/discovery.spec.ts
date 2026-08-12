import { test } from "@playwright/test";

// Increase timeout for this discovery script
test.setTimeout(120_000);

test("DISCOVERY: map the real site structure", async ({ page }) => {
  console.log("\n🗺️  STARTING SITE DISCOVERY\n");

  // Helper function to bypass password gate
  const bypassPassword = async () => {
    const passwordBox = page.getByRole("textbox", { name: /enter password/i });
    if (await passwordBox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordBox.fill(process.env.ART_BRIDGE_PASSWORD!);
      await page.getByRole("button", { name: /access site/i }).click();
      await page.waitForLoadState("networkidle");
      console.log("🔓 Password gate bypassed");
    }
  };

  // Helper to safely navigate and print ARIA snapshot
  const visitAndPrint = async (pageTitle: string, url: string) => {
    try {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📄 ${pageTitle}`);

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await bypassPassword();

      console.log(`🔗 URL: ${page.url()}`);
      console.log("=".repeat(60));

      const snapshot = await page.locator("body").ariaSnapshot();
      console.log(snapshot);
    } catch (error) {
      console.log(`❌ FAILED to load ${pageTitle}: ${error.message}`);
    }
  };

  // 1. Start at root
  await visitAndPrint("HOME PAGE", "/");

  // 2. Check /onboarding/
  await visitAndPrint("ONBOARDING PAGE", "/onboarding/");

  // 3. Check bottom nav links
  console.log("\n👉 CHECKING BOTTOM NAVIGATION...");
  const navItems = ["Home", "Artists", "Gallery", "Chat", "Profile"];

  for (const navItem of navItems) {
    await visitAndPrint(
      `${navItem.toUpperCase()} PAGE`,
      `/${navItem.toLowerCase()}/`
    );
  }

  // 4. Check Profile -> Guest Sign In link
  console.log("\n👉 CHECKING PROFILE -> SIGN IN FLOW...");
  try {
    await page.goto("/profile/", { waitUntil: "domcontentloaded" });
    await bypassPassword();

    const signInLink = page.getByRole("link", { name: /Guest User Sign in/i });
    if (await signInLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signInLink.click();
      await page.waitForLoadState("networkidle");
      console.log(`🔗 Sign In URL: ${page.url()}`);
      const snapshot = await page.locator("body").ariaSnapshot();
      console.log("\n" + "=".repeat(60));
      console.log("📄 SIGN IN PAGE");
      console.log("=".repeat(60));
      console.log(snapshot);
    } else {
      console.log('⚠️  No "Guest User Sign in" link found on Profile page');
    }
  } catch (error) {
    console.log(`❌ Profile -> Sign In flow failed: ${error.message}`);
  }

  // 5. Common WordPress routes
  console.log("\n👉 CHECKING COMMON WP ROUTES...");
  const commonRoutes = [
    "/wp-login.php",
    "/my-account/",
    "/login/",
    "/register/",
    "/signup/",
  ];

  for (const route of commonRoutes) {
    await visitAndPrint(`${route} ROUTE`, route);
  }

  console.log("\n✅ DISCOVERY COMPLETE\n");
});
