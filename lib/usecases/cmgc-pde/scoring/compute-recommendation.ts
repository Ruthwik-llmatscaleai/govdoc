import { RATING_VALUES, SECTION_WEIGHTS, type Rating } from "../rubric";
import type { CmgcRating, KeyDriver, RecommendationResult } from "../types";

export type RatingsBreakdown = {
  section_scores: Record<string, number>;   // averages per section
  raw_scores: Record<string, number>;        // per-question raw 1-3
  weighted_scores: Record<string, number>;   // per-section weighted contribution
  key_drivers: KeyDriver[];                  // top 5 by weighted_contribution desc
  rating_lookup: Record<string, Rating>;     // qid → Rating
  composite: number;                         // weighted sum, rounded to 3 decimals
};

const SECTION_KEYS = ["A", "B", "C", "D", "E", "F"] as const;

export function computeRatingsBreakdown(ratings: CmgcRating[]): RatingsBreakdown {
  const sectionRatings: Record<string, number[]> = { A: [], B: [], C: [], D: [], E: [], F: [] };
  const ratingLookup: Record<string, Rating> = {};

  for (const r of ratings) {
    const qid = r.question_id;
    const rating = (r.selected_rating ?? "B").toUpperCase() as Rating;
    if (qid && qid[0] && qid[0] in sectionRatings) {
      sectionRatings[qid[0]]!.push(RATING_VALUES[rating] ?? 2);
      ratingLookup[qid] = rating;
    }
  }

  const sectionScoresUnrounded: Record<string, number> = {};
  for (const [sec, vals] of Object.entries(sectionRatings)) {
    sectionScoresUnrounded[sec] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 2.0;
  }

  const compositeUnrounded = SECTION_KEYS.reduce(
    (sum, s) => sum + sectionScoresUnrounded[s]! * SECTION_WEIGHTS[s],
    0,
  );

  const rawScores: Record<string, number> = {};
  for (const [qid, rating] of Object.entries(ratingLookup)) {
    rawScores[qid] = RATING_VALUES[rating] ?? 2;
  }

  const weightedScores: Record<string, number> = {};
  for (const s of SECTION_KEYS) {
    weightedScores[s] = round4(sectionScoresUnrounded[s]! * SECTION_WEIGHTS[s]);
  }

  const driverEntries: KeyDriver[] = [];
  for (const [qid, raw] of Object.entries(rawScores)) {
    const sec = qid[0]!;
    const secCount = sectionRatings[sec]?.length ?? 1;
    const perQ = (SECTION_WEIGHTS[sec as "A" | "B" | "C" | "D" | "E" | "F"] ?? 0) / Math.max(secCount, 1);
    driverEntries.push({
      question_id: qid,
      raw_score: raw,
      rating: ratingLookup[qid]!,
      section: sec,
      weighted_contribution: round4(raw * perQ),
    });
  }
  driverEntries.sort((a, b) => b.weighted_contribution - a.weighted_contribution);

  const sectionScores: Record<string, number> = {};
  for (const s of SECTION_KEYS) sectionScores[s] = round3(sectionScoresUnrounded[s]!);

  return {
    section_scores: sectionScores,
    raw_scores: rawScores,
    weighted_scores: weightedScores,
    key_drivers: driverEntries.slice(0, 5),
    rating_lookup: ratingLookup,
    composite: round3(compositeUnrounded),
  };
}

export function computeDeliveryRecommendation(ratings: CmgcRating[]): RecommendationResult {
  const breakdown = computeRatingsBreakdown(ratings);
  return {
    composite_score: breakdown.composite,
    section_scores: breakdown.section_scores,
    raw_scores: breakdown.raw_scores,
    weighted_scores: breakdown.weighted_scores,
    key_drivers: breakdown.key_drivers,
    // Placeholders — filled by M5 (overrides) and M6 (affinity scoring)
    override_status: [],
    recommended_method: "",
    recommended_score: 0,
    runner_up_method: null,
    runner_up_score: null,
    is_borderline: false,
    comparison_text: "",
    override_reasons: [],
  };
}

function round3(n: number): number { return Math.round(n * 1000) / 1000; }
function round4(n: number): number { return Math.round(n * 10000) / 10000; }
