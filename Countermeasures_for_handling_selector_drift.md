# Multi-Site Automated Monitoring & E2E Validation Framework

**Document Control**

* **Project:** Multi-Site Availability & User-Flow Monitoring
* **Subject:** Technical Architecture, Live-Server Selector Resilience, & Operational Playbook

---

## 1. Executive Summary

As web properties scale across staging and production environments, relying on passive HTTP uptime pings (e.g., standard status-code checks) is insufficient. Modern Single-Page Applications (SPAs) and dynamic CMS platforms can return an HTTP `200 OK` status while serving a blank white page, throwing fatal frontend JavaScript exceptions, or silently failing authentication flows.

This document details the architecture and operational procedures for an automated synthetic monitoring solution. Built using **Playwright** on a scheduled CI/CD engine (**GitHub Actions**), the framework executes end-to-end user journeys (availability checks, multi-step authentications, and role validations) and broadcasts real-time alerts via **Telegram** alongside error diagnostic artifacts.

Special architectural focus is placed on **handling selector drift and live-server UI churn**—ensuring the monitoring pipeline remains resilient against frequent CMS updates, redesigned classes, and staging environment variations.

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MONITORING INFRASTRUCTURE                          │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│    GitHub Actions    │   Playwright Engine  │    Telegram & Alerting        │
│ (Scheduled Trigger)  │ (Browser Automation) │    (Instant Notification)     │
│  • Cron (daily)      │  • Headless Chromium │  • Immediate Failure Pings    │
│  • Matrix Multi-Site │  • Semantic Locators │  • Trace / Video Link Delivery│
│  • Secrets Injection │  • Network Intercept │  • Weekly Availability Stats  │
└──────────┬───────────┴──────────┬───────────┴───────────────▲───────────────┘
           │                      │                           │
           │ (Dispatch Matrix)    │ (Execute User Journeys)   │ (Publish Status)
           ▼                      ▼                           │
┌─────────────────────────────────────────────────────────────┴───────────────┐
│                          SYNTHETIC TESTING TARGETS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Target 1: Oh Good Staging / Prod (https://staging.oh-good.net)           │
│  • Target 2: Art Bridge Staging / Prod (https://staging.art-bridge.kr)      │
│  • Target 3: Hot Deal Staging / Prod                                                      │
│  • Target 4: Handson-Trips Staging / Prod
└─────────────────────────────────────────────────────────────────────────────┘

```

### Core Components

* **GitHub Actions Scheduler:** Triggers parallel, headless test jobs at configurable intervals (e.g., daily) with zero hosting overhead.
* **Playwright Automation Engine:** Executes synthetic browser instances, handles authentication flows, validates API responses, and generates diagnostic traces.
* **Telegram Bot Integration:** Dispatches alerts to engineering and operations channels when availability drops below threshold or an authentication flow breaks.
* **Artifact Diagnostic Storage:** Automatically retains DOM traces, network `.har` logs, and failure screenshots for instant post-mortem analysis.

---

## 3. Operational Scenarios & Failure Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SCENARIO MATRIX & RECOVERY ACTION                       │
├──────────────────┬─────────────────────────────┬────────────────────────────┤
│ Trigger Scenario │ Underlying Cause            │ System Automated Response  │
├──────────────────┼─────────────────────────────┼────────────────────────────┤
│ 1. Normal State  │ System nominal (HTTP 200,   │ • Record uptime metrics    │
│                  │ UI rendered, login valid)   │ • Suppress noisy pings     │
├──────────────────┼─────────────────────────────┼────────────────────────────┤
│ 2. Infrastructure│ Server down, 500/502/503/404│ • Critical Alert to Dev gp │
│    Failure       │ gateway timeout, DNS drop   │ • 3-attempt fast retry     │
├──────────────────┼─────────────────────────────┼────────────────────────────┤
│ 3. Auth Failure  │ Backend DB lock, token issue│ • Immediate Alert to Team  │
│                  │ credential rejection        │ • Capture network HAR log  │
├──────────────────┼─────────────────────────────┼────────────────────────────┤
│ 4. Selector Drift│ Live server redesign, CMS   │ • Execute Union Locators   │
│                  │ class rename, modal change  │ • Save Trace Viewer file   │
└──────────────────┴─────────────────────────────┴────────────────────────────┘

```

### Detailed Scenario Workflows

#### Scenario 1: Normal Operational Verification

1. Scheduler triggers test matrix per site.
2. Playwright launches isolated browser context in headless mode.
3. Homepage and critical routes load under baseline latency ($< 3.0\text{ s}$).
4. Synthetic user logs in, verifies dashboard element visibility, and logs out.
5. Job exits cleanly with zero notification overhead.

#### Scenario 2: Network / Infrastructure Downtime

1. HTTP request or initial page navigation fails or returns status codes $\ge 400$.
2. System executes an automatic retry ($N=2$) to eliminate transient network blips.
3. If failure persists, Telegram notification is dispatched immediately with:
* Target Site Name & URL
* Response Status Code
* Execution Duration and Timestamp



#### Scenario 3: Functional / Authentication Breakdown

1. Site opens successfully, but the authentication API returns $401/500$ or validation banners appear.
2. Engine captures a full-page failure screenshot and extracts console error logs.
3. Telegram alert flags the failure as a **Functional Auth Failure** (differentiating from infrastructure downtime).

---

## 4. Handling Selector Drift & Live-Server UI Invalidation

A recurring risk in automated monitoring is **false alarms caused by selector degradation**—where the website is functioning correctly for human users, but automated tests break due to updated CSS classes, changed Elementor IDs, or altered DOM layouts.

### 4.1 Structural Prevention: Accessibility & Semantics over Fragile CSS

To eliminate selector fragility, tests adhere to a strict locator priority hierarchy:

| Selector Strategy | Implementation Syntax | Resilience Rating | Impact on Live Server Updates |
| --- | --- | --- | --- |
| **1. ARIA Role & Name** | `page.getByRole('button', { name: 'Log in' })` | 🟢 Highest | Survives full HTML restructures, framework migrations, and class renaming. |
| **2. Visible Label** | `page.getByLabel('Email address')` | 🟢 High | Resilient to ID/class changes as long as user-facing text remains intact. |
| **3. Test Attributes** | `page.getByTestId('auth-submit')` | 🟢 High | Stable developer contract, completely decoupled from styling changes. |
| **4. User Placeholder** | `page.getByPlaceholder('e.g. Alex Morgan')` | 🟡 Moderate | Survives CSS restructuring, but sensitive to copy changes. |
| **5. Layout Hierarchy** | `page.locator('div.wrap > div:nth-child(2) > button')` | 🔴 Prohibited | **Banned.** Breaks on every CMS update, wrapper change, or responsive shift. |

---

### 4.2 Runtime Resilience: Union Locators (`.or()`)

When testing live sites that may show varying button text (e.g., `"Log in"` vs. `"Sign in"`) or alternate responsive elements, Playwright evaluates multiple candidate selectors simultaneously using the `.or()` operator without waiting for sequential 30-second timeouts.

```typescript
// Multi-candidate selector: passes instantly whichever resolves first on the live server
const submitButton = page.getByRole('button', { name: /log in/i })
  .or(page.getByRole('button', { name: /sign in/i }))
  .or(page.locator('button#og-continue2'))
  .or(page.locator('input[type="submit"]'));

await submitButton.click();

```

---

### 4.3 Staging Protection & Environment Gate Handling

Staging environments often implement temporary password gates (e.g., `input[name="temp_password"]`) that are absent in production. The monitoring engine uses dynamic detection rather than failing on absent elements:

```typescript
// Fast evaluation for staging access gates (200ms timeout)
const tempPassInput = page.locator('input[name="temp_password"]');
if (await tempPassInput.isVisible({ timeout: 1000 }).catch(() => false)) {
  await tempPassInput.fill(process.env.STAGING_GATE_SECRET || '');
  await page.keyboard.press('Enter');
  await tempPassInput.waitFor({ state: 'detached', timeout: 5000 });
}

```

---

### 4.4 Automated Remediation via Playwright Trace Viewer

When a selector update cannot be resolved automatically:

1. Playwright generates a trace file (`trace.zip`) capturing every DOM snapshot, action, console log, and network event.
2. The on-call engineer opens the trace locally via:
```bash
npx playwright show-trace path/to/trace.zip

```


3. The engineer uses `npx playwright codegen <live-url>` to inspect new DOM properties and update the Page Object locator within minutes.

---

## 5. Technical Implementation Code

### 5.1 Playwright Test Suite (`tests/site_monitoring.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

interface TargetSite {
  name: string;
  url: string;
  authPath: string;
  credentials: { email: string; pass: string };
  dashboardRoute: RegExp;
}

const SITES: TargetSite[] = [
  {
    name: 'Oh Good Staging',
    url: 'https://staging.oh-good.net',
    authPath: '/login',
    credentials: {
      email: process.env.OH_GOOD_EMAIL || '',
      pass: process.env.OH_GOOD_PASSWORD || ''
    },
    dashboardRoute: /profile|dashboard|my-account/i
  }
];

for (const site of SITES) {
  test.describe(`Availability & Auth Flow: ${site.name}`, () => {
    
    test('Verify site accessibility, response latency, and authentication', async ({ page }) => {
      const startTime = Date.now();

      // 1. Accessibility Check
      const response = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      expect(response?.status(), `HTTP Status verification for ${site.url}`).toBeLessThan(400);

      const loadDuration = Date.now() - startTime;
      expect(loadDuration, 'Page Load Latency Benchmark').toBeLessThan(10000);

      // 2. Bypass Optional Staging Password Gates
      const tempGate = page.locator('input[name="temp_password"]');
      if (await tempGate.isVisible({ timeout: 1500 }).catch(() => false)) {
        await tempGate.fill(process.env.STAGING_TEMP_PW || '');
        await page.keyboard.press('Enter');
        await tempGate.waitFor({ state: 'detached', timeout: 5000 });
      }

      // 3. Navigate to Auth Flow
      await page.goto(`${site.url}${site.authPath}`, { waitUntil: 'networkidle' });

      // 4. Fill Credentials using Resilient Locators
      const emailInput = page.getByPlaceholder(/alex@|email/i)
        .or(page.getByLabel(/email/i))
        .or(page.locator('input[type="email"]'));

      const passwordInput = page.getByPlaceholder(/password/i)
        .or(page.getByLabel(/password/i))
        .or(page.locator('input[type="password"]'));

      await emailInput.fill(site.credentials.email);
      await passwordInput.fill(site.credentials.pass);

      // 5. Submit via Multi-Selector Union
      const submitBtn = page.getByRole('button', { name: /log in|sign in/i })
        .or(page.locator('button[type="submit"]'))
        .or(page.locator('input[type="submit"]'));

      await submitBtn.click();

      // 6. Validate Authentication Success
      await expect(page).toHaveURL(site.dashboardRoute, { timeout: 10000 });
    });
  });
}

```

---

### 5.2 Telegram Alerting Utility (`utils/telegram_notifier.ts`)

```typescript
import axios from 'axios';

export interface AlertPayload {
  siteName: string;
  url: string;
  stage: 'Availability' | 'Authentication' | 'Selector Drift';
  errorDetails: string;
  timestamp: string;
}

export async function sendTelegramAlert(payload: AlertPayload): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('Telegram alerting credentials not configured. Skipping alert dispatch.');
    return;
  }

  const message = [
    `🚨 *AUTOMATED MONITORING ALERT*`,
    `----------------------------------------`,
    `*Target:* ${payload.siteName}`,
    `*URL:* ${payload.url}`,
    `*Failed Stage:* ${payload.stage}`,
    `*Timestamp:* \`${payload.timestamp}\``,
    `*Error Output:* \`${payload.errorDetails.slice(0, 300)}\``,
    `----------------------------------------`,
    `⚡ Action Required: Check Playwright Trace artifacts in CI.`
  ].join('\n');

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
  }
}

```

---

### 5.3 GitHub Actions Workflow (`.github/workflows/monitor.yml`)

```yaml
name: Synthetic Site Availability & Auth Monitor

on:
  schedule:
    # Run every 30 minutes
    - cron: '*/30 * * * *'
  workflow_dispatch: # Manual trigger capability

jobs:
  run-synthetic-monitor:
    timeout-minutes: 15
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Install Playwright Browsers (Chromium only for fast CI)
        run: npx playwright install --with-deps chromium

      - name: Execute Synthetic Health Checks
        run: npx playwright test
        env:
          OH_GOOD_EMAIL: ${{ secrets.OH_GOOD_EMAIL }}
          OH_GOOD_PASSWORD: ${{ secrets.OH_GOOD_PASSWORD }}
          STAGING_TEMP_PW: ${{ secrets.STAGING_TEMP_PW }}
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}

      - name: Upload Test Failure Traces & Screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-failure-artifacts
          path: |
            test-results/
            playwright-report/
          retention-days: 7

```

---

## 6. Success Metrics & SLAs

* **Mean Time to Detect (MTTD):** Reduction from manual user report lag ($> 1\text{ to }4\text{ hours}$) down to **$< 30\text{ minutes}$**.
* **False Positive Rate:** Target **$< 2\%$** by enforcing semantic ARIA locators, `.or()` union selectors, and auto-retrying transient drops.
* **Test Suite Execution Runtime:** Full matrix validation across all sites completed in **$< 90\text{ seconds}$** per run using headless Chromium workers.
* **Cost Predictability:** 100% free and open-source execution model utilizing standard GitHub Actions monthly runner allocations.
