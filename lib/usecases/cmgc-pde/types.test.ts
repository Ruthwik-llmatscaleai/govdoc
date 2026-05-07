import { describe, it, expectTypeOf } from "vitest";
import type {
  CmgcRating,
  RecommendationResult,
  MethodScore,
  MultiMethodResult,
  ValidationResult,
  CmgcRunResult,
} from "./types";

describe("CMGC types", () => {
  it("CmgcRunResult has all expected top-level keys", () => {
    expectTypeOf<CmgcRunResult>().toHaveProperty("evaluation");
    expectTypeOf<CmgcRunResult>().toHaveProperty("recommendation");
    expectTypeOf<CmgcRunResult>().toHaveProperty("multi_method");
    expectTypeOf<CmgcRunResult>().toHaveProperty("validation");
  });

  it("CmgcRating has the legacy 7 fields", () => {
    expectTypeOf<CmgcRating>().toHaveProperty("question_id");
    expectTypeOf<CmgcRating>().toHaveProperty("question_text");
    expectTypeOf<CmgcRating>().toHaveProperty("source_reasoning");
    expectTypeOf<CmgcRating>().toHaveProperty("missing_info_reasoning");
    expectTypeOf<CmgcRating>().toHaveProperty("selected_rating");
    expectTypeOf<CmgcRating>().toHaveProperty("confidence");
    expectTypeOf<CmgcRating>().toHaveProperty("missing_info");
  });

  it("RecommendationResult composite_score is number", () => {
    expectTypeOf<RecommendationResult["composite_score"]>().toBeNumber();
  });

  it("MultiMethodResult.method_scores is an array", () => {
    expectTypeOf<MultiMethodResult["method_scores"]>().toEqualTypeOf<MethodScore[]>();
  });

  it("ValidationResult or null is allowed in CmgcRunResult", () => {
    expectTypeOf<CmgcRunResult["validation"]>().toEqualTypeOf<ValidationResult | null>();
  });
});
