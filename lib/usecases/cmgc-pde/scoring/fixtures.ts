import { RUBRIC_QUESTIONS, type Rating } from "../rubric";
import type { CmgcRating } from "../types";

/**
 * Build a baseline 25-rating fixture (all "B") with optional per-question overrides.
 * Used across M4-M7 tests.
 */
export function mockRatings(overrides: Partial<Record<string, Rating>> = {}): CmgcRating[] {
  return RUBRIC_QUESTIONS.map((q) => ({
    question_id: q.id,
    question_text: q.question,
    source_reasoning: `Mock evidence for ${q.id}`,
    missing_info_reasoning: "None — all evidence present.",
    selected_rating: (overrides[q.id] ?? "B") as Rating,
    confidence: 0.85,
    missing_info: false,
  }));
}
