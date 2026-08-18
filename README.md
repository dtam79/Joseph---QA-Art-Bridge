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

It runs automatically every day at 01:30 UTC (= 08:00 MMT Myanmar / 10:30 KST) from
GitHub Actions (`.github/workflows/morning-check.yml`) and can be triggered manually
from the Actions page. Run it locally with:

```bash
pnpm exec playwright test --project morning-check
```

Targets and login config live in `projects/morning-check/sites.config.ts`; URLs and
credentials come from `.env` (or workflow secrets).

## Telegram bot & summary cleanup

The morning check posts its summary to a Telegram group through a custom reporter
(`projects/morning-check/telegram-reporter.ts`). Every summary is **stamped with its
own `message_id`** (appended to the message right after it is sent), and the previous
day's summary is **auto-deleted** when a new one is posted, so the group only ever
holds the latest summary. Telegram only lets bots delete their own messages, and
only within 48 hours of sending.

| Command | What it does |
|---|---|
| `pnpm exec playwright test --project morning-check` | Run the morning check manually (posts the summary to Telegram) |
| `pnpm delete-message <message_id>` | Delete a summary by its id (uses `TELEGRAM_CHAT_ID` from `.env`) |
| `pnpm delete-message <chat_id> <message_id>` | Delete a summary from a specific chat |
| `pnpm typecheck` | Typecheck specs, pages, shared utils and scripts (also run first in CI) |

How the auto-clean works: after each CI run (`morning-check.yml`) the reporter reads
the previous `message_id` from the committed state file
`.github/telegram-last-message-id`, sends the new summary, deletes the previous one,
then writes the new id back to the file. The workflow commits the updated file with
`[skip ci]` in the message (and `qa.yml` ignores that path), so the daily record
commit never re-triggers the QA suite. The reporter also writes the id to the
GitHub Actions step output (`steps.morning-check.outputs.telegram_message_id`) and
to the run's step summary, so it stays recoverable from CI logs even if the
footer edit fails.

Messages sent before the stamping feature was added can't be deleted via the Bot
API — their ids were never recorded and Telegram does not expose a bot's own
outgoing message history — so remove those manually from the group.

## GitHub Actions secrets

The workflows read everything from repo secrets — nothing is committed. Create them at
**Settings → Secrets and variables → Actions → New repository secret** (repo admin
required) with the exact names below:

| Secret | Used by | Purpose |
|---|---|---|
| `ART_BRIDGE_URL` | qa.yml | art-bridge deployed base URL |
| `HOT_DEAL_URL` | qa.yml | hot-deal deployed base URL |
| `OH_GOOD_URL` | qa.yml | oh-good deployed base URL |
| `ART_BRIDGE_PASSWORD` | qa.yml | art-bridge site-wide password gate |
| `HOT_DEAL_SITE_PASSWORD` | qa.yml | hot-deal site-wide password gate |
| `ART_BRIDGE_REPO_URL` | qa.yml (optional) | clone art-bridge and run it locally (docker) instead of the deployed URL |
| `HOT_DEAL_REPO_URL` | qa.yml (optional) | clone hot-deal and run it locally instead of the deployed URL |
| `OH_GOOD_REPO_URL` | qa.yml (optional) | clone oh-good and run it locally instead of the deployed URL |
| `TELEGRAM_BOT_TOKEN` | morning-check.yml, aug19-regression.yml | bot token for the Telegram summary |
| `TELEGRAM_CHAT_ID` | morning-check.yml, aug19-regression.yml | Telegram chat/group that receives the summary |
| `ART_BRIDGE_STAGING_URL` | morning-check.yml | art-bridge staging URL |
| `ART_BRIDGE_USER` / `ART_BRIDGE_PASS` | morning-check.yml | art-bridge login credentials |
| `HOT_DEAL_USER` / `HOT_DEAL_PASS` | morning-check.yml | hot-deal login credentials |
| `OH_GOOD_MAIN_URL` / `OH_GOOD_STAGING_URL` | morning-check.yml | oh-good URLs |
| `HANDS_MAIN_URL` / `HANDS_STAGING_URL` | morning-check.yml (optional) | hands-on-trip URLs |

Notes:
- **qa.yml** also needs `ART_BRIDGE_URL`, `HOT_DEAL_URL`, `OH_GOOD_URL` even when app repos
  are cloned — uncloned apps fall back to them, and the smoke job always uses them.
- **morning-check.yml** falls back to hardcoded defaults for keys it doesn't pass
  (`ART_BRIDGE_MAIN_URL` → `https://art-bridge.kr`, `HOT_DEAL_MAIN_URL` →
  `https://hot-deal.shop`, `HOT_DEAL_STAGING_URL` → `https://staging.hot-deal.shop`), so
  only set secrets that differ from those.
- Until a workflow's secrets exist, the run still executes: morning-check *skips* the
  affected checks, qa.yml *fails* the affected tests. The first push after creating the
  secrets can be triggered from the Actions tab (Re-run jobs / workflow_dispatch).

## Reports

An HTML report is written to `playwright-report/` after each run; open it with:

```bash
pnpm exec playwright show-report
```
