import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { CmgcRating, ValidationResult } from "../types";
import { runValidationAnalysis } from "../scoring/validation";

export const validateStep: PipelineStep<FormData> = {
  id: "validate",
  label: "Compare against district ratings",
  async *run(formData, ctx) {
    const districtRaw = formData.get("districtRatings") as string | null;
    if (!districtRaw || !districtRaw.trim()) {
      yield { type: "stage-done", stage: "validate", data: null };
      return;
    }
    let districtRatings: Record<string, "A"|"B"|"C">;
    try {
      districtRatings = JSON.parse(districtRaw);
    } catch {
      yield { type: "error", stage: "validate", message: "District ratings JSON is invalid" };
      return;
    }
    const prior = (ctx.prior.evaluate ?? {}) as { ratings?: CmgcRating[] };
    const ratings = prior.ratings;
    if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
      yield { type: "error", stage: "validate", message: "No AI ratings available for validation" };
      return;
    }
    const result: ValidationResult = runValidationAnalysis(ratings, districtRatings);
    yield { type: "stage-done", stage: "validate", data: result };
  },
};
