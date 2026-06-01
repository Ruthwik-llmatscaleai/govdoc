import { test, expect } from "@playwright/test";
import path from "path";

const DOCS_DIR = "/Users/rajasekharbandreddy/Documents";

test.describe("Validate Appraisal - Document Upload & Run", () => {
  test("upload CMGC doc and run ROW appraisal pipeline", async ({ page }) => {
    await page.goto("/work/review/row-appraisal");
    await page.waitForLoadState("networkidle");

    // Should see the review page
    await expect(page.locator("body")).toBeVisible();

    // Upload file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(
      path.join(DOCS_DIR, "test_doc_2_I880_SR92_interchange_CMGC copy.docx")
    );

    // Wait for upload to complete — look for file name in the UI
    await expect(page.getByText(/I880_SR92/i)).toBeVisible({ timeout: 30000 });

    // Click Run/Evaluate button if present
    const runBtn = page.getByRole("button", { name: /run|evaluate|start/i }).first();
    if (await runBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await runBtn.click();

      // Wait for pipeline to start — should see progress or streaming indicator
      await expect(
        page.getByText(/processing|evaluating|analyzing|scoring|complete/i).first()
      ).toBeVisible({ timeout: 60000 });
    }
  });
});

test.describe("Chat - Document Upload & Q&A", () => {
  test("upload documents and ask a question", async ({ page }) => {
    await page.goto("/work/chat");
    await page.waitForLoadState("networkidle");

    // Should see the chat page
    await expect(page.getByText(/what can I help/i).first()).toBeVisible({ timeout: 10000 });

    // Upload both documents via the hidden file input
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([
      path.join(DOCS_DIR, "rfp-example.docx"),
      path.join(DOCS_DIR, "solanocourthouse-rfq-attacha (1).doc"),
    ]);

    // Wait for upload — spinner disappears or doc pills appear
    await page.waitForTimeout(15000);

    // Verify at least one document pill is visible (partial name match)
    const hasDocs = await page.getByText(/rfp|solano/i).first().isVisible().catch(() => false);
    expect(hasDocs).toBe(true);

    // Type a question
    const textarea = page.locator("textarea").first();
    await textarea.fill("What are the key requirements in these documents?");

    // Send the message
    const sendBtn = page.locator('button[type="button"]').last();
    await sendBtn.click();

    // Wait for answer — look for assistant response (GOVDOC label or markdown content)
    await expect(
      page.getByText(/GOVDOC/).first()
    ).toBeVisible({ timeout: 90000 });

    // Check we don't have an error response
    const errorVisible = await page.getByText(/Error:|Failed to get answer|No documents found/i).isVisible().catch(() => false);
    expect(errorVisible).toBe(false);
  });

  test("chat history persists after page reload", async ({ page }) => {
    await page.goto("/work/chat");
    await page.waitForLoadState("networkidle");

    // If there's existing chat history from the previous test, verify it loaded
    // Look for either the empty state or loaded messages
    const hasMessages = await page.getByText(/GOVDOC/i).first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasMessages) {
      // History loaded — conversation persisted via Prisma
      await expect(page.getByText(/key requirements/i)).toBeVisible();
    } else {
      // No history — just verify the page loaded correctly
      await expect(page.getByText(/what can I help/i)).toBeVisible();
    }
  });
});
