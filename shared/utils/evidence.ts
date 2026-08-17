import { type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function saveEvidence(
  page: Page,
  projectName: string,
  moduleName: string,
  snapName: string
) {
  const snapDir = path.resolve(__dirname, `../../projects/${projectName}/data/snapshots/${moduleName}`);
  await fs.mkdir(snapDir, { recursive: true });
  
  const snapshot = await page.locator("body").ariaSnapshot();
  await fs.writeFile(path.join(snapDir, `${snapName}.aria.yml`), snapshot, "utf8");
  
  const file = path.join(snapDir, `${snapName}.png`);
  await page.screenshot({ path: file, fullPage: true });
  
  console.log(`\n========== ${snapName} ==========\n${snapshot}\n`);
  return { aria: snapshot, screenshot: file };
}
