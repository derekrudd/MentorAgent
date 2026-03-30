import { type Page, expect } from "@playwright/test";

export const TEST_USER = {
  email: "test@mentoragent.com",
  password: "TestMentor123!",
  fullName: "Test Student",
};

/**
 * Log in via the UI and wait for redirect to dashboard.
 */
export async function login(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.locator("#email").fill(TEST_USER.email);
  await page.locator("#password").fill(TEST_USER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);
}
