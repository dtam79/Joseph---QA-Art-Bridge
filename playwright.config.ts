import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

// Run mode selection (no config edits needed):
//   RUN_MODE=emulator (default) → mobile device emulation (iPhone 13)
//   RUN_MODE=browser            → desktop browser (Desktop Chrome)
// Examples:
//   RUN_MODE=browser pnpm test
//   RUN_MODE=browser pnpm exec playwright test --headed
// RUN_MODE switches every project between mobile emulation and desktop — except
// oh-good, whose mobile layout hides the top nav and the admin sidebar entirely
// (the suite targets the desktop layout). See deviceFor() below.
const runMode = process.env.RUN_MODE === "browser" ? "browser" : "emulator";
const mobileDevice = runMode === "browser" ? "Desktop Chrome" : "iPhone 13";

// Per-project device override: oh-good is a desktop web app — its iPhone layout
// renders the top nav as a hamburger and drops the admin dashboard sidebar, so
// the shell tests would never pass in emulator mode.
const deviceFor = (project: string): string =>
  project === "oh-good" ? "Desktop Chrome" : mobileDevice;

// Browser engine override:
//   BROWSER=chromium|firefox|webkit — forces that engine for every project.
//   Unset — each device profile uses its natural engine
//   (iPhone 13 emulator → webkit, Desktop Chrome → chromium).
const BROWSERS = ["chromium", "firefox", "webkit"] as const;
const rawBrowser = (process.env.BROWSER ?? "").trim().toLowerCase();
if (rawBrowser && !(BROWSERS as readonly string[]).includes(rawBrowser)) {
  throw new Error(
    `BROWSER must be one of ${BROWSERS.join(", ")} (got "${
      process.env.BROWSER
    }")`
  );
}
const browserOverride = rawBrowser
  ? ({ browserName: rawBrowser as (typeof BROWSERS)[number] } as const)
  : {};

// Local web servers (Playwright's webServer): boot the apps under test locally
// instead of pointing at deployed URLs. For each app, set:
//   <APP>_WS_COMMAND  — shell command that starts the app (e.g. "docker compose up -d --wait")
//   <APP>_WS_URL      — URL the app answers on (e.g. http://localhost:3000)
//   <APP>_WS_CWD      — optional working directory (e.g. ../art-bridge after a CI checkout)
// When <APP>_WS_COMMAND + <APP>_WS_URL are set, Playwright boots the server before
// tests and that project's baseURL points at the local URL. Otherwise the project
// falls back to the deployed <APP>_URL.
// Staging sites throttle under too many parallel browser sessions (oh-good is
// especially load-sensitive) — cap the default worker count. Raise it per-run
// with PLAYWRIGHT_WORKERS=8 for faster runs on infrastructure that can take it.
const workers = Number(process.env.PLAYWRIGHT_WORKERS ?? 4);

const apps = [
  { prefix: "ART_BRIDGE" },
  { prefix: "HOT_DEAL" },
  { prefix: "OH_GOOD" },
] as const;

const webServer = apps.flatMap(({ prefix }) => {
  const command = process.env[`${prefix}_WS_COMMAND`];
  const url = process.env[`${prefix}_WS_URL`];
  if (!command || !url) return [];
  return [
    {
      command,
      url,
      cwd: process.env[`${prefix}_WS_CWD`],
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ];
});

function baseURLFor(
  prefix: (typeof apps)[number]["prefix"]
): string | undefined {
  const wsURL = process.env[`${prefix}_WS_URL`];
  if (wsURL && process.env[`${prefix}_WS_COMMAND`]) return wsURL;
  // <APP>_URL is the canonical key (used by CI / qa.yml); fall back to the
  // main/staging pairs that the local .env and morning-check workflow use.
  // Treat empty strings (e.g. an unset secret passed as "") as missing so
  // the next candidate is tried instead of navigating to an invalid URL.
  const url = (k: string) => { const v = process.env[k]; return v ? v : undefined; };
  return (
    url(`${prefix}_URL`) ??
    url(`${prefix}_STAGING_URL`) ??
    url(`${prefix}_MAIN_URL`)
  );
}

export default defineConfig({
  timeout: 60_000,
  workers,
  reporter: [["list"], ["./projects/morning-check/telegram-reporter.ts"]],

  webServer,

  use: {
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "morning-check",
      testDir: "./projects/morning-check/specs",
      fullyParallel: true,
      retries: 1,
      // Login flows hit slow password gates + far-away staging servers — the
      // 60s default is too tight for the bounded wait chain.
      timeout: 180_000,
      use: {
        headless: true,
        // FIX 3: Spoof a real desktop browser to bypass basic WAFs
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    },
    {
      name: "art-bridge",
      testDir: "./projects/art-bridge/specs",
      use: {
        ...devices[mobileDevice],
        ...browserOverride,
        baseURL: baseURLFor("ART_BRIDGE"),
      },
    },
    {
      name: "hot-deal",
      testDir: "./projects/hot-deal/specs",
      use: {
        ...devices[mobileDevice],
        ...browserOverride,
        baseURL: baseURLFor("HOT_DEAL"),
      },
    },
    {
      name: "oh-good",
      testDir: "./projects/oh-good/specs",
      // Staging is slow under parallel load — one retry absorbs transient
      // nav/timeout flakes (discovery, register flow, influencers). The long
      // budget also leaves room for the page objects' bounded goto retries
      // (3 attempts × 50s + backoff) when the server throttles under load.
      retries: 1,
      timeout: 180_000,
      use: {
        ...devices[deviceFor("oh-good")],
        ...browserOverride,
        baseURL: baseURLFor("OH_GOOD"),
      },
    },
  ],
});
