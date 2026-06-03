import type { PipelineStep, StepEvent } from "@/features/usecases/types";
import { loadBundledMarkdownForFilename } from "@/features/usecases/row-appraisal/extract/load-bundled-md";
import { extractTextFromPdf } from "@/lib/files/pdf";

export const extractStep: PipelineStep<FormData> = {
  id: "extract",
  label: "Extract text from uploaded PDF",
  async *run(formData, _ctx) {
    yield {
      type: "progress",
      stage: "extract",
      pct: 0,
      message: "Reading PDF…",
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
    const pdfBuffer = Buffer.from(await file.arrayBuffer());

    // Try bundled Landing AI markdown first (higher quality OCR for known samples)
    const bundled = await loadBundledMarkdownForFilename(file.name);

    let extractedText: string;
    let source: string;

    if (bundled) {
      extractedText = bundled.text;
      source = `bundled OCR (${bundled.asset})`;
    } else {
      // Fallback: extract text directly from PDF using pdfjs
      yield {
        type: "progress",
        stage: "extract",
        pct: 30,
        message: "No bundled OCR — extracting text from PDF directly…",
      } satisfies StepEvent;

      extractedText = await extractTextFromPdf(pdfBuffer);

      if (!extractedText.trim()) {
        yield {
          type: "error",
          stage: "extract",
          message: "Could not extract any text from this PDF. The file may be scanned/image-only.",
        } satisfies StepEvent;
        return;
      }
      source = "pdfjs text extraction";
    }

    yield {
      type: "progress",
      stage: "extract",
      pct: 100,
      message: `Text extracted via ${source}`,
    } satisfies StepEvent;

    yield {
      type: "stage-done",
      stage: "extract",
      data: {
        pdf_filename: file.name,
        pdf_bytes_b64: pdfBuffer.toString("base64"),
        markdown_asset: bundled?.asset ?? null,
        extracted_text: extractedText,
        provider: "openai",
        model: "gpt-4.1",
      },
    } satisfies StepEvent;
  },
};
