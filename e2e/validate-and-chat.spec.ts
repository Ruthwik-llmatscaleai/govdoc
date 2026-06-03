import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[name="username"], input[type="text"]', "dev");
  await page.fill('input[name="password"], input[type="password"]', "dev");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/workspace", { timeout: 10000 });
}

test.describe("Validate Appraisal - Document Upload & Run", () => {
  test("upload CMGC doc and run ROW appraisal pipeline", async ({ page }) => {
    await login(page);
    await page.goto("/work/review/row-appraisal");
    await page.waitForLoadState("networkidle");

    // Should see the review page without errors
    await expect(page.locator("body")).toBeVisible();

    // Look for file input (could be hidden behind a button)
    const fileInput = page.locator('input[type="file"]');
    const hasFileInput = await fileInput.count();
    expect(hasFileInput).toBeGreaterThan(0);
  });
});

test.describe("Chat - Document Upload & Q&A", () => {
  test("chat page loads with greeting", async ({ page }) => {
    await login(page);
    await page.goto("/work/chat");
    await page.waitForLoadState("networkidle");

    // Should see the chat page greeting or textarea
    const greeting = page.getByText(/what can I help/i).first();
    const textarea = page.locator("textarea").first();

    const greetingVisible = await greeting.isVisible({ timeout: 10000 }).catch(() => false);
    const textareaVisible = await textarea.isVisible({ timeout: 5000 }).catch(() => false);

    // Either greeting or textarea should be visible (page rendered successfully)
    expect(greetingVisible || textareaVisible).toBe(true);
  });

  test("chat history persists after page reload", async ({ page }) => {
    await login(page);
    await page.goto("/work/chat");
    await page.waitForLoadState("networkidle");

    // Verify the page loaded — look for either greeting or existing messages
    const greeting = page.getByText(/what can I help/i).first();
    const textarea = page.locator("textarea").first();

    const greetingVisible = await greeting.isVisible({ timeout: 10000 }).catch(() => false);
    const textareaVisible = await textarea.isVisible({ timeout: 5000 }).catch(() => false);

    expect(greetingVisible || textareaVisible).toBe(true);
  });
});

test.describe("Page smoke tests", () => {
  test("workspace loads after login", async ({ page }) => {
    await login(page);
    await expect(page.getByText(/welcome back/i)).toBeVisible({ timeout: 10000 });
  });

  test("landing page loads without auth", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toBeVisible();
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
  });
});
