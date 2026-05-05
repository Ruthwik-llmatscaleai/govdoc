import { describe, it, expect } from "vitest";
import { buildComparisonText } from "./build-comparison";
import { computeRatingsBreakdown } from "./compute-recommendation";
import { mockRatings } from "./fixtures";

const sampleSectionScores: Record<string, number> = { A: 2.0, B: 2.0, C: 2.0, D: 2.0, E: 2.0, F: 2.0 };

describe("buildComparisonText", () => {
  it("contains composite score line", () => {
    const text = buildComparisonText({
      recommended: "CM/GC",
      runnerUp: "Design-Build/Best-Value",
      composite: 2.0,
      sectionScores: sampleSectionScores,
    });
    expect(text).toContain("Project Composite Score: 2.00 / 3.00");
  });

  it("contains 'between ... and ...' when runnerUp present", () => {
    const text = buildComparisonText({
      recommended: "CM/GC",
      runnerUp: "Design-Build/Best-Value",
      composite: 2.0,
      sectionScores: sampleSectionScores,
    });
    expect(text).toContain("between **CM/GC** and **Design-Build/Best-Value**");
  });

  it("contains Method Suitability section when scores provided", () => {
    const text = buildComparisonText({
      recommended: "CM/GC",
      runnerUp: "Design-Build/Best-Value",
      composite: 2.0,
      sectionScores: sampleSectionScores,
      recommendedScore: 0.62,
      runnerUpScore: 0.58,
    });
    expect(text).toContain("**Method Suitability");
  });

  it("does NOT contain Method Suitability section when no scores provided", () => {
    const text = buildComparisonText({
      recommended: "CM/GC",
      runnerUp: "Design-Build/Best-Value",
      composite: 2.0,
      sectionScores: sampleSectionScores,
    });
    expect(text).not.toContain("Method Suitability");
  });

  it("always contains Section Scores section", () => {
    const text = buildComparisonText({
      recommended: "CM/GC",
      runnerUp: null,
      composite: 1.5,
      sectionScores: sampleSectionScores,
    });
    expect(text).toContain("**Section Scores");
  });

  it("contains all 6 section names", () => {
    const text = buildComparisonText({
      recommended: "CM/GC",
      runnerUp: "Design-Build/Best-Value",
      composite: 2.0,
      sectionScores: sampleSectionScores,
    });
    expect(text).toContain("Project Scope & Characteristics");
    expect(text).toContain("Schedule Issues");
    expect(text).toContain("Opportunity for Innovation");
    expect(text).toContain("Quality Enhancement");
    expect(text).toContain("Cost Issues");
    expect(text).toContain("Staffing Issues");
  });

  it("section scores formatted as X.XX / 3.00 with weight percentage", () => {
    const breakdown = computeRatingsBreakdown(mockRatings());
    const text = buildComparisonText({
      recommended: "CM/GC",
      runnerUp: "Design-Build/Best-Value",
      composite: breakdown.composite,
      sectionScores: breakdown.section_scores,
    });
    // e.g. "2.00 / 3.00 (weight: 30%)"
    expect(text).toMatch(/\d+\.\d{2} \/ 3\.00 \(weight: \d+%\)/);
  });

  it("includes score gap line when both scores provided", () => {
    const text = buildComparisonText({
      recommended: "CM/GC",
      runnerUp: "Design-Build/Best-Value",
      composite: 2.0,
      sectionScores: sampleSectionScores,
      recommendedScore: 0.6200,
      runnerUpScore: 0.5800,
    });
    expect(text).toContain("Score gap:");
  });

  it("works without runnerUp (null)", () => {
    const text = buildComparisonText({
      recommended: "CM/GC",
      runnerUp: null,
      composite: 2.0,
      sectionScores: sampleSectionScores,
    });
    expect(text).toContain("Project Composite Score: 2.00 / 3.00");
    expect(text).toContain("**Section Scores");
  });
});
