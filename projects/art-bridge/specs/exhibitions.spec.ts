import { test, expect } from "@playwright/test";
import { ExhibitionsPage } from "../pages/exhibitions.page";

const RANGE_RE = /^[A-Za-z]{3}\s+\d{1,2}\s*-\s*[A-Za-z]{3}\s+\d{1,2},\s*\d{4}$/;

function parseRange(s: string): { start: Date; end: Date } {
  const m = s.match(
    /([A-Za-z]{3})\s+(\d{1,2})\s*-\s*([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{4})/
  )!;
  return {
    start: new Date(`${m[1]} ${m[2]}, ${m[5]}`),
    end: new Date(`${m[3]} ${m[4]}, ${m[5]}`),
  };
}

test.describe("Exhibition date logic", () => {
  let ex: ExhibitionsPage;

  test.beforeEach(async ({ page }) => {
    ex = new ExhibitionsPage(page);
    await ex.goto();
  });

  test("cards expose valid, logical date ranges", async () => {
    const ranges = await ex.getAllDateRanges();
    expect(
      ranges.length,
      "expected at least one dated event card"
    ).toBeGreaterThan(0);

    for (const r of ranges) {
      expect(r, `bad format: "${r}"`).toMatch(RANGE_RE);
      const { start, end } = parseRange(r);
      expect(end >= start, `end date before start date: "${r}"`).toBeTruthy();
    }

    console.log(`\n📅 Found ${ranges.length} event date range(s):`);
    ranges.forEach((r) => console.log("   •", r));
  });

  test("Exhibitions / Festivals / Open Calls tabs render", async () => {
    await expect(ex.tabExhibitions).toBeVisible();
    await expect(ex.tabFestivals).toBeVisible();
    await expect(ex.tabOpenCalls).toBeVisible();
  });
});
