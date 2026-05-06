import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { LlmProvider } from "@/lib/llm/types";
import type { EvaluationResult } from "@/lib/usecases/row-appraisal/types";
import { orderCategoriesByDependencyGroups } from "@/lib/usecases/row-appraisal/chunking/group-categories";
import { runOneChunk } from "@/lib/usecases/row-appraisal/chunking/run-chunk";
import type { ChunkRubric } from "@/lib/usecases/row-appraisal/rules/prompt-builder";
import rubricSchema from "@/lib/usecases/row-appraisal/assets/rubric_schema.json";

const CHUNK_SIZE = 8;

type ExtractPrior = {
  extracted_text: string;
  provider: string;
  model: string;
};

export const evaluateStep: PipelineStep<unknown> = {
  id: "evaluate",
  label: "Chunked LLM evaluation",
  async *run(_input, ctx) {
    const prior = (ctx.prior.extract ?? {}) as ExtractPrior;
    const extractedText = prior.extracted_text ?? "";
    const provider = (prior.provider ?? "openai") as LlmProvider;
    const model = prior.model ?? "gpt-4.1";

    const ordered = orderCategoriesByDependencyGroups(
      rubricSchema as Record<string, Record<string, string>>,
    );
    const total = Math.ceil(ordered.length / CHUNK_SIZE);

    const allResults: EvaluationResult[] = [];

    for (let i = 0; i < total; i++) {
      const chunkSlice = ordered.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkRubric: ChunkRubric = Object.fromEntries(
        chunkSlice.map(({ category, rubric }) => [category, rubric]),
      );

      yield {
        type: "progress",
        stage: "evaluate",
        pct: (i / total) * 100,
        message: `Evaluating chunk ${i + 1}/${total}: ${chunkSlice.map((s) => s.category).join(", ")}`,
      } satisfies StepEvent;

      const chunkResults = await runOneChunk({
        chunkRubric,
        extractedText,
        llm: ctx.llm,
        provider,
        model,
      });

      allResults.push(...chunkResults);

      yield {
        type: "partial",
        stage: "evaluate",
        data: { chunkIndex: i, results: chunkResults },
      } satisfies StepEvent;
    }

    yield {
      type: "stage-done",
      stage: "evaluate",
      data: { raw_results: allResults },
    } satisfies StepEvent;
  },
};
