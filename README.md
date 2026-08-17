# QA Automation

Playwright end-to-end test suite for the apps under QA — the final, full test suite.

## Apps under test

| Project      | Default run mode         | Notes            |
|--------------|--------------------------|------------------|
| `art-bridge` | Emulator (iPhone 13)     | mobile web app   |
| `hot-deal`   | Emulator (iPhone 13)     | mobile web app   |
| `oh-good`    | Desktop browser (Chrome) | desktop web app — its mobile layout hides the top nav and admin sidebar, so it always runs in desktop mode (see `deviceFor()` in the config) |

## Setup

```bash
pnpm install
pnpm exec playwright install chromium
```

Copy `.env.example` to `.env` and fill in the values (app URLs and password-gate secrets):

```bash
cp .env.example .env
```

The variable names match the GitHub Actions secrets used in CI (`qa.yml`).

## Running

The suite runs in two modes, chosen with `RUN_MODE` — no config edits needed:

- `RUN_MODE=emulator` (default) — mobile device emulation (iPhone 13) for every project
- `RUN_MODE=browser` — regular desktop browser (Desktop Chrome) for every project

`oh-good` is the exception: its mobile layout hides the top nav and the admin
dashboard sidebar, so that project always runs on `Desktop Chrome` regardless of
`RUN_MODE` (see `deviceFor()` in `playwright.config.ts`).

| Command                    | What it runs                                  |
|----------------------------|-----------------------------------------------|
| `pnpm test`                | All apps, emulator mode, headless             |
| `pnpm test:browser`        | All apps, desktop browser, headless           |
| `pnpm test:headed`         | Emulator mode in a visible window             |
| `pnpm test:browser:headed` | Desktop browser in a visible window           |

Browser engine is chosen with `BROWSER` (chromium/firefox/webkit). When unset, each
device profile uses its natural engine (iPhone 13 emulator → webkit, Desktop Chrome →
chromium):

```bash
BROWSER=firefox pnpm test
BROWSER=webkit pnpm test:browser
```

CI runs the full suite on all three engines × both run modes (see `qa.yml`).

Native Playwright options still work on top:

```bash
pnpm exec playwright test --project=art-bridge        # one app
pnpm exec playwright test --project=hot-deal --headed
RUN_MODE=browser pnpm exec playwright test --grep login
```

Staging sites throttle under many parallel browser sessions (oh-good is especially
load-sensitive), so the default worker count is capped at 4. Raise it per-run when
running against a fast/sturdy server:

```bash
PLAYWRIGHT_WORKERS=8 pnpm test
```

## Running against local servers

Instead of pointing at deployed URLs, each app can be booted locally with Playwright's
`webServer` config. For each app set:

- `<APP>_WS_COMMAND` — shell command that starts the app (e.g. `docker compose up -d --wait`)
- `<APP>_WS_URL` — URL the app answers on (e.g. `http://localhost:3000`)
- `<APP>_WS_CWD` — optional working directory (e.g. `../art-bridge` after checking out the repo)

```bash
ART_BRIDGE_WS_COMMAND="docker compose up -d --wait" \
ART_BRIDGE_WS_URL="http://localhost:3000" \
ART_BRIDGE_WS_CWD="../art-bridge" \
pnpm test --project=art-bridge
```

When `<APP>_WS_COMMAND` + `<APP>_WS_URL` are set, Playwright boots the server before the
tests and the project's `baseURL` points at it. Otherwise the project falls back to the
deployed `<APP>_URL`. In CI the workflow checks out the app repos and sets these variables
for you (see `qa.yml`; the shared setup steps live in `.github/actions/setup`).

`RUN_MODE` applies to `art-bridge` and `hot-deal`; `oh-good` always runs on
`Desktop Chrome` (its desktop layout is the tested surface).

## Morning check (daily health probe)

The `morning-check` project pings every site (main + staging) for the apps under QA,
asserting each is accessible (HTTP < 400, non-empty body) and that login works where
credentials are configured, then posts a summary to a Telegram group via the custom
reporter (`projects/morning-check/telegram-reporter.ts`).

It runs automatically every day at 00:00 UTC (= 09:00 KST) from GitHub Actions
(`.github/workflows/morning-check.yml`) and can be triggered manually from the Actions
page. Run it locally with:

```bash
pnpm exec playwright test --project morning-check
```

Targets and login config live in `projects/morning-check/sites.config.ts`; URLs and
credentials come from `.env` (or workflow secrets).

## Reports

An HTML report is written to `playwright-report/` after each run; open it with:

```bash
pnpm exec playwright show-report
```
