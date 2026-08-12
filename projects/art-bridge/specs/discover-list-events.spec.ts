import { test } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

test.setTimeout(90_000);

test("DISCOVER /list-events/", async ({ page }) => {
  await page.goto("/list-events/");
  await bypassPasswordGate(page);
  await page.waitForTimeout(3000);

  console.log("🔗 URL:", page.url());
  console.log(
    "\n===== ARIA SNAPSHOT =====\n" +
      (await page.locator("body").ariaSnapshot()) +
      "\n========================="
  );
});
