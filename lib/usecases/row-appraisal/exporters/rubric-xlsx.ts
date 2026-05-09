import ExcelJS from "exceljs";
import type { RowRubricData } from "../rubric-data";

export async function buildRowRubricXlsx(data: RowRubricData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Rubric");
  sheet.getRow(1).values = ["Category", "Score 1", "Score 2", "Score 3", "Score 4", "Score 5"];
  sheet.getRow(1).font = { bold: true };

  const categories = Object.entries(data);
  categories.forEach(([category, tiers], i) => {
    sheet.getRow(i + 2).values = [
      category,
      tiers["1"] || "—",
      tiers["2"] || "—",
      tiers["3"] || "—",
      tiers["4"] || "—",
      tiers["5"] || "—",
    ];
  });

  sheet.columns?.forEach((col, idx) => {
    col.width = idx === 0 ? 36 : 38;
    col.alignment = { wrapText: true, vertical: "top" };
  });

  return Buffer.from(await wb.xlsx.writeBuffer());
}
