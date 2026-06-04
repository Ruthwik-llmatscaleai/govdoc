import ExcelJS from "exceljs";
import type { Exporter } from "@/features/usecases/types";
import type { CmgcRunResult } from "../types";
import { SECTION_WEIGHTS } from "../rubric";
import { ALL_METHODS, METHOD_LABELS, type DeliveryMethod } from "../scoring/point-matrix";

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
    const weight = SECTION_WEIGHTS[sec as keyof typeof SECTION_WEIGHTS] ?? 0;
    const weighted = result.recommendation.weighted_scores[sec as keyof typeof result.recommendation.weighted_scores] ?? 0;
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
      r.selected_rating || "—",
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
    const weight = SECTION_WEIGHTS[sec as keyof typeof SECTION_WEIGHTS] ?? 0;
    const weighted = result.recommendation.weighted_scores[sec as keyof typeof result.recommendation.weighted_scores] ?? 0;
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

  // Sheet 5: Selection Matrix (Caltrans format)
  if (result.matrix) {
    const mx = wb.addWorksheet("Selection Matrix");
    mx.getCell("A1").value = "Project Delivery Selection Matrix";
    mx.getCell("A1").font = { bold: true, size: 12 };
    mx.mergeCells("A1:G1");

    mx.getCell("A3").value = "SCORING SUMMARY";
    mx.getCell("A3").font = { bold: true };

    mx.getRow(5).values = ["", "DBB", "Design-Seq", "DB/Low Bid", "DB/Best-Value", "CM/GC", "Prog. DB"];
    mx.getRow(5).font = { bold: true };

    const ordered = ALL_METHODS.map((method) => result.matrix!.method_scores.find((m) => m.method === method)!);

    mx.getRow(7).values = ["Worksheet 1 (A1-A10)", ...ordered.map((m) => m.worksheet1)];
    mx.getRow(8).values = ["Worksheet 2 (B-F)", ...ordered.map((m) => m.worksheet2)];
    mx.getRow(9).values = ["Total Score", ...ordered.map((m) => m.total)];
    mx.getRow(9).font = { bold: true };
    mx.getRow(10).values = ["Status", ...ordered.map((m) => m.noGo ? "NO-GO" : "Eligible")];

    mx.getCell("A12").value = `Recommended: ${result.matrix.recommended_label} (${result.matrix.recommended_total} pts)`;
    mx.getCell("A12").font = { bold: true };
    if (result.matrix.runner_up_label) {
      mx.getCell("A13").value = `Runner-up: ${result.matrix.runner_up_label} (${result.matrix.runner_up_total} pts)`;
    }

    // Per-question detail
    mx.getCell("A15").value = "PER-QUESTION POINT BREAKDOWN";
    mx.getCell("A15").font = { bold: true };
    mx.getRow(16).values = ["Question", "DBB", "Design-Seq", "DB/Low Bid", "DB/Best-Value", "CM/GC", "Prog. DB"];
    mx.getRow(16).font = { bold: true };

    let mxRow = 17;
    const questions = Object.keys(result.matrix.per_question).sort((a, b) => {
      const sa = a[0]!, sb = b[0]!;
      if (sa !== sb) return sa.localeCompare(sb);
      return parseInt(a.slice(1)) - parseInt(b.slice(1));
    });
    for (const qid of questions) {
      const pts = result.matrix.per_question[qid]!;
      mx.getRow(mxRow).values = [
        qid,
        ...ALL_METHODS.map((m) => pts[m] === -1 ? "No-Go" : pts[m]),
      ];
      mxRow++;
    }
  }

  // Sheet 6+: Per-method reasoning
  if (result.multi_method.method_scores.length > 0) {
    for (const m of result.multi_method.method_scores) {
      const label = (METHOD_LABELS[m.method as DeliveryMethod] ?? m.method).substring(0, 31);
      const methodSheet = wb.addWorksheet(label);
      methodSheet.getCell("A1").value = m.method;
      methodSheet.getCell("A1").font = { bold: true, size: 12 };

      methodSheet.getCell("A3").value = "Rank:";
      methodSheet.getCell("B3").value = m.rank;
      methodSheet.getCell("A4").value = "Score:";
      methodSheet.getCell("B4").value = m.score;
      methodSheet.getCell("A5").value = "Status:";
      methodSheet.getCell("B5").value = m.blocked ? "Blocked" : "Eligible";

      if (result.matrix) {
        const matrixEntry = result.matrix.method_scores.find((ms) => ms.method === m.method);
        if (matrixEntry) {
          methodSheet.getCell("A6").value = "Matrix Points:";
          methodSheet.getCell("B6").value = matrixEntry.total;
          methodSheet.getCell("A7").value = "No-Go:";
          methodSheet.getCell("B7").value = matrixEntry.noGo ? `Yes (${matrixEntry.noGoQuestions.join(", ")})` : "No";
        }
      }

      let r = 9;
      if (m.key_factors_reasoning) {
        methodSheet.getCell(`A${r}`).value = "Reasoning:";
        methodSheet.getCell(`A${r}`).font = { bold: true };
        r++;
        methodSheet.getCell(`A${r}`).value = m.key_factors_reasoning;
        methodSheet.mergeCells(`A${r}:D${r}`);
        r += 2;
      }

      if (m.key_factors.length > 0) {
        methodSheet.getCell(`A${r}`).value = "Key Factors:";
        methodSheet.getCell(`A${r}`).font = { bold: true };
        r++;
        for (const kf of m.key_factors) {
          methodSheet.getCell(`A${r}`).value = `• ${kf}`;
          r++;
        }
        r++;
      }

      if (m.pros.length > 0) {
        methodSheet.getCell(`A${r}`).value = "Pros:";
        methodSheet.getCell(`A${r}`).font = { bold: true };
        r++;
        for (const p of m.pros) {
          methodSheet.getCell(`A${r}`).value = `• ${p}`;
          r++;
        }
        r++;
      }

      if (m.cons.length > 0) {
        methodSheet.getCell(`A${r}`).value = "Cons:";
        methodSheet.getCell(`A${r}`).font = { bold: true };
        r++;
        for (const c of m.cons) {
          methodSheet.getCell(`A${r}`).value = `• ${c}`;
          r++;
        }
        r++;
      }

      if (m.block_reasons.length > 0) {
        methodSheet.getCell(`A${r}`).value = "Block Reasons:";
        methodSheet.getCell(`A${r}`).font = { bold: true };
        r++;
        for (const br of m.block_reasons) {
          methodSheet.getCell(`A${r}`).value = `• ${br}`;
          r++;
        }
      }
    }
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
