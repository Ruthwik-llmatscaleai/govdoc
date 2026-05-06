import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { Level1Data, Level2Data } from "@/lib/usecases/cucp-reevals/types";
import { buildLevel2SystemPrompt, buildLevel2UserMessage } from "@/lib/usecases/cucp-reevals/prompts/level-2-classify";

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-6",
  groq: "llama-3.3-70b-versatile",
};

export const level2Step: PipelineStep<FormData> = {
  id: "level2",
  label: "Classify facts (Level 2)",
  async *run(formData, ctx) {
    yield { type: "progress", stage: "level2", pct: 0, message: "Starting Level 2 classification" } satisfies StepEvent;

    const l1 = (ctx.prior.level1 ?? {}) as Level1Data;
    const combinedFinancials = [
      `Cross-reference: ${l1.cross_reference_result ?? "NOT PROVIDED"}`,
      `Narrative PNW: ${l1.narrative_pnw ?? "NOT PROVIDED"}`,
      `Firm: ${l1.firm_name ?? "NOT PROVIDED"}`,
    ].join("\n");

    const provider = ((formData.get("model") as LlmProvider | null) ?? "openai") as LlmProvider;
    const model = DEFAULT_MODELS[provider] ?? DEFAULT_MODELS.openai;

    const messages = [
      { role: "system" as const, content: buildLevel2SystemPrompt() },
      { role: "user" as const, content: buildLevel2UserMessage(l1.extracted_facts ?? [], combinedFinancials) },
    ];

    yield { type: "progress", stage: "level2", pct: 50, message: "Calling AI provider" } satisfies StepEvent;

    let parsed: Level2Data | null = null;
    let lastError: string | undefined;

    for (let attempt = 0; attempt < 2; attempt++) {
      let response: { text: string };
      try {
        response = await ctx.llm.call({ provider, model, messages, temperature: 0, responseFormat: "json_object" });
      } catch (e) {
        ctx.log("level2 provider error", { error: e instanceof Error ? e.message : String(e) });
        yield { type: "error", stage: "level2", message: "AI Level 2 classification failed" } satisfies StepEvent;
        return;
      }
      try {
        parsed = JSON.parse(response.text) as Level2Data;
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        if (attempt === 0) {
          yield { type: "progress", stage: "level2", pct: 50, message: "Retrying after JSON parse failure" } satisfies StepEvent;
        }
      }
    }

    if (!parsed) {
      ctx.log("level2 JSON parse failure", { error: lastError });
      yield { type: "error", stage: "level2", message: "AI Level 2 classification failed" } satisfies StepEvent;
      return;
    }

    yield { type: "stage-done", stage: "level2", data: parsed } satisfies StepEvent;
  },
};
