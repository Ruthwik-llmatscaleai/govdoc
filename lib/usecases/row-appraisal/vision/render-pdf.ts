import { createRequire } from "module";
import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

// In Node.js, pdfjs uses a fake worker that dynamically imports workerSrc.
// We must point it to the absolute file URL so the dynamic import succeeds.
const _require = createRequire(import.meta.url);
const workerPath = _require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

export async function renderPdfPagesAsImages(
  pdfBytes: Buffer,
  pageRange: [number, number],
  dpi = 150,
): Promise<string[]> {
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBytes) });
  const doc = await loadingTask.promise;
  const total = doc.numPages;
  const start = Math.max(1, pageRange[0]);
  const end = Math.min(total, pageRange[1]);
  const scale = dpi / 72;

  const urls: string[] = [];
  for (let n = start; n <= end; n++) {
    const page = await doc.getPage(n);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");
    // pdfjs v5 types expect HTMLCanvasElement; @napi-rs/canvas is compatible at runtime.
    // canvasContext-only call: pdfjs derives canvas from ctx.canvas internally.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    const pngBuffer = canvas.toBuffer("image/png");
    urls.push(`data:image/png;base64,${pngBuffer.toString("base64")}`);
  }
  await doc.cleanup();
  return urls;
}
