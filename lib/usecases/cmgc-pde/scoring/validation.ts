import { RATING_VALUES, type Rating } from "../rubric";
import type { CmgcRating, ValidationComparison, ValidationResult } from "../types";
import { computeDeliveryRecommendation } from "./compute-recommendation";

function round(n: number, digits: number): number {
  const factor = Math.pow(10, digits);
  return Math.round(n * factor) / factor;
}

export function runValidationAnalysis(
  aiRatings: CmgcRating[],
  userRatings: Record<string, Rating>,
): ValidationResult {
  const comparisons: ValidationComparison[] = [];
  const mismatches: ValidationComparison[] = [];

  for (const r of aiRatings) {
    const qid = r.question_id;
    // `||` not `??`: empty-string ratings (legitimate when the narrative lacks
    // evidence) should fall through to the "B" default along with null/undefined.
    const aiRating = (r.selected_rating || "B").toUpperCase() as Rating;
    let userRating = (userRatings[qid] ?? "").toString().toUpperCase() as Rating | "";
    if (!userRating) userRating = aiRating;

    const aiVal = RATING_VALUES[aiRating] ?? 2;
    const userVal = RATING_VALUES[userRating as Rating] ?? 2;
    const diff = Math.abs(aiVal - userVal);

    let severity: ValidationComparison["severity"];
    if (diff === 0) {
      severity = "match";
    } else if (diff === 1) {
      severity = (r.confidence ?? 0) >= 0.75 ? "major_mismatch" : "minor_mismatch";
    } else {
      severity = "major_mismatch";
    }

    const evidence = r.source_reasoning && r.source_reasoning.trim()
      ? r.source_reasoning
      : ((r as unknown as { extracted_evidence?: string }).extracted_evidence ?? "No reasoning available");

    const entry: ValidationComparison = {
      question_id: qid,
      question_text: r.question_text,
      ai_rating: aiRating,
      user_rating: userRating as Rating,
      severity,
      ai_evidence: evidence,
      ai_confidence: round(r.confidence ?? 0, 2),
      has_evidence: (r.confidence ?? 0) >= 0.4,
    };
    comparisons.push(entry);
    if (severity !== "match") mismatches.push(entry);
  }

  const total = comparisons.length;
  const matches = comparisons.filter((c) => c.severity === "match").length;
  const minor = comparisons.filter((c) => c.severity === "minor_mismatch").length;
  const major = comparisons.filter((c) => c.severity === "major_mismatch").length;

  // Deviation impact
  const aiRec = computeDeliveryRecommendation(aiRatings);
  const userModifiedRatings = aiRatings.map((r) => {
    const u = userRatings[r.question_id];
    if (u) return { ...r, selected_rating: u };
    return r;
  });
  const userRec = computeDeliveryRecommendation(userModifiedRatings);

  return {
    comparisons,
    mismatches,
    summary: {
      total_compared: total,
      matches,
      minor_mismatches: minor,
      major_mismatches: major,
      agreement_rate: round((matches / Math.max(total, 1)) * 100, 1),
    },
    deviation_impact: {
      ai_method: aiRec.recommended_method,
      user_method: userRec.recommended_method,
      recommendation_changed: aiRec.recommended_method !== userRec.recommended_method,
      ai_score: aiRec.composite_score,
      user_score: userRec.composite_score,
    },
  };
}
