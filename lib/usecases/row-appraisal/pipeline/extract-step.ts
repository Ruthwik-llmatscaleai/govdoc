import type { PipelineStep, StepEvent } from "@/lib/usecases/types";
import { loadBundledMarkdownForFilename } from "@/lib/usecases/row-appraisal/extract/load-bundled-md";

export const extractStep: PipelineStep<FormData> = {
  id: "extract",
  label: "Load bundled OCR markdown for uploaded PDF",
  async *run(formData, _ctx) {
    yield {
      type: "progress",
      stage: "extract",
      pct: 0,
      message: "Loading bundled OCR markdown",
    } satisfies StepEvent;

    const pdf = formData.get("pdf");
    if (!(pdf && typeof pdf === "object" && "name" in pdf)) {
      yield {
        type: "error",
        stage: "extract",
        message: "No PDF file uploaded",
      } satisfies StepEvent;
      return;
    }

    const file = pdf as File;
    const result = await loadBundledMarkdownForFilename(file.name);

    if (result === null) {
      yield {
        type: "error",
        stage: "extract",
        message: "No bundled Landing AI output for this PDF",
      } satisfies StepEvent;
      return;
    }

    const provider = (formData.get("provider") as string | null) ?? "openai";
    const model = (formData.get("model") as string | null) ?? "gpt-4.1";

    yield {
      type: "progress",
      stage: "extract",
      pct: 100,
      message: `Loaded ${result.asset}`,
    } satisfies StepEvent;

    yield {
      type: "stage-done",
      stage: "extract",
      data: {
        pdf_filename: file.name,
        markdown_asset: result.asset,
        extracted_text: result.text,
        provider,
        model,
      },
    } satisfies StepEvent;
  },
};
