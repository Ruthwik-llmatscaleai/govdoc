#!/usr/bin/env npx tsx
/**
 * Pixel-perfect visual diff tool.
 *
 * Usage:
 *   npx tsx scripts/pixel-diff.ts <reference-image> <screenshot> [output-diff]
 *
 * Example:
 *   npx tsx scripts/pixel-diff.ts design.png screenshot.png diff.png
 *
 * Takes a reference design image and a screenshot, outputs a diff image
 * highlighting mismatches in red. Returns exit code 1 if diff > threshold.
 */

import { readFileSync, writeFileSync } from "fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const [refPath, screenshotPath, outputPath = "diff-output.png"] = process.argv.slice(2);

if (!refPath || !screenshotPath) {
  console.error("Usage: npx tsx scripts/pixel-diff.ts <reference> <screenshot> [output]");
  process.exit(1);
}

const ref = PNG.sync.read(readFileSync(refPath));
const screenshot = PNG.sync.read(readFileSync(screenshotPath));

// Resize to match if needed (use smaller dimensions)
const width = Math.min(ref.width, screenshot.width);
const height = Math.min(ref.height, screenshot.height);

const diff = new PNG({ width, height });

const mismatchedPixels = pixelmatch(
  ref.data,
  screenshot.data,
  diff.data,
  width,
  height,
  { threshold: 0.1, alpha: 0.5 }
);

writeFileSync(outputPath, PNG.sync.write(diff));

const totalPixels = width * height;
const diffPercent = ((mismatchedPixels / totalPixels) * 100).toFixed(2);

console.log(`Compared: ${width}x${height}`);
console.log(`Mismatched pixels: ${mismatchedPixels} (${diffPercent}%)`);
console.log(`Diff saved to: ${outputPath}`);

if (parseFloat(diffPercent) > 5) {
  console.log("\n⚠ Diff exceeds 5% threshold — review the output image.");
  process.exit(1);
}
console.log("\n✓ Visual match within threshold.");
