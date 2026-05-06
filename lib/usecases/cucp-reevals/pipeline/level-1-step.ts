import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { Level1Data } from "@/lib/usecases/cucp-reevals/types";
import { buildLevel1SystemPrompt, buildLevel1UserMessage } from "@/lib/usecases/cucp-reevals/prompts/level-1-extract";

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-sonnet-4-6",
  groq: "llama-3.3-70b-versatile",
};

export const level1Step: PipelineStep<FormData> = {
  id: "level1",
  label: "Extract facts (Level 1)",
  async *run(formData, ctx) {
    yield { type: "progress", stage: "level1", pct: 0, message: "Starting Level 1 fact extraction" } satisfies StepEvent;

    const prior = (ctx.prior.extract ?? {}) as { narrativeText?: string; firmRevenues?: Record<string, unknown> };
    const narrativeText = prior.narrativeText ?? "";
    const firmRevenues = prior.firmRevenues ?? {};

    const provider = ((formData.get("model") as LlmProvider | null) ?? "openai") as LlmProvider;
    const model = DEFAULT_MODELS[provider] ?? DEFAULT_MODELS.openai;

    const messages = [
      { role: "system" as const, content: buildLevel1SystemPrompt(firmRevenues as any) },
      { role: "user" as const, content: buildLevel1UserMessage(narrativeText) },
    ];

    yield { type: "progress", stage: "level1", pct: 50, message: "Calling AI provider" } satisfies StepEvent;

    let parsed: Level1Data | null = null;
    let lastError: string | undefined;

    for (let attempt = 0; attempt < 2; attempt++) {
      let response: { text: string };
      try {
        response = await ctx.llm.call({ provider, model, messages, temperature: 0, responseFormat: "json_object" });
      } catch (e) {
        ctx.log("level1 provider error", { error: e instanceof Error ? e.message : String(e) });
        yield { type: "error", stage: "level1", message: "AI Level 1 fact extraction failed" } satisfies StepEvent;
        return;
      }
      try {
        parsed = JSON.parse(response.text) as Level1Data;
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        if (attempt === 0) {
          yield { type: "progress", stage: "level1", pct: 50, message: "Retrying after JSON parse failure" } satisfies StepEvent;
        }
      }
    }

    if (!parsed) {
      ctx.log("level1 JSON parse failure", { error: lastError });
      yield { type: "error", stage: "level1", message: "AI Level 1 fact extraction failed" } satisfies StepEvent;
      return;
    }

    yield { type: "stage-done", stage: "level1", data: parsed } satisfies StepEvent;
  },
};
