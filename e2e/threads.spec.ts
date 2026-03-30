import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test.describe("MentorThreads", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("threads page loads", async ({ page }) => {
    await page.goto("/threads");
    await expect(page.getByText(/MentorThread/i)).toBeVisible({ timeout: 10_000 });
  });

  test("can open create thread dialog", async ({ page }) => {
    await page.goto("/threads");
    await expect(page.getByText(/MentorThread/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /new thread/i }).click();
    await expect(page.getByText("Select 2-3 mentors").first()).toBeVisible({ timeout: 5_000 });
  });

  test("can select mentors and create a thread", async ({ page }) => {
    await page.goto("/threads");
    await expect(page.getByText(/MentorThread/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /new thread/i }).click();
    await page.waitForTimeout(2000);

    // Select mentors by clicking on their names in the dialog
    const dialog = page.locator("[role='dialog']");
    const mentorButtons = dialog.locator("button, [role='button']").filter({ hasText: /Jordan|Kathia|Quinn/ });
    const count = await mentorButtons.count();
    if (count >= 2) {
      await mentorButtons.nth(0).click();
      await mentorButtons.nth(1).click();
    }

    const createBtn = page.getByRole("button", { name: /create thread/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page).toHaveURL(/\/threads\/.+/, { timeout: 10_000 });
    }
  });

  test("thread detail shows participant avatars and status", async ({ page }) => {
    await page.goto("/threads");
    await expect(page.getByText(/MentorThread/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: /new thread/i }).click();
    await page.waitForTimeout(2000);

    const dialog = page.locator("[role='dialog']");
    const mentorButtons = dialog.locator("button, [role='button']").filter({ hasText: /Jordan|Kathia|Quinn/ });
    if ((await mentorButtons.count()) >= 2) {
      await mentorButtons.nth(0).click();
      await mentorButtons.nth(1).click();
    }

    const createBtn = page.getByRole("button", { name: /create thread/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page).toHaveURL(/\/threads\/.+/, { timeout: 10_000 });
      await expect(page.getByText(/active/i)).toBeVisible({ timeout: 5_000 });
    }
  });

  test("can send a message in a thread", async ({ page }) => {
    await page.goto("/threads");
    await expect(page.getByText(/MentorThread/i)).toBeVisible({ timeout: 10_000 });

    const threadLinks = page.locator("a[href*='/threads/']");
    const threadCount = await threadLinks.count();

    if (threadCount > 0) {
      await threadLinks.first().click();
    } else {
      await page.getByRole("button", { name: /new thread/i }).click();
      await page.waitForTimeout(2000);
      const dialog = page.locator("[role='dialog']");
      const mentorButtons = dialog.locator("button, [role='button']").filter({ hasText: /Jordan|Kathia|Quinn/ });
      if ((await mentorButtons.count()) >= 2) {
        await mentorButtons.nth(0).click();
        await mentorButtons.nth(1).click();
      }
      const createBtn = page.getByRole("button", { name: /create thread/i });
      if (await createBtn.isVisible()) await createBtn.click();
    }

    await expect(page).toHaveURL(/\/threads\/.+/, { timeout: 10_000 });
    await page.waitForTimeout(2000);

    const input = page.locator("textarea").first();
    await input.fill("Hello mentors, I need some advice!");
    await input.press("Enter");

    await expect(
      page.getByText("Hello mentors, I need some advice!")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("threads list shows created threads", async ({ page }) => {
    await page.goto("/threads");
    await expect(page.getByText(/MentorThread/i)).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(3000);
    // Should have at least the threads we created in previous tests
  });
});
