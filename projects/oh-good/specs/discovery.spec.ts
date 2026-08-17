import { test } from "@playwright/test";
import { saveEvidence } from "../../../shared/utils/evidence.js";

// Increase timeout for this discovery script (20 pages × slow staging under
// parallel load — a single pass can take several minutes).
test.setTimeout(480_000);

test("DISCOVERY: map the real site structure", async ({ page }) => {
  console.log("\n🗺️  STARTING OH-GOOD SITE DISCOVERY\n");

  // Helper to safely navigate, then save ARIA snapshot + screenshot as evidence
  // (also prints the ARIA tree to the console).
  const visitAndSnap = async (
    pageTitle: string,
    url: string,
    snapName: string
  ) => {
    try {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📄 ${pageTitle}`);

      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

      console.log(`🔗 URL: ${page.url()}`);
      console.log("=".repeat(60));

      await saveEvidence(page, "oh-good", "discover", snapName);
    } catch (error: any) {
      console.log(`❌ FAILED to load ${pageTitle}: ${error.message}`);
    }
  };

  // 1. Marketing pages
  await visitAndSnap("HOME PAGE", "/", "home-2-live");
  await visitAndSnap("SERVICES PAGE", "/service/", "service-1-default");
  await visitAndSnap(
    "PRICING MATRIX PAGE",
    "/pricing-matrix/",
    "pricing-1-default"
  );
  await visitAndSnap("CONTACT PAGE", "/contact/", "contact-1-default");

  // 2. Influencer discovery
  await visitAndSnap("INFLUENCERS LIST", "/influencers/", "influencers-2-live");
  await visitAndSnap(
    "INFLUENCER DETAIL (etetet)",
    "/influencer/etetet/",
    "influencer-detail-1-default"
  );

  // 3. Auth pages — note both /login/ and /log-in/ resolve
  await visitAndSnap("LOGIN (/login/)", "/login/", "login-2-live");
  await visitAndSnap(
    "LOGIN (/log-in/ variant)",
    "/log-in/",
    "log-in-1-variant"
  );
  await visitAndSnap("REGISTER", "/register/", "register-3-live");
  await visitAndSnap(
    "PASSWORD RESET",
    "/password-reset/",
    "password-reset-1-default"
  );

  // 4. App dashboard (guest)
  await visitAndSnap(
    "GUEST DASHBOARD (/my/home/)",
    "/my/home/",
    "dashboard-2-live"
  );

  // 5. Role dashboards — /admin-dashboard/ is guest-accessible; the rest
  // redirect logged-out visitors to the login page.
  await visitAndSnap(
    "ADMIN DASHBOARD (guest viewer)",
    "/admin-dashboard/",
    "admin-dashboard-1-guest"
  );
  await visitAndSnap(
    "INFLUENCER DASHBOARD (logged-out)",
    "/influencer-dashboard/",
    "influencer-dashboard-1-guest"
  );
  await visitAndSnap(
    "ADVERTISER DASHBOARD (logged-out)",
    "/advertiser-dashboard/",
    "advertiser-dashboard-1-guest"
  );
  await visitAndSnap(
    "MY/ADVERTISER DASHBOARD (logged-out)",
    "/my/advertiser-dashboard/",
    "my-advertiser-dashboard-1-guest"
  );
  await visitAndSnap(
    "MY/INFLUENCER DASHBOARD (logged-out)",
    "/my/influencer-dashboard/",
    "my-influencer-dashboard-1-guest"
  );
  // NOTE: /dashboard/ is the WordPress admin — it redirects to wp-login.php
  await visitAndSnap(
    "DASHBOARD (/dashboard/ → wp-admin)",
    "/dashboard/",
    "dashboard-1-wp-admin"
  );

  // 6. Admin subpages (all guest-accessible via the guest viewer role)
  await visitAndSnap(
    "ADMIN USERS",
    "/admin-dashboard/users/",
    "admin-users-1-guest"
  );
  await visitAndSnap(
    "ADMIN CAMPAIGNS",
    "/admin-dashboard/campaigns/",
    "admin-campaigns-1-guest"
  );
  await visitAndSnap(
    "ADMIN REPORTS",
    "/admin-dashboard/reports/",
    "admin-reports-1-guest"
  );
  await visitAndSnap(
    "ADMIN POINTS & PAYMENT",
    "/admin-dashboard/points-payment/",
    "admin-points-payment-1-guest"
  );

  console.log("\n✅ DISCOVERY COMPLETE\n");
});
