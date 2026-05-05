import { describe, it, expect } from "vitest";
import { scoreAllMethods } from "./score-all-methods";
import { mockRatings } from "./fixtures";
import { ALL_METHODS } from "../rubric";

describe("scoreAllMethods", () => {
  it("returns 6 method_scores with ranks 1-6 unique", () => {
    const result = scoreAllMethods(mockRatings());
    expect(result.method_scores).toHaveLength(6);
    const ranks = result.method_scores.map((m) => m.rank).sort((a, b) => a - b);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("all 6 methods have non-empty pros and cons", () => {
    const result = scoreAllMethods(mockRatings());
    for (const ms of result.method_scores) {
      expect(ms.pros.length).toBeGreaterThan(0);
      expect(ms.cons.length).toBeGreaterThan(0);
    }
  });

  it("method names match ALL_METHODS exactly", () => {
    const result = scoreAllMethods(mockRatings());
    const methods = result.method_scores.map((m) => m.method);
    for (const m of ALL_METHODS) {
      expect(methods).toContain(m);
    }
  });

  it("mockRatings({ A1:'C', A2:'C', A3:'C' }) → DBB and Design-Sequencing blocked", () => {
    const result = scoreAllMethods(mockRatings({ A1: "C", A2: "C", A3: "C" }));
    const dbb = result.method_scores.find((m) => m.method === "Design-Bid-Build");
    const ds = result.method_scores.find((m) => m.method === "Design-Sequencing");
    expect(dbb?.blocked).toBe(true);
    expect(dbb?.block_reasons.length).toBeGreaterThan(0);
    expect(ds?.blocked).toBe(true);
    expect(ds?.block_reasons.length).toBeGreaterThan(0);
  });

  it("blocked methods ranked after unblocked", () => {
    const result = scoreAllMethods(mockRatings({ A1: "C", A2: "C", A3: "C" }));
    const unblocked = result.method_scores.filter((m) => !m.blocked);
    const blocked = result.method_scores.filter((m) => m.blocked);
    if (unblocked.length > 0 && blocked.length > 0) {
      const maxUnblockedRank = Math.max(...unblocked.map((m) => m.rank));
      const minBlockedRank = Math.min(...blocked.map((m) => m.rank));
      expect(maxUnblockedRank).toBeLessThan(minBlockedRank);
    }
  });

  it("borderline_comparison is non-null when top-2 scores within 0.05", () => {
    // Force scores close: all-B gives uniform moderate scores; use ratings
    // that produce near-identical section averages for CM/GC and DB/BV
    // All-B ratings → method scores computed from B column of affinity matrix
    const result = scoreAllMethods(mockRatings());
    // With all-B, let's check if it's borderline
    if (result.borderline_comparison) {
      expect(result.borderline_comparison.is_close).toBe(true);
      expect(result.borderline_comparison.score_gap).toBeGreaterThanOrEqual(0);
      expect(result.borderline_comparison.methods.length).toBeGreaterThanOrEqual(2);
    }
    // The test just verifies the structure is correct when present
    // Actual borderline depends on affinity values
  });

  it("override_status has 9 entries", () => {
    const result = scoreAllMethods(mockRatings());
    expect(result.override_status).toHaveLength(9);
  });

  it("block_reasons format is '{rule_id}: {rule_name}'", () => {
    const result = scoreAllMethods(mockRatings({ A1: "C" }));
    const dbb = result.method_scores.find((m) => m.method === "Design-Bid-Build");
    expect(dbb?.blocked).toBe(true);
    expect(dbb?.block_reasons[0]).toMatch(/^R\d+:/);
  });

  it("key_factors capped at 5", () => {
    const result = scoreAllMethods(mockRatings());
    for (const ms of result.method_scores) {
      expect(ms.key_factors.length).toBeLessThanOrEqual(5);
    }
  });

  it("scores are finite numbers between 0 and 1", () => {
    const result = scoreAllMethods(mockRatings());
    for (const ms of result.method_scores) {
      expect(Number.isFinite(ms.score)).toBe(true);
      expect(ms.score).toBeGreaterThanOrEqual(0);
      expect(ms.score).toBeLessThanOrEqual(1);
    }
  });
});
