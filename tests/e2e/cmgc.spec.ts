// @e2e — requires real OpenAI API key + running dev server
// Run manually: npx playwright test tests/e2e/cmgc.spec.ts
//
// NOTE: playwright.config.ts sets testDir="./tests/smoke", so this file is NOT
// picked up by the default "npx playwright test" run. It is intentionally gated
// to manual execution only — it calls the real OpenAI API and can take ~2 minutes.
import { test, expect } from "@playwright/test";

test.describe("CMGC happy path", () => {
  test("upload → evaluate → score → exporters visible @e2e", async ({ page }) => {
    test.skip(!process.env.OPENAI_API_KEY, "OPENAI_API_KEY not set — skipping real-LLM e2e");
    test.skip(!process.env.GOVDOC_DEV_USER || !process.env.GOVDOC_DEV_PASS, "GOVDOC_DEV_USER/PASS not set");

    await page.goto("/login");
    await page.fill('input[name="username"]', process.env.GOVDOC_DEV_USER!);
    await page.fill('input[name="password"]', process.env.GOVDOC_DEV_PASS!);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/landing$/);
    await page.click("text=Review Documents");
    await page.click("text=CMGC");
    await page.setInputFiles('input[name="factSheet"]', "tests/fixtures/cmgc/synthetic-narrative.docx");
    await page.selectOption('select[name="provider"]', "openai");
    await page.click('button:has-text("Run evaluation")');

    // Wait for the recommendation card to appear
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible({ timeout: 120_000 });
    await expect(page.getByText(/Composite \d\.\d{3} \/ 3\.000/)).toBeVisible();
    // Exporter buttons
    await expect(page.getByRole("button", { name: /Download Excel/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Download DOCX/i })).toBeVisible();
  });
});
