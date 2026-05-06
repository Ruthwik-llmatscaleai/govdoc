import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import type { Level1Data, Level2Data, Level3Data, AnalystOverride } from "@/lib/usecases/cucp-reevals/types";
import { generateFinalMarkdownReport } from "@/lib/usecases/cucp-reevals/report/markdown";

export const reportStep: PipelineStep<FormData> = {
  id: "report",
  label: "Generate final markdown report",
  async *run(_formData, ctx) {
    yield { type: "progress", stage: "report", pct: 0, message: "Generating report" } satisfies StepEvent;

    const level1 = ctx.prior.level1 as Level1Data;
    const level2 = ctx.prior.level2 as Level2Data;
    const level3 = ctx.prior.level3 as Level3Data;
    const analyst_overrides = (ctx.prior.overrides as AnalystOverride[] | undefined) ?? [];

    const evaluation_date = new Date().toISOString();
    const markdown_report = generateFinalMarkdownReport(level1, level2, level3, analyst_overrides, evaluation_date);

    yield { type: "stage-done", stage: "report", data: { markdown_report, evaluation_date, analyst_overrides } } satisfies StepEvent;
  },
};
