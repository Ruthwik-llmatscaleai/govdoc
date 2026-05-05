import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { CmgcEvaluation } from "../types";
import { buildSystemPrompt, buildUserMessage } from "../prompt/system-prompt";
import { DELIVERY_METHOD_KB_TEXT } from "../delivery-method-kb";

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-6",
  groq: "llama-3.3-70b-versatile",
};

export const evaluateStep: PipelineStep<FormData> = {
  id: "evaluate",
  label: "Evaluate against rubric",
  async *run(formData, ctx) {
    const prior = (ctx.prior.extract ?? {}) as { narrative?: string };
    const narrative = prior.narrative ?? "";
    if (!narrative) {
      yield { type: "error", stage: "evaluate", message: "No narrative available from extract step" };
      return;
    }
    const provider = (formData.get("provider") as LlmProvider | null) ?? "openai";
    const model = (formData.get("model") as string | null) ?? DEFAULT_MODELS[provider];
    const districtRaw = formData.get("districtRatings") as string | null;
    let districtRatings: Record<string, "A"|"B"|"C"> | undefined;
    if (districtRaw) {
      try { districtRatings = JSON.parse(districtRaw); } catch { districtRatings = undefined; }
    }

    const systemPrompt = buildSystemPrompt(DELIVERY_METHOD_KB_TEXT, districtRatings);
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
      yield { type: "error", stage: "evaluate", message: `AI evaluation failed: invalid JSON (${lastError ?? "unknown"})` };
      return;
    }
    yield { type: "stage-done", stage: "evaluate", data: parsed };
  },
};
