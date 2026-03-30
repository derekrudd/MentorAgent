import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("displays 2 mentor cards", async ({ page }) => {
    await expect(page.getByText("Your AI Mentors")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Kathia" })).toBeVisible();
  });

  test("mentor cards show role and personality", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Business Advisor")).toBeVisible();
    await expect(page.getByText("Marketing Advisor")).toBeVisible();
  });

  test("Chat button navigates to mentor chat", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible({ timeout: 10_000 });
    const chatButtons = page.getByRole("link", { name: /chat/i });
    await chatButtons.first().click();
    await expect(page).toHaveURL(/\/mentor\/.*\/chat/);
  });

  test("MentorThreads CTA links to threads page", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible({ timeout: 10_000 });
    const threadsCta = page.getByRole("link", { name: /start a thread/i });
    await threadsCta.click();
    await expect(page).toHaveURL(/\/threads/);
  });

  test("header shows navigation links", async ({ page }) => {
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /threads/i })).toBeVisible();
  });
});
