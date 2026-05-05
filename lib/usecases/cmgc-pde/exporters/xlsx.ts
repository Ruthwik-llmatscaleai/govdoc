import ExcelJS from "exceljs";
import type { Exporter } from "@/lib/usecases/types";
import type { CmgcRunResult } from "../types";
import { SECTION_WEIGHTS } from "../rubric";

export async function buildEvaluationXlsx(result: CmgcRunResult, projectName: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Dashboard
  const dashboard = wb.addWorksheet("Dashboard");
  dashboard.getCell("A1").value = `Project Delivery Evaluation — ${projectName}`;
  dashboard.getCell("A1").font = { bold: true, size: 14 };
  dashboard.mergeCells("A1:D1");

  dashboard.getCell("A3").value = "Recommended Method:";
  dashboard.getCell("B3").value = result.recommendation.recommended_method;
  dashboard.getCell("A4").value = "Runner-Up:";
  dashboard.getCell("B4").value = result.recommendation.runner_up_method ?? "";
  dashboard.getCell("A5").value = "Composite Score:";
  dashboard.getCell("B5").value = `${result.recommendation.composite_score.toFixed(3)} / 3.000`;
  dashboard.getCell("A6").value = "Borderline:";
  dashboard.getCell("B6").value = result.recommendation.is_borderline ? "Yes" : "No";
  dashboard.getCell("A7").value = "Overrides Triggered:";
  dashboard.getCell("B7").value = result.recommendation.override_status.filter((o) => o.triggered).length;

  dashboard.getCell("A9").value = "Section Score Breakdown";
  dashboard.getCell("A9").font = { bold: true };
  dashboard.getRow(10).values = ["Section", "Avg Score", "Weight", "Weighted"];
  dashboard.getRow(10).font = { bold: true };

  let rowIdx = 11;
  for (const [sec, avg] of Object.entries(result.recommendation.section_scores)) {
    const weight = SECTION_WEIGHTS[sec] ?? 0;
    const weighted = result.recommendation.weighted_scores[sec] ?? 0;
    dashboard.getRow(rowIdx).values = [sec, (avg as number).toFixed(3), weight, (weighted as number).toFixed(4)];
    rowIdx++;
  }

  // Sheet 2: Rubric
  const rubric = wb.addWorksheet("Rubric");
  rubric.getRow(1).values = ["Question ID", "Question", "Selected Rating", "Confidence", "Source Reasoning", "Missing Info"];
  rubric.getRow(1).font = { bold: true };
  result.evaluation.ratings.forEach((r, i) => {
    rubric.getRow(i + 2).values = [
      r.question_id,
      r.question_text,
      r.selected_rating,
      r.confidence,
      r.source_reasoning,
      r.missing_info_reasoning,
    ];
  });

  // Sheet 3: Scoring
  const scoring = wb.addWorksheet("Scoring");
  scoring.getCell("A1").value = "Section Scores";
  scoring.getCell("A1").font = { bold: true };
  scoring.getRow(2).values = ["Section", "Average", "Weight", "Weighted Contribution"];
  scoring.getRow(2).font = { bold: true };
  let scoreRow = 3;
  for (const [sec, avg] of Object.entries(result.recommendation.section_scores)) {
    const weight = SECTION_WEIGHTS[sec] ?? 0;
    const weighted = result.recommendation.weighted_scores[sec] ?? 0;
    scoring.getRow(scoreRow).values = [sec, (avg as number).toFixed(3), weight, (weighted as number).toFixed(4)];
    scoreRow++;
  }

  const driversStart = scoreRow + 2;
  scoring.getCell(`A${driversStart}`).value = "Top 5 Key Drivers";
  scoring.getCell(`A${driversStart}`).font = { bold: true };
  scoring.getRow(driversStart + 1).values = ["Question ID", "Section", "Rating", "Raw Score", "Weighted Contribution"];
  scoring.getRow(driversStart + 1).font = { bold: true };
  result.recommendation.key_drivers.forEach((d, i) => {
    scoring.getRow(driversStart + 2 + i).values = [
      d.question_id,
      d.section,
      d.rating,
      d.raw_score,
      d.weighted_contribution,
    ];
  });

  // Sheet 4: Multi-Method
  const mm = wb.addWorksheet("Multi-Method");
  mm.getRow(1).values = ["Rank", "Method", "Score", "Blocked", "Pros", "Cons", "Key Factors", "Reasoning"];
  mm.getRow(1).font = { bold: true };
  result.multi_method.method_scores.forEach((m, i) => {
    mm.getRow(i + 2).values = [
      m.rank,
      m.method,
      m.score,
      m.blocked ? "Yes" : "No",
      m.pros.join("; "),
      m.cons.join("; "),
      m.key_factors.join("; "),
      m.key_factors_reasoning ?? "",
    ];
  });

  // Sheet 5: Validation
  const val = wb.addWorksheet("Validation");
  if (result.validation) {
    val.getRow(1).values = ["Question ID", "AI Rating", "User Rating", "Severity", "AI Confidence", "Evidence"];
    val.getRow(1).font = { bold: true };
    result.validation.comparisons.forEach((c, i) => {
      val.getRow(i + 2).values = [
        c.question_id,
        c.ai_rating,
        c.user_rating,
        c.severity,
        c.ai_confidence,
        c.ai_evidence,
      ];
    });
    const offset = result.validation.comparisons.length + 4;
    val.getCell(`A${offset}`).value = "Deviation Impact";
    val.getCell(`A${offset}`).font = { bold: true };
    val.getCell(`A${offset + 1}`).value = "AI Method:";
    val.getCell(`B${offset + 1}`).value = result.validation.deviation_impact.ai_method;
    val.getCell(`A${offset + 2}`).value = "User Method:";
    val.getCell(`B${offset + 2}`).value = result.validation.deviation_impact.user_method;
    val.getCell(`A${offset + 3}`).value = "Recommendation Changed:";
    val.getCell(`B${offset + 3}`).value = result.validation.deviation_impact.recommendation_changed ? "Yes" : "No";
  } else {
    val.getCell("A1").value = "Validation skipped — no district ratings provided";
  }

  // Set reasonable column widths
  for (const ws of wb.worksheets) {
    ws.columns.forEach((col) => {
      col.width = Math.max(col.width ?? 0, 18);
    });
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export const xlsxExporter: Exporter = {
  id: "xlsx",
  label: "Download Excel report",
  contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  async build(result: unknown): Promise<Uint8Array> {
    const r = result as CmgcRunResult;
    const projectName = r.evaluation.project_name || "Untitled Project";
    const buf = await buildEvaluationXlsx(r, projectName);
    return new Uint8Array(buf);
  },
};
