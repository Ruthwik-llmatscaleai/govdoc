import ExcelJS from "exceljs";
import type { CmgcRubricData } from "../rubric-data";

export async function buildCmgcRubricXlsx(data: CmgcRubricData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  const questions = wb.addWorksheet("Questions");
  questions.getRow(1).values = ["ID", "Section", "Question", "Option A", "Option B", "Option C"];
  questions.getRow(1).font = { bold: true };
  data.questions.forEach((q, i) => {
    questions.getRow(i + 2).values = [q.id, q.section, q.question, q.option_a, q.option_b, q.option_c];
  });
  questions.columns?.forEach((col) => {
    col.width = Math.max(col.width ?? 0, 32);
    col.alignment = { wrapText: true, vertical: "top" };
  });
  if (questions.columns?.[0]) questions.columns[0].width = 8;
  if (questions.columns?.[1]) questions.columns[1].width = 28;

  const weights = wb.addWorksheet("Section Weights");
  weights.getRow(1).values = ["Section", "Weight", "Weight (%)"];
  weights.getRow(1).font = { bold: true };
  let row = 2;
  for (const k of ["A", "B", "C", "D", "E", "F"] as const) {
    const w = data.weights[k];
    weights.getRow(row).values = [k, w, `${(w * 100).toFixed(0)}%`];
    row++;
  }
  weights.columns?.forEach((col) => {
    col.width = Math.max(col.width ?? 0, 14);
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
