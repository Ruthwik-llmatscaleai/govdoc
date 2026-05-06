import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { Level1Data, Level2Data, Level3Data, AnalystOverride } from "@/lib/usecases/cucp-reevals/types";
import { buildLevel3SystemPrompt, buildLevel3UserMessage } from "@/lib/usecases/cucp-reevals/prompts/level-3-threshold";
import { waitForHumanResponse } from "@/lib/runs/needs-input-rendezvous";

export const level3Step: PipelineStep<FormData> = {
  id: "level3",
  label: "Apply 7-criteria evaluation + human review",
  async *run(_formData, ctx) {
    yield { type: "progress", stage: "level3", pct: 0, message: "Starting Level 3 threshold evaluation" } satisfies StepEvent;

    const l1 = (ctx.prior.level1 ?? {}) as Level1Data;
    const l2 = (ctx.prior.level2 ?? {}) as Level2Data;
    const pnwResult = l1.cross_reference_result || "None";

    const provider: LlmProvider = "openai";
    const model = "gpt-4o";

    const messages = [
      { role: "system" as const, content: buildLevel3SystemPrompt() },
      { role: "user" as const, content: buildLevel3UserMessage(l2.classifications ?? [], l1.extracted_facts ?? [], pnwResult) },
    ];

    yield { type: "progress", stage: "level3", pct: 50, message: "Calling AI provider" } satisfies StepEvent;

    let parsed: Level3Data | null = null;
    let lastError: string | undefined;

    for (let attempt = 0; attempt < 2; attempt++) {
      let response: { text: string };
      try {
        response = await ctx.llm.call({ provider, model, messages, temperature: 0, responseFormat: "json_object" });
      } catch (e) {
        ctx.log("level3 provider error", { error: e instanceof Error ? e.message : String(e) });
        yield { type: "error", stage: "level3", message: "AI Level 3 threshold evaluation failed" } satisfies StepEvent;
        return;
      }
      try {
        parsed = JSON.parse(response.text) as Level3Data;
        break;
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        if (attempt === 0) {
          yield { type: "progress", stage: "level3", pct: 50, message: "Retrying after JSON parse failure" } satisfies StepEvent;
        }
      }
    }

    if (!parsed) {
      ctx.log("level3 JSON parse failure", { error: lastError });
      yield { type: "error", stage: "level3", message: "AI Level 3 threshold evaluation failed" } satisfies StepEvent;
      return;
    }

    yield { type: "stage-done", stage: "level3", data: parsed } satisfies StepEvent;

    yield {
      type: "needs-input",
      stage: "level3",
      prompt: {
        kind: "approve-or-override",
        category: "level-3-criteria",
        proposed: { decision: parsed.final_decision, rationale: parsed.certifier_comments },
      },
    } satisfies StepEvent;

    const body = await waitForHumanResponse<{ overrides?: AnalystOverride[] }>(ctx.runId);
    ctx.prior.overrides = body?.overrides ?? [];
  },
};
