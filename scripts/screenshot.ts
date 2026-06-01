#!/usr/bin/env npx tsx
/**
 * Take a full-page screenshot of any URL for pixel-diff comparison.
 *
 * Usage:
 *   npx tsx scripts/screenshot.ts <url> [output-path]
 *
 * Example:
 *   npx tsx scripts/screenshot.ts http://localhost:3000/login login-screenshot.png
 *   npx tsx scripts/screenshot.ts https://d2lhoz37jxbg1w.cloudfront.net/workspace workspace.png
 */

import { chromium } from "playwright";

const [url, outputPath = "screenshot.png"] = process.argv.slice(2);

if (!url) {
  console.error("Usage: npx tsx scripts/screenshot.ts <url> [output]");
  process.exit(1);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.screenshot({ path: outputPath, fullPage: true });
  await browser.close();
  console.log(`Screenshot saved to: ${outputPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
