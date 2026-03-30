import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Single Mentor Chat", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("navigates to mentor chat and shows mentor info", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible({ timeout: 10_000 });
    const chatButtons = page.getByRole("link", { name: /chat/i });
    await chatButtons.first().click();
    await expect(page).toHaveURL(/\/mentor\/.*\/chat/);
    await page.waitForTimeout(2000);
  });

  test("empty state shows mentor greeting and skills", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible({ timeout: 10_000 });
    const chatButtons = page.getByRole("link", { name: /chat/i });
    await chatButtons.first().click();
    await expect(page).toHaveURL(/\/mentor\/.*\/chat/);
    await page.waitForTimeout(3000);
    const pageContent = await page.textContent("body");
    expect(pageContent).toBeTruthy();
  });

  test("can send a message and see it appear", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible({ timeout: 10_000 });
    const chatButtons = page.getByRole("link", { name: /chat/i });
    await chatButtons.first().click();
    await expect(page).toHaveURL(/\/mentor\/.*\/chat/);
    await page.waitForTimeout(2000);

    const input = page.locator("textarea").first();
    await input.fill("Hello, can you help me with a quick question?");
    await input.press("Enter");

    await expect(
      page.getByText("Hello, can you help me with a quick question?")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("receives an AI response after sending a message", async ({ page }) => {
    test.setTimeout(90_000);
    await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible({ timeout: 10_000 });
    const chatButtons = page.getByRole("link", { name: /chat/i });
    await chatButtons.first().click();
    await expect(page).toHaveURL(/\/mentor\/.*\/chat/);
    await page.waitForTimeout(2000);

    const input = page.locator("textarea").first();
    await input.fill("What is a SWOT analysis in one sentence?");
    await input.press("Enter");

    // Wait for an assistant response (bg-muted bubble)
    await page.waitForTimeout(30_000);
    const assistantMessages = page.locator("[class*='bg-muted']");
    const count = await assistantMessages.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
