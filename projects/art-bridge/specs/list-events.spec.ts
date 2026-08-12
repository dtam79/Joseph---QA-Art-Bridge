import { test, expect } from "@playwright/test";
import { ListEventsPage } from "../pages/list-events.page";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass"; // 👈 add this

const RANGE_RE = /[A-Za-z]{3}\s+\d{1,2}\s*-\s*[A-Za-z]{3}\s+\d{1,2},\s*\d{4}/;

test.describe("Events page (/list-events/)", () => {
  let ev: ListEventsPage;

  test.beforeEach(async ({ page }) => {
    ev = new ListEventsPage(page);
    await ev.goto();
  });

  test("shows heading, search, status badges and event cards", async () => {
    await expect(ev.heading).toBeVisible();
    await expect(ev.searchBox).toBeVisible();
    await expect(ev.eventCards.first()).toBeVisible();
    // Badges exist in DOM but are CSS-hidden (GAB-31) → assert attached, not visible
    await expect(ev.statusBadges.first()).toBeAttached();
  });

  test("every visible event card has a valid date range", async () => {
    const body = await ev.page.locator("body").innerText();
    const ranges = body.match(new RegExp(RANGE_RE.source, "g")) ?? [];
    expect(ranges.length, "expected dated event cards").toBeGreaterThan(0);
    ranges.forEach((r) => expect(r).toMatch(RANGE_RE));
  });

  test("BUG-CATCHER GAB-27: event links must have a non-empty event_id", async () => {
    const hrefs = await ev.eventCards.evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).href)
    );
    const empty = hrefs.filter(
      (h) => /event_id=\s*$/.test(h) || !/event_id=/.test(h)
    );
    expect(
      empty,
      `${empty.length} event card(s) have missing event_id`
    ).toHaveLength(0);
  });

  test("GAB-30 (monitor): grid loader should clear — logs state, fails only if stuck > 15s", async () => {
    const loader = ev.page.locator("#gab-grid-loader.active");
    // Give it a generous window; the bug is intermittent, so we only hard-fail
    // if it's STILL stuck after 15s (definitely broken), otherwise we log it.
    const stuck = await loader.isVisible({ timeout: 15000 }).catch(() => false);
    if (stuck) {
      // Wait to see if it eventually clears
      const cleared = await expect(loader)
        .toBeHidden({ timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      console.log(
        cleared
          ? "\n⚠️ GAB-30: loader was slow but cleared"
          : "\n🚫 GAB-30: loader stuck > 25s"
      );
      expect(
        cleared,
        "GAB-30: grid loader stuck and never cleared"
      ).toBeTruthy();
    } else {
      console.log("\n✅ GAB-30: loader cleared promptly this run");
    }
  });

  test("GAB-30b: event-card click does not navigate (documents broken handler)", async ({
    page,
  }) => {
    const target = ev.eventCards
      .filter({ hasNot: ev.page.locator('[href$="event_id="]') })
      .first();
    const href = await target.getAttribute("href");
    expect(href, "card should have a valid event_id href").toMatch(
      /event-details\/\?event_id=.+/
    );

    await target.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1500);

    const navigated = /event-details/.test(page.url());
    console.log(`\n🚫 GAB-30b: href=${href} | navigated=${navigated}`);
    // Hard assertion: navigation is broken today. Flips when the click handler is fixed.
    expect(
      navigated,
      "event card click should navigate to detail page (GAB-30b)"
    ).toBeFalsy();
  });
  test("BUG-CATCHER GAB-36: loading animation must be visible in the initial viewport", async ({
    page,
  }) => {
    // CHANGE THIS LINE: add waitUntil: 'domcontentloaded'
    await page.goto("/list-events/", { waitUntil: "domcontentloaded" });
    await bypassPasswordGate(page);

    // Catch the loader while it is active
    const loader = page.locator("#gab-grid-loader").first();
    await loader.waitFor({ state: "visible", timeout: 10000 });

    const box = await loader.boundingBox();
    const viewport = page.viewportSize();
    expect(box, "loader should be rendered").toBeTruthy();
    // Fails today: loader top-edge is BELOW the visible phone screen
    expect(
      box!.y,
      `GAB-36: loader sits at y=${Math.round(box!.y)}px but viewport is only ${
        viewport!.height
      }px tall (below the fold)`
    ).toBeLessThan(viewport!.height);
  });
});
