// @e2e — requires real OpenAI API key + running dev server
// Run manually: npx playwright test tests/e2e/row.spec.ts
//
// playwright.config.ts sets testDir="./tests/smoke" so this file is NOT
// picked up by the default run. It is gated to manual execution only — it
// calls the real OpenAI API and exercises the 5-chunk evaluation pipeline.
import { test, expect } from "@playwright/test";

test.describe("ROW Appraisal happy path", () => {
  test("upload → 5-chunk evaluate → table visible @e2e", async ({ page }) => {
    test.skip(!process.env.OPENAI_API_KEY, "OPENAI_API_KEY not set — skipping real-LLM e2e");
    test.skip(!process.env.GOVDOC_DEV_USER || !process.env.GOVDOC_DEV_PASS, "GOVDOC_DEV_USER/PASS not set");
    test.skip(!process.env.ROW_E2E_PDF, "Set ROW_E2E_PDF to a real appraisal PDF path");

    await page.goto("/login");
    await page.fill('input[name="username"]', process.env.GOVDOC_DEV_USER!);
    await page.fill('input[name="password"]', process.env.GOVDOC_DEV_PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/landing$/);
    await page.click("text=Review Documents");
    await page.click("text=ROW Appraisal");
    await page.setInputFiles('input[name="pdf"]', process.env.ROW_E2E_PDF!);
    await page.selectOption('select[name="model"]', "openai");
    await page.click('button:has-text("Run evaluation")');

    await expect(page.getByRole("table")).toBeVisible({ timeout: 210_000 });
    await expect(page.getByText("Title Page")).toBeVisible();
    await expect(page.getByRole("button", { name: /download.*excel/i })).toBeVisible();
  });
});
