import { test, expect } from "@playwright/test";
import { ChatPage } from "../pages/chat.page";

test.describe("Chat page (/chat/)", () => {
  let chat: ChatPage;

  test.beforeEach(async ({ page }) => {
    chat = new ChatPage(page);
    await chat.goto();
  });

  test("shows the assistant greeting, announcement and + button", async () => {
    await expect(chat.assistantGreeting).toBeVisible();
    await expect(chat.announcement).toBeVisible();
    await expect(chat.plusButton).toBeVisible();
  });

  test("BUG-CATCHER GAB-32: message input must be VISIBLE (not just present)", async () => {
    const input = chat.page.locator("#message-input");

    // It IS in the DOM...
    await expect(input).toBeAttached();

    // ...but it MUST be visible & enabled for a real user to type. Fails today (CSS-hidden).
    await expect(input).toBeVisible({ timeout: 5000 });
    await expect(input).toBeEnabled();
  });
});
