import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { CucpRubricData } from "../rubric-data";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 54;
const LINE_HEIGHT = 14;

export async function buildCucpRubricPdf(data: CucpRubricData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const helvItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;
  const maxWidth = PAGE_W - MARGIN * 2;

  function newPage() {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  }

  function ensure(needed: number) {
    if (y - needed < MARGIN) newPage();
  }

  function wrap(text: string, font: typeof helv, size: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let current = "";
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        current = next;
      } else {
        if (current) lines.push(current);
        current = w;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  function drawLine(text: string, opts: { font?: typeof helv; size?: number; color?: ReturnType<typeof rgb> } = {}) {
    const font = opts.font ?? helv;
    const size = opts.size ?? 11;
    const color = opts.color ?? rgb(0.1, 0.1, 0.1);
    const lines = wrap(text, font, size);
    for (const line of lines) {
      ensure(LINE_HEIGHT);
      page.drawText(line, { x: MARGIN, y, size, font, color });
      y -= LINE_HEIGHT;
    }
  }

  function gap(px = 8) { y -= px; }

  // Title
  drawLine("CUCP Rubric — 49 CFR §26.67", { font: helvBold, size: 18 });
  gap(4);
  drawLine("Per-applicant disadvantage evaluation criteria", { font: helvItalic, size: 11, color: rgb(0.4, 0.4, 0.4) });
  gap(16);

  // Level 2
  drawLine("Level 2 — Legal Categories", { font: helvBold, size: 14 });
  gap(6);
  for (const c of data.l2) {
    ensure(LINE_HEIGHT * 3);
    drawLine(`• ${c.name}`, { font: helvBold, size: 12 });
    drawLine(c.description, { size: 11, color: rgb(0.25, 0.25, 0.25) });
    gap(6);
  }

  gap(12);

  // Level 3
  ensure(LINE_HEIGHT * 4);
  drawLine("Level 3 — 7 Criteria", { font: helvBold, size: 14 });
  gap(6);
  for (const c of data.l3) {
    ensure(LINE_HEIGHT * 3);
    drawLine(`${c.s_no}. ${c.name}`, { font: helvBold, size: 12 });
    if (c.rule) drawLine(`Rule: ${c.rule}`, { size: 10, color: rgb(0.25, 0.25, 0.25) });
    gap(6);
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
