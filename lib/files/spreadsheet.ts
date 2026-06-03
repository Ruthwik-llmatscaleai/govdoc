import ExcelJS from "exceljs";

export async function parseCSV(buffer: Buffer, filename: string): Promise<string> {
  const text = buffer.toString("utf-8");
  return `[File: ${filename}]\n${text}`;
}

export async function parseExcel(buffer: Buffer, filename: string): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheets: string[] = [];
  workbook.eachSheet((sheet) => {
    const rows: string[] = [];
    sheet.eachRow((row) => {
      const cells = (row.values as unknown[])?.slice(1) ?? [];
      rows.push(cells.map((c) => String(c ?? "")).join(","));
    });
    if (rows.length > 0) {
      sheets.push(`[Sheet: ${sheet.name}]\n${rows.join("\n")}`);
    }
  });

  return `[File: ${filename}]\n${sheets.join("\n\n")}`;
}

export function isSpreadsheet(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  return [".csv", ".xlsx", ".xls"].includes(ext);
}

export async function parseSpreadsheet(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
  if (ext === ".csv") return parseCSV(buffer, filename);
  return parseExcel(buffer, filename);
}
