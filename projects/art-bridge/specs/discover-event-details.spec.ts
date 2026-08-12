import { test } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

test.setTimeout(90_000);

test("DISCOVER /event-details/", async ({ page }) => {
  // Use a valid event_id we discovered earlier
  await page.goto("/event-details/?event_id=FST-0010");
  await bypassPasswordGate(page);
  await page.waitForTimeout(3000);

  console.log("🔗 URL:", page.url());
  console.log(
    "\n===== ARIA SNAPSHOT =====\n" +
      (await page.locator("body").ariaSnapshot()) +
      "\n========================="
  );
});
