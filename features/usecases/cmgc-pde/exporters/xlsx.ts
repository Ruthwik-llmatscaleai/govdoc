import ExcelJS from "exceljs";
import type { Exporter } from "@/features/usecases/types";
import type { CmgcRunResult } from "../types";
import { SCORING_MATRIX, ALL_METHODS, type DeliveryMethod, type Rating } from "../scoring/point-matrix";

const QUESTIONS_META: Record<string, { text: string; options: Record<string, string> }> = {
  A1: { text: "Where is the project in the project development process?", options: { A: "Detailed or final engineering stage", B: "Preliminary design", C: "Conceptual engineering stage" } },
  A2: { text: "What is the size of the project?", options: { A: "Small project (less than $25 million)", B: "Medium size project ($25M–$75M)", C: "Large project (greater than $75 million)" } },
  A3: { text: "What is the complexity of the project?", options: { A: "Relatively simple project", B: "More technically complex components", C: "Very complex project with significant schedule complexity" } },
  A4: { text: "Does the project involve significant impacts to highway users and local businesses/community during construction?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  A5: { text: "Does the project present right-of-way limitations that would benefit from entity's assistance?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  A6: { text: "Does the project present environmental permitting issues that would benefit from entity's assistance?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  A7: { text: "Does the project present utility or third-party issues that would benefit from entity's assistance?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  A8: { text: "Does the project present unique work restrictions or traffic maintenance requirements?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  A9: { text: "Would the Project benefit by packaging features of work to allow early lock-in of construction materials/labor pricing?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  A10: { text: "Would the project benefit by raising quality standards/benchmarks to minimize maintenance and achieve lower life-cycle cost?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  B1: { text: "Can timesavings be realized through concurrent design and construction activities (fast-tracking)?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  B2: { text: "Can the schedule be compressed?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  C1: { text: "Will the project scope allow for innovation?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  C2: { text: "Must the project scope be primarily defined in terms of prescriptive or performance specifications?", options: { A: "Primarily prescriptive specifications", B: "Combination of prescriptive and performance", C: "Performance specifications for significant elements" } },
  D1: { text: "Will there be opportunities for contractors to provide materials or methods that provide greater value?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  D2: { text: "Will there be the opportunity for realization of greater value due to designs tailored to entity's expertise?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  D3: { text: "Will warranties or maintenance agreements be used?", options: { A: "No", B: "Limited to short-term workmanship and materials", C: "Much more than typical" } },
  E1: { text: "Will there be opportunities for entity to provide designs with lower initial construction costs?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  E2: { text: "Will there be opportunities for contractors to provide alternate design concepts with lower lifecycle costs?", options: { A: "No more than typical", B: "More than typical", C: "Much more than typical" } },
  E3: { text: "Is funding for the project committed and available?", options: { A: "Secured for design phase only", B: "Funding can accommodate fast-tracking to some extent", C: "Funding will accommodate compressed schedule/fast-tracking" } },
  E4: { text: "Will the cost of procurement affect the number of bidders?", options: { A: "Procurement cost would significantly limit competition", B: "Procurement cost could affect the number of bidders", C: "Procurement cost would not be a significant issue" } },
  E5: { text: "Will project budget control benefit from the use of formal contingencies?", options: { A: "No benefit", B: "A formal contingency may permit adding scope", C: "A formal contingency is required to maximize scope and quality" } },
  F1: { text: "Does the Department have the expertise and resources necessary for a complicated procurement process?", options: { A: "Inadequate resources or expertise", B: "Limited resources or expertise", C: "Adequate resources and expertise" } },
  F2: { text: "Are resources available to complete the design?", options: { A: "Resources are available to complete design", B: "Resources are available for partial design", C: "Specialized expertise, not available in-house, is required" } },
  F3: { text: "Are resources available to provide construction oversight?", options: { A: "Resources are available", B: "Full-time oversight could strain staff", C: "Resources are unavailable" } },
};

const WS1_IDS = ["A1","A2","A3","A4","A5","A6","A7","A8","A9","A10"];
const WS2_IDS = ["B1","B2","C1","C2","D1","D2","D3","E1","E2","E3","E4","E5","F1","F2","F3"];
const METHOD_SHORT: Record<DeliveryMethod, string> = { DBB: "Design-Bid-Build", DS: "Design-Sequencing", DB_LB: "Design-Build/Low Bid", DB_BV: "Design-Build/Best-Value", CMGC: "CM/GC", PDB: "Progressive Design-Build" };


export async function buildEvaluationXlsx(result: CmgcRunResult, projectName: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // Build ratings lookup
  const ratings: Record<string, Rating> = {};
  for (const r of result.evaluation.ratings) {
    if (r.question_id && r.selected_rating) {
      ratings[r.question_id] = (r.selected_rating.toUpperCase() || "B") as Rating;
    }
  }

  // Compute scores per method
  const methodTotals: Record<DeliveryMethod, { ws1: number; ws2: number; total: number; noGo: string[] }> = {} as any;
  for (const m of ALL_METHODS) methodTotals[m] = { ws1: 0, ws2: 0, total: 0, noGo: [] };
  for (const qid of [...WS1_IDS, ...WS2_IDS]) {
    const answer = ratings[qid] ?? "B";
    const row = SCORING_MATRIX[qid]?.[answer];
    if (!row) continue;
    const isWs1 = WS1_IDS.includes(qid);
    for (const m of ALL_METHODS) {
      if (row[m] === -1) { methodTotals[m].noGo.push(qid); }
      else {
        methodTotals[m].total += row[m];
        if (isWs1) methodTotals[m].ws1 += row[m];
        else methodTotals[m].ws2 += row[m];
      }
    }
  }

  // ─── Sheet 1: SUMMARY ───
  const summary = wb.addWorksheet("SUMMARY");
  summary.getCell("B1").value = "Project Delivery Selection Tool";
  summary.getCell("B1").font = { bold: true, size: 14 };
  summary.getCell("B2").value = "Project Summary Worksheet";
  summary.getCell("B2").font = { bold: true, size: 12 };

  summary.getCell("A4").value = "Project Name:";
  summary.getCell("B4").value = projectName;
  summary.getCell("B4").font = { bold: true };
  summary.getCell("A5").value = "Date:";
  summary.getCell("B5").value = result.evaluation.evaluation_date ?? "";

  summary.getCell("A7").value = "SCORING SUMMARY";
  summary.getCell("A7").font = { bold: true, size: 11 };

  summary.getRow(9).values = ["", ...ALL_METHODS.map((m) => METHOD_SHORT[m])];
  summary.getRow(9).font = { bold: true };
  summary.getRow(9).eachCell((cell) => { cell.alignment = { horizontal: "center" }; });

  summary.getRow(11).values = ["Project Scope & Characteristics (WS1)", ...ALL_METHODS.map((m) => methodTotals[m].ws1)];
  summary.getRow(12).values = ["Success Criteria (WS2)", ...ALL_METHODS.map((m) => methodTotals[m].ws2)];
  summary.getRow(13).values = ["Total Score", ...ALL_METHODS.map((m) => methodTotals[m].total)];
  summary.getRow(13).font = { bold: true };

  // Find winner
  const eligible = ALL_METHODS.filter((m) => methodTotals[m].noGo.length === 0);
  const sorted = [...eligible].sort((a, b) => methodTotals[b].total - methodTotals[a].total);
  const winner = sorted[0];
  summary.getCell("A15").value = "Final Selection:";
  summary.getCell("A15").font = { bold: true };
  summary.getCell("B15").value = winner ? `${METHOD_SHORT[winner]} (${methodTotals[winner].total} pts)` : "—";
  summary.getCell("B15").font = { bold: true };

  // ─── Sheet 2: Questionnaire (matches Caltrans Template format) ───
  const template = wb.addWorksheet("Questionnaire");

  const borderThin: Partial<ExcelJS.Border> = { style: "thin" };
  const borders: Partial<ExcelJS.Borders> = { top: borderThin, bottom: borderThin, left: borderThin, right: borderThin };
  const centerAlign: Partial<ExcelJS.Alignment> = { horizontal: "center", vertical: "middle" };

  // Header
  template.getCell("A1").value = "WORKSHEET 1: EVALUATION OF PROJECT SCOPE AND CHARACTERISTICS";
  template.getCell("A1").font = { bold: true, size: 11 };
  template.mergeCells("A1:G1");

  // Column headers
  template.getRow(3).values = ["Project Scope and Characteristic Criteria", ...ALL_METHODS.map((m) => METHOD_SHORT[m])];
  template.getRow(3).font = { bold: true, size: 9 };
  template.getRow(3).eachCell((cell) => { cell.border = borders; cell.alignment = centerAlign; });
  template.getRow(3).getCell(1).alignment = { horizontal: "left", vertical: "middle" };

  let row = 5;
  function writeQuestion(qid: string) {
    const meta = QUESTIONS_META[qid];
    const answer = ratings[qid] ?? "B";
    const pts = SCORING_MATRIX[qid]?.[answer];
    if (!meta || !pts) return;

    // Question row: "A1. [C] Question text" + awarded points per method
    const qCell = template.getCell(row, 1);
    qCell.value = `${qid}. ${meta.text}`;
    qCell.font = { bold: true, size: 10 };
    // Write awarded points
    ALL_METHODS.forEach((m, i) => {
      const cell = template.getCell(row, i + 2);
      cell.value = pts[m] === -1 ? "No-Go" : pts[m];
      cell.alignment = centerAlign;
      cell.font = { bold: true };
      cell.border = borders;
    });
    // Selected answer badge in question cell
    const answerCell = template.getCell(row, 1);
    answerCell.value = { richText: [
      { text: `${qid}. `, font: { bold: true, size: 10 } },
      { text: `[${answer}] `, font: { bold: true, size: 10, color: { argb: "FF3D5740" } } },
      { text: meta.text, font: { size: 10 } },
    ] };
    row++;

    // Option rows
    for (const opt of ["A", "B", "C"] as Rating[]) {
      const optPts = SCORING_MATRIX[qid]![opt];
      const isSelected = opt === answer;
      const optCell = template.getCell(row, 1);
      optCell.value = `     ${opt}. ${meta.options[opt]}`;
      optCell.font = isSelected ? { bold: true, size: 9 } : { size: 9, color: { argb: "FF666666" } };
      ALL_METHODS.forEach((m, i) => {
        const cell = template.getCell(row, i + 2);
        cell.value = optPts[m] === -1 ? "No-Go" : `${optPts[m]} pts`;
        cell.alignment = centerAlign;
        cell.font = isSelected ? { bold: true, size: 9 } : { size: 9, color: { argb: "FF666666" } };
        if (isSelected) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDF7EE" } };
      });
      row++;
    }
    row++; // spacing
  }

  for (const qid of WS1_IDS) writeQuestion(qid);

  // WS1 subtotal
  template.getCell(row, 1).value = "Project Characteristics Subtotal (A1-A10)";
  template.getCell(row, 1).font = { bold: true };
  ALL_METHODS.forEach((m, i) => {
    const cell = template.getCell(row, i + 2);
    cell.value = methodTotals[m].ws1;
    cell.font = { bold: true };
    cell.alignment = centerAlign;
    cell.border = borders;
  });
  row += 3;

  // Worksheet 2
  template.getCell(row, 1).value = "WORKSHEET 2: SUCCESS CRITERIA";
  template.getCell(row, 1).font = { bold: true, size: 11 };
  template.mergeCells(row, 1, row, 7);
  row += 2;

  const sections: Record<string, string[]> = {
    "B - Schedule Issues": ["B1", "B2"],
    "C - Opportunity for Innovation": ["C1", "C2"],
    "D - Quality Enhancement": ["D1", "D2", "D3"],
    "E - Cost Issues": ["E1", "E2", "E3", "E4", "E5"],
    "F - Staffing Issues": ["F1", "F2", "F3"],
  };

  for (const [secLabel, qids] of Object.entries(sections)) {
    template.getCell(row, 1).value = secLabel;
    template.getCell(row, 1).font = { bold: true, italic: true, size: 10 };
    row += 2;
    for (const qid of qids) writeQuestion(qid);
  }

  // WS2 subtotal
  template.getCell(row, 1).value = "Success Criteria Subtotal (B-F)";
  template.getCell(row, 1).font = { bold: true };
  ALL_METHODS.forEach((m, i) => {
    const cell = template.getCell(row, i + 2);
    cell.value = methodTotals[m].ws2;
    cell.font = { bold: true };
    cell.alignment = centerAlign;
    cell.border = borders;
  });
  row += 2;

  // Grand total
  template.getCell(row, 1).value = "TOTAL";
  template.getCell(row, 1).font = { bold: true, size: 12 };
  ALL_METHODS.forEach((m, i) => {
    const cell = template.getCell(row, i + 2);
    cell.value = methodTotals[m].total;
    cell.font = { bold: true, size: 12 };
    cell.alignment = centerAlign;
    cell.border = borders;
  });

  // ─── Sheet 3+: Per delivery method ───
  for (const method of ALL_METHODS) {
    const label = METHOD_SHORT[method].replace(/[/\\?*[\]]/g, "-").substring(0, 31);
    const ms = wb.addWorksheet(label);
    const t = methodTotals[method];

    ms.getCell("A1").value = METHOD_SHORT[method];
    ms.getCell("A1").font = { bold: true, size: 14 };

    ms.getCell("A3").value = "Total Score:";
    ms.getCell("B3").value = t.total;
    ms.getCell("B3").font = { bold: true };
    ms.getCell("A4").value = "Worksheet 1:";
    ms.getCell("B4").value = t.ws1;
    ms.getCell("A5").value = "Worksheet 2:";
    ms.getCell("B5").value = t.ws2;
    ms.getCell("A6").value = "Status:";
    ms.getCell("B6").value = t.noGo.length > 0 ? `NO-GO (${t.noGo.join(", ")})` : "Eligible";

    // Per-question points for this method
    let r = 8;
    ms.getRow(r).values = ["Question", "Selected", "Points", "Reasoning"];
    ms.getRow(r).font = { bold: true };
    r++;

    for (const qid of [...WS1_IDS, ...WS2_IDS]) {
      const answer = ratings[qid] ?? "B";
      const pts = SCORING_MATRIX[qid]?.[answer]?.[method] ?? 0;
      const ratingEntry = result.evaluation.ratings.find((x) => x.question_id === qid);
      const reasoning = ratingEntry?.source_reasoning?.slice(0, 200) ?? "";
      ms.getRow(r).values = [qid, answer, pts === -1 ? "No-Go" : pts, reasoning];
      r++;
    }

    // LLM reasoning if available
    if (result.multi_method?.method_scores) {
      const mm = result.multi_method.method_scores.find((x) => x.method === method || x.method === METHOD_SHORT[method]);
      if (mm) {
        r += 2;
        if (mm.key_factors_reasoning) {
          ms.getCell(`A${r}`).value = "AI Reasoning:";
          ms.getCell(`A${r}`).font = { bold: true };
          r++;
          ms.getCell(`A${r}`).value = mm.key_factors_reasoning;
          r += 2;
        }
        if (mm.pros.length > 0) {
          ms.getCell(`A${r}`).value = "Pros:";
          ms.getCell(`A${r}`).font = { bold: true };
          r++;
          for (const p of mm.pros) { ms.getCell(`A${r}`).value = `• ${p}`; r++; }
          r++;
        }
        if (mm.cons.length > 0) {
          ms.getCell(`A${r}`).value = "Cons:";
          ms.getCell(`A${r}`).font = { bold: true };
          r++;
          for (const c of mm.cons) { ms.getCell(`A${r}`).value = `• ${c}`; r++; }
        }
      }
    }
  }

  // Set column widths
  for (const ws of wb.worksheets) {
    if (ws.columns) {
      ws.columns.forEach((col, i) => {
        col.width = i === 0 ? 50 : 18;
      });
    }
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
