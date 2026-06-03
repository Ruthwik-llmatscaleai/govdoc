import type { PipelineStep } from "@/features/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { CmgcEvaluation } from "../types";
import { buildSystemPrompt, buildUserMessage } from "../prompt/system-prompt";
import { RUBRIC_QUESTIONS, type RubricQuestion } from "../rubric";
import { DELIVERY_METHOD_KB_TEXT } from "../delivery-method-kb";

export const evaluateStep: PipelineStep<FormData> = {
  id: "evaluate",
  label: "Evaluate against rubric",
  async *run(_formData, ctx) {
    const prior = (ctx.prior.extract ?? {}) as { narrative?: string };
    const narrative = prior.narrative ?? "";
    if (!narrative) {
      yield { type: "error", stage: "evaluate", message: "No narrative available from extract step" };
      return;
    }
    const provider: LlmProvider = "openai";
    const model = "gpt-4o";

    const cmgcRubric = ctx.rubric as { questions?: unknown } | undefined;
    const questions = Array.isArray(cmgcRubric?.questions)
      ? (cmgcRubric!.questions as RubricQuestion[])
      : RUBRIC_QUESTIONS;
    const systemPrompt = buildSystemPrompt(DELIVERY_METHOD_KB_TEXT, questions);
    const userMessage = buildUserMessage(narrative);
    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userMessage },
    ];

    yield { type: "progress", stage: "evaluate", pct: 0, message: "Calling AI provider" };

    let parsed: CmgcEvaluation | null = null;
    let lastError: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const r = await ctx.llm.call({
          provider, model, messages, temperature: 0,
          responseFormat: "json_object",
        });
        try {
          parsed = JSON.parse(r.text) as CmgcEvaluation;
          break;
        } catch (e) {
          lastError = e instanceof Error ? e.message : String(e);
          if (attempt === 0) {
            yield { type: "progress", stage: "evaluate", pct: 50, message: "Retrying after JSON parse failure" };
          }
        }
      } catch (e) {
        ctx.log("evaluate provider error", { error: e instanceof Error ? e.message : String(e) });
        yield { type: "error", stage: "evaluate", message: "AI evaluation failed" };
        return;
      }
    }
    if (!parsed) {
      ctx.log("evaluate JSON parse failure", { error: lastError });
      yield { type: "error", stage: "evaluate", message: "AI evaluation failed" };
      return;
    }

    // Enforce: missing_info=true must default to C (lowest rating)
    if (parsed.ratings && Array.isArray(parsed.ratings)) {
      for (const rating of parsed.ratings) {
        if (rating.missing_info && rating.selected_rating !== "C") {
          ctx.log("enforce missing-info default", {
            question: rating.question_id,
            was: rating.selected_rating,
            forced: "C",
          });
          rating.selected_rating = "C";
          rating.confidence = Math.min(rating.confidence ?? 0.2, 0.25);
        }
      }
    }

    yield { type: "stage-done", stage: "evaluate", data: parsed };
  },
};
