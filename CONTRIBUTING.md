# Contributing

Thanks for joining the QA automation repo! This guide covers how we work: the
branch workflow, running the suite locally, and what must pass before a change
is merged.

## Branch workflow

- **`main`** — the default branch and the stable line. CI (`qa.yml`) runs the
  full matrix on pushes to main. Never push directly to `main`.
- **`joseph_feat`** — the shared feature branch the team currently works on.
  It is kept in sync with `main` and eventually merged back into it.

Flow:

1. Start from the shared branch and make sure it's up to date:

   ```bash
   git switch joseph_feat
   git pull
   ```

2. Create a short-lived working branch for your change (recommended):

   ```bash
   git switch -c joseph_feat/<name>/<short-description>
   # e.g. joseph_feat/john/fix-login-timeout
   ```

3. Make your changes and commit them with a clear message describing the *why*.

4. Push the branch and open a pull request **into `main`**:

   ```bash
   git push -u origin <your-branch>
   ```

   GitHub prints a PR link after the push, or visit
   `https://github.com/dtam79/Joseph---QA-Art-Bridge/pull/new/joseph_feat`.

5. Get a review and green CI, then merge into `main`.

Notes:

- Before opening a PR, merge/rebase the latest `main` into your branch so the
  PR is up to date.
- The scheduled morning check automatically commits
  `.github/telegram-last-message-id` to `main` every day — don't hand-edit
  that state file; it's maintained by the workflow.
- Keep PRs focused: one logical change per PR.

## Required checks before merging

Everything below must pass before a change lands on `main`.

1. **Typecheck** (also the first CI job):

   ```bash
   pnpm typecheck
   ```

2. **CI on the PR** — the `QA Automation` workflow (`qa.yml`) runs:
   typecheck → smoke tests (emulator + browser modes) → the full matrix
   (2 run modes × chromium / firefox / webkit). All jobs must be green.

3. **Locally** (recommended for changes touching specs or page objects):

   ```bash
   pnpm test              # all apps, emulator mode, headless
   pnpm test:browser      # all apps, desktop browser, headless
   pnpm exec playwright test --project=<app>   # one app, e.g. art-bridge
   ```

## Setup

```bash
pnpm install
pnpm exec playwright install chromium
cp .env.example .env   # then fill in the values
```

Never commit `.env` — it holds credentials and is gitignored. CI reads the same
values from GitHub Actions secrets, so a change that needs a new secret must be
added there too (repo admin).

## Layout at a glance

- `projects/<app>/specs/` — Playwright specs per app
- `projects/<app>/pages/` — Page Objects (locators centralized here: fix once,
  not in every spec)
- `shared/utils/` — shared helpers (retry-with-backoff navigation,
  password-gate bypass, evidence capture)
- `projects/morning-check/` — daily health probe + Telegram reporter
- `.github/workflows/` — `qa.yml` (full suite on push/PR), `morning-check.yml`
  (daily 08:00 MMT), `aug19-regression.yml` (one-off regression)

## Morning check & Telegram bot

- Run the health probe manually: `pnpm exec playwright test --project morning-check`
- Every summary is stamped with its `message_id`; delete one with
  `pnpm delete-message <message_id>` (details in the README).
- Bots can only delete their own messages, and only within 48 hours.
