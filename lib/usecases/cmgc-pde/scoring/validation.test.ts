import { describe, it, expect } from "vitest";
import { runValidationAnalysis } from "./validation";
import { mockRatings } from "./fixtures";

describe("runValidationAnalysis", () => {
  it("all matches → agreement_rate 100, no mismatches, recommendation unchanged", () => {
    const ai = mockRatings();
    const user = Object.fromEntries(ai.map((r) => [r.question_id, r.selected_rating]));
    const result = runValidationAnalysis(ai, user);
    expect(result.summary.total_compared).toBe(25);
    expect(result.summary.matches).toBe(25);
    expect(result.summary.agreement_rate).toBe(100);
    expect(result.mismatches).toHaveLength(0);
    expect(result.deviation_impact.recommendation_changed).toBe(false);
  });

  it("treats missing user rating as a match (defaults to AI rating)", () => {
    const ai = mockRatings();
    const result = runValidationAnalysis(ai, {});
    expect(result.summary.matches).toBe(25);
    expect(result.summary.agreement_rate).toBe(100);
  });

  it("diff=1 with high AI confidence (≥0.75) is major_mismatch", () => {
    const ai = mockRatings();  // all default confidence 0.85, all selected_rating "B"
    const user: Record<string, "A"|"B"|"C"> = { A1: "A" };  // diff=1, conf=0.85 → major
    const result = runValidationAnalysis(ai, user);
    const m = result.comparisons.find((c) => c.question_id === "A1")!;
    expect(m.severity).toBe("major_mismatch");
    expect(result.summary.major_mismatches).toBeGreaterThanOrEqual(1);
  });

  it("diff=1 with low AI confidence (<0.75) is minor_mismatch", () => {
    const ai = mockRatings();
    // mock returns 0.85 confidence by default; mutate one entry
    const lowConfRating = ai.find((r) => r.question_id === "A1")!;
    lowConfRating.confidence = 0.6;
    const user: Record<string, "A"|"B"|"C"> = { A1: "A" };
    const result = runValidationAnalysis(ai, user);
    const m = result.comparisons.find((c) => c.question_id === "A1")!;
    expect(m.severity).toBe("minor_mismatch");
    expect(result.summary.minor_mismatches).toBeGreaterThanOrEqual(1);
  });

  it("diff≥2 is always major_mismatch regardless of confidence", () => {
    const ai = mockRatings();
    const lowConfRating = ai.find((r) => r.question_id === "A1")!;
    lowConfRating.confidence = 0.3;  // low
    const user: Record<string, "A"|"B"|"C"> = { A1: "C" };  // diff=|2-3|=1... wait, B=2, C=3, diff=1
    // Need diff=2: AI=A(1), user=C(3) OR AI=C(3), user=A(1)
    const ai2 = mockRatings({ A2: "A" });  // AI rates A2 as A (raw 1), confidence default 0.85
    ai2.find((r) => r.question_id === "A2")!.confidence = 0.3;  // make it low
    const user2: Record<string, "A"|"B"|"C"> = { A2: "C" };  // diff=2, conf low
    const result = runValidationAnalysis(ai2, user2);
    const m = result.comparisons.find((c) => c.question_id === "A2")!;
    expect(m.severity).toBe("major_mismatch");
  });

  it("ai_evidence falls back to fixed string when source_reasoning empty", () => {
    const ai = mockRatings();
    ai.find((r) => r.question_id === "A1")!.source_reasoning = "";
    const result = runValidationAnalysis(ai, {});
    const a1 = result.comparisons.find((c) => c.question_id === "A1")!;
    expect(a1.ai_evidence).toBe("No reasoning available");
  });

  it("has_evidence is true when ai_confidence >= 0.4", () => {
    const ai = mockRatings();
    ai.find((r) => r.question_id === "A1")!.confidence = 0.4;
    ai.find((r) => r.question_id === "A2")!.confidence = 0.39;
    const result = runValidationAnalysis(ai, {});
    expect(result.comparisons.find((c) => c.question_id === "A1")!.has_evidence).toBe(true);
    expect(result.comparisons.find((c) => c.question_id === "A2")!.has_evidence).toBe(false);
  });

  it("user-overrides flipping recommendation → recommendation_changed true", () => {
    // AI: all B (composite 2.0 → CM/GC mid-range fall-through)
    // User: all C (composite 3.0 → PDB/CM/GC)
    const ai = mockRatings();
    const user: Record<string, "A"|"B"|"C"> = Object.fromEntries(
      ai.map((r) => [r.question_id, "C"]),
    );
    const result = runValidationAnalysis(ai, user);
    expect(result.deviation_impact.recommendation_changed).toBe(true);
    expect(result.deviation_impact.user_method).not.toBe(result.deviation_impact.ai_method);
  });

  it("mismatches array contains all non-match entries", () => {
    const ai = mockRatings();
    const user: Record<string, "A"|"B"|"C"> = { A1: "A", A2: "C" };
    const result = runValidationAnalysis(ai, user);
    expect(result.mismatches.length).toBeGreaterThanOrEqual(2);
    expect(result.mismatches.every((m) => m.severity !== "match")).toBe(true);
  });

  it("ai_confidence rounded to 2 decimals", () => {
    const ai = mockRatings();
    ai.find((r) => r.question_id === "A1")!.confidence = 0.857142;
    const result = runValidationAnalysis(ai, {});
    expect(result.comparisons.find((c) => c.question_id === "A1")!.ai_confidence).toBe(0.86);
  });

  it("agreement_rate is rounded to 1 decimal", () => {
    const ai = mockRatings();
    const user: Record<string, "A"|"B"|"C"> = { A1: "A", A2: "C", A3: "A" };  // 3 mismatches out of 25
    const result = runValidationAnalysis(ai, user);
    // 22/25 = 88.0
    expect(result.summary.agreement_rate).toBeCloseTo(88.0, 1);
  });
});
