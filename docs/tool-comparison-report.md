# Automation Tool Comparison Report — Cypress vs Playwright

Prepared by: QA (Joseph) · Aug 2026 · Scope: 4 products × 2 environments (8 targets)

## 1. Comparison

| Criterion               | Cypress                        | Playwright                            |
| ----------------------- | ------------------------------ | ------------------------------------- |
| Multi-tab/popup         | Limited (single-tab)           | Full support                          |
| Engines                 | Chrome/FF/WebKit (WebKit late) | Chromium/WebKit/Firefox first-class   |
| Parallelism (8 targets) | Paid Dashboard or workarounds  | Native, free workers                  |
| Mobile emulation        | Viewport-only                  | Full device (UA/touch/scale)          |
| Auto-waiting            | Yes                            | Yes + actionability checks            |
| Debugging               | Time-travel                    | Trace Viewer + Inspector + headed     |
| API + UI mixed          | cy.request                     | Seamless request + page               |
| Team investment         | None                           | Monorepo + page objects already built |

## 2. Decision: **Playwright**

Faster parallel runs across 8 targets, real mobile emulation, and zero migration cost (we reuse the existing framework).

## 3. Daily Morning Check Design

GitHub Actions cron (08:00 local) → Playwright runs 16 checks in parallel → custom reporter posts one ✅/❌ summary to the team Telegram group. No extra servers (n8n not needed).

## 4. Handling locator/selector drift after live-server updates

- **Prevent:** resilient locators (role/label/text), `data-testid` contract with devs, all locators centralized in Page Objects (fix once, not in 20 tests).
- **Detect:** morning-check alerts on Telegram within minutes; CI `toMatchAriaSnapshot()` baselines flag structural changes on every deploy.
- **Respond:** single-place fix in the Page Object; re-run the one affected spec.
- **Self-healing research:** Healenium (open-source), Testim/Mabl (commercial AI). Conclusion: not needed now — resilient locators + instant alerting cover us; auto-healing can mask real regressions.

## 5. Schedule

- Daily: morning check (automated).
- **Aug 19:** regression round on Oh-Good + Hot Deal fixes (scheduled workflow + manual verification).
