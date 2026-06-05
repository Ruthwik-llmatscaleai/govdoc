import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";
import type { Exporter } from "@/features/usecases/types";
import type { CmgcRunResult } from "../types";
import { ALL_METHODS } from "../scoring/point-matrix";

export async function buildEvaluationDocx(result: CmgcRunResult, projectName: string): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(`Project Delivery Evaluation — ${projectName}`)],
    }),
  );
  children.push(
    new Paragraph({
      children: [new TextRun(`Evaluation date: ${result.evaluation.evaluation_date}`)],
    }),
  );

  // Recommendation — matrix-based
  if (result.matrix) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(`Recommended: ${result.matrix.recommended_label}`)],
      }),
    );
    children.push(new Paragraph(`Score: ${result.matrix.recommended_total} pts`));
    if (result.matrix.runner_up_label) {
      children.push(new Paragraph(`Runner-up: ${result.matrix.runner_up_label} (${result.matrix.runner_up_total} pts)`));
    }
    if (result.matrix.no_go_methods.length > 0) {
      children.push(new Paragraph(`No-Go methods: ${result.matrix.no_go_methods.join(", ")}`));
    }
  } else {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(`Recommended: ${result.recommendation.recommended_method}`)],
      }),
    );
  }

  // Override reasons
  if (result.recommendation.override_reasons.length > 0) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Override Reasons")],
      }),
    );
    for (const reason of result.recommendation.override_reasons) {
      children.push(new Paragraph({ children: [new TextRun(`• ${reason}`)] }));
    }
  }

  // Selection Matrix scores
  if (result.matrix) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("Selection Matrix Scores")],
      }),
    );
    for (const method of ALL_METHODS) {
      const m = result.matrix.method_scores.find((ms) => ms.method === method);
      if (!m) continue;
      const status = m.noGo ? `NO-GO (${m.noGoQuestions.join(", ")})` : "Eligible";
      children.push(new Paragraph(`${m.label}: WS1=${m.worksheet1}, WS2=${m.worksheet2}, Total=${m.total} — ${status}`));
    }
  }

  // Rubric ratings
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun("Rubric Ratings")],
    }),
  );
  for (const r of result.evaluation.ratings) {
    children.push(
      new Paragraph(`[${r.question_id}] ${r.selected_rating || "—"} (conf ${r.confidence.toFixed(2)})`),
    );
    if (r.source_reasoning) {
      children.push(new Paragraph(`  ${r.source_reasoning.slice(0, 400)}`));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export const docxExporter: Exporter = {
  id: "docx",
  label: "Download DOCX report",
  contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  async build(result: unknown): Promise<Uint8Array> {
    const r = result as CmgcRunResult;
    const projectName = r.evaluation.project_name || "Untitled Project";
    const buf = await buildEvaluationDocx(r, projectName);
    return new Uint8Array(buf);
  },
};
