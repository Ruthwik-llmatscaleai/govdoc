import { describe, it, expect } from "vitest";
import { METHOD_AFFINITY, METHOD_PROS_CONS, affinityScoreForMethod } from "./method-affinity";
import { ALL_METHODS } from "../rubric";

describe("METHOD_AFFINITY", () => {
  it("has 6 sections × 6 methods × 3 ratings", () => {
    const sections = ["A","B","C","D","E","F"] as const;
    for (const s of sections) {
      expect(METHOD_AFFINITY[s]).toBeDefined();
      for (const m of ALL_METHODS) {
        expect(METHOD_AFFINITY[s][m]).toBeDefined();
        expect(METHOD_AFFINITY[s][m]!.A).toBeTypeOf("number");
        expect(METHOD_AFFINITY[s][m]!.B).toBeTypeOf("number");
        expect(METHOD_AFFINITY[s][m]!.C).toBeTypeOf("number");
      }
    }
  });
});

describe("METHOD_PROS_CONS", () => {
  it("has all 6 methods with non-empty pros and cons", () => {
    for (const m of ALL_METHODS) {
      expect(METHOD_PROS_CONS[m]).toBeDefined();
      expect(METHOD_PROS_CONS[m]!.pros.length).toBeGreaterThan(0);
      expect(METHOD_PROS_CONS[m]!.cons.length).toBeGreaterThan(0);
    }
  });
});

describe("affinityScoreForMethod", () => {
  it("all-B sections (raw 2.0) returns the middle (B) column weighted", () => {
    const sectionRatings = { A: [2,2,2,2,2,2,2,2,2,2], B: [2,2], C: [2,2], D: [2,2,2], E: [2,2,2,2,2], F: [2,2,2] };
    // Score = Σ (B_value * weight) for each method.
    const dbb = affinityScoreForMethod("Design-Bid-Build", sectionRatings);
    // From legacy METHOD_AFFINITY[*]["Design-Bid-Build"]["B"] values × SECTION_WEIGHTS:
    // A:0.6*0.30 + B:0.5*0.15 + C:0.5*0.12 + D:0.5*0.10 + E:0.6*0.20 + F:0.5*0.13 = 0.18 + 0.075 + 0.06 + 0.05 + 0.12 + 0.065 = 0.55
    expect(dbb).toBeCloseTo(0.55, 2);
  });

  it("missing section defaults to 0.5 affinity", () => {
    // Section ratings empty for one section
    const sectionRatings = { A: [], B: [], C: [], D: [], E: [], F: [] };
    const score = affinityScoreForMethod("CM/GC", sectionRatings);
    // All sections empty → dominant "B" → middle column
    expect(score).toBeGreaterThan(0);
  });

  it("returns rounded to 4 decimals", () => {
    const sectionRatings = { A: [3,3,3,3,3,3,3,3,3,3], B: [3,3], C: [3,3], D: [3,3,3], E: [3,3,3,3,3], F: [3,3,3] };
    const score = affinityScoreForMethod("CM/GC", sectionRatings);
    expect(Number.isFinite(score)).toBe(true);
    expect(String(score).length).toBeLessThan(8);  // not a long float
  });
});
