import { Page, Locator } from "@playwright/test";
import { bypassPasswordGate } from "../../../shared/utils/password-bypass";

export class ChatPage {
  readonly page: Page;
  readonly assistantGreeting: Locator;
  readonly announcement: Locator;
  readonly plusButton: Locator;
  readonly messageInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.assistantGreeting = page.getByText(/how can i help you today/i);
    this.announcement = page.getByText(/announcement/i);
    this.plusButton = page.getByRole("button", { name: "+" });
    // Best-effort: try common input roles/placeholders
    this.messageInput = page.locator("#message-input");
  }

  async goto() {
    await this.page.goto("/chat/");
    await bypassPasswordGate(this.page);
    await this.assistantGreeting.waitFor({ state: "visible" });
  }
}
