#!/usr/bin/env npx tsx
/**
 * Ingest the Sunnyvale FY 2025/26 Adopted Budget PDFs into the curated
 * "sunnyvale-finance" Knowledge Base that the chat answers finance questions from.
 *
 * Narrative pages are extracted as text; table-heavy pages are rendered to images
 * and converted to clean markdown by a vision model (plain text extraction
 * scrambles budget tables — numbers misalign from their labels). If a page fails
 * to render, it falls back to its raw text so a single bad page never aborts the
 * run. Every chunk carries its volume + page so answers can cite the source.
 *
 * Idempotent: deletes the existing KB docs before re-ingesting. Vision output is
 * cached per page under finance/.vision-cache so re-runs don't re-pay.
 *
 * Usage (env must be loaded — npx tsx alone does NOT read .env.local):
 *   node --env-file=.env.local --import tsx scripts/ingest-finance-kb.ts
 *   node --env-file=.env.local --import tsx scripts/ingest-finance-kb.ts --vol=1 --max-pages=40
 *
 * Requires in the env: DATABASE_URL, OPENAI_API_KEY.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { pathToFileURL } from "url";
import { randomUUID } from "crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { createCanvas, Path2D, DOMMatrix, ImageData } from "@napi-rs/canvas";

import { prisma } from "@/lib/db";
import { generateEmbeddings } from "@/features/search-ask/documents";
import type { DocumentChunk, ProcessedDocument } from "@/features/search-ask/documents";
import { saveKbDocument, deleteKbDocuments } from "@/lib/document-store";
import { makeLlmRouter } from "@/lib/llm/router";

// pdfjs v5 canvas rendering needs these DOM globals; @napi-rs/canvas provides them.
// They must be registered before pdfjs loads, which is why pdfjs is imported lazily
// (inside openPdf). Without Path2D, page.render() throws "Value is none of these
// types String, Path".
const g = globalThis as Record<string, unknown>;
g.Path2D ??= Path2D;
g.DOMMatrix ??= DOMMatrix;
g.ImageData ??= ImageData;

const STANDARD_FONTS = pathToFileURL(join(process.cwd(), "node_modules", "pdfjs-dist", "standard_fonts") + "/").href;

const SYSTEM_EMAIL = "system@govdoc.local";
const VISION_MODEL = "gpt-4o";
const VISION_CACHE_DIR = join("finance", ".vision-cache");
const MAX_CHUNK_CHARS = 6000;

// Each city is its own Knowledge Base (metadata.kb tag). Ingesting one city's
// budget never touches another's — fully additive.
const CITIES: Record<string, { kb: string; sources: { vol: number; file: string; label: string }[] }> = {
  sunnyvale: {
    kb: "sunnyvale-finance",
    sources: [
      { vol: 1, file: "finance/FY 202526 Adopted Budget Volume 1  Summary and Operating Budget.pdf", label: "FY25/26 Budget Vol 1" },
      { vol: 2, file: "finance/FY 202526 Adopted Budget Volume 2  Projects Budget.pdf", label: "FY25/26 Budget Vol 2" },
    ],
  },
  fremont: {
    kb: "fremont-finance",
    sources: [
      { vol: 1, file: "finance/202526 Adopted Budget_20250829_fremont.pdf", label: "Fremont FY25/26 Budget" },
    ],
  },
};

// ---- CLI args ----------------------------------------------------------------
const args = process.argv.slice(2);
const cityKey = (args.find((a) => a.startsWith("--city="))?.split("=")[1] ?? "sunnyvale").toLowerCase();
const selectedCity = CITIES[cityKey];
if (!selectedCity) {
  console.error(`Unknown --city=${cityKey}. Known: ${Object.keys(CITIES).join(", ")}`);
  process.exit(1);
}
const KB = selectedCity.kb;
const CITY_CACHE_DIR = join(VISION_CACHE_DIR, cityKey);
const onlyVol = numArg("--vol");
const maxPages = numArg("--max-pages");

function numArg(flag: string): number | undefined {
  const hit = args.find((a) => a.startsWith(`${flag}=`));
  if (!hit) return undefined;
  const n = Number(hit.split("=")[1]);
  return Number.isFinite(n) ? n : undefined;
}

// ---- pdfjs (open the document once; reuse for text + rendering) ---------------
type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage>; cleanup: () => Promise<void> };
type PdfPage = {
  getTextContent: () => Promise<{ items: unknown[] }>;
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: Record<string, unknown>) => { promise: Promise<void> };
};

async function openPdf(bytes: Buffer): Promise<PdfDoc> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  (globalThis as Record<string, unknown>).pdfjsWorker = pdfjsWorker;
  return (await pdfjs.getDocument({
    data: new Uint8Array(bytes),
    standardFontDataUrl: STANDARD_FONTS,
  }).promise) as unknown as PdfDoc;
}

async function pageText(page: PdfPage): Promise<string> {
  const content = await page.getTextContent();
  return content.items
    .map((item) => (item as { str?: string }).str ?? "")
    .join(" ")
    .trim();
}

async function renderPageToImage(page: PdfPage, dpi = 150): Promise<string> {
  const viewport = page.getViewport({ scale: dpi / 72 });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx as never, viewport, canvas: canvas as never }).promise;
  return `data:image/png;base64,${canvas.toBuffer("image/png").toString("base64")}`;
}

// ---- Page classification: narrative vs table ---------------------------------
const TABLE_HEADINGS = [
  "appropriation",
  "fund summary",
  "financial plan",
  "schedule of",
  "revenues and expenditures",
  "budget summary",
  "expenditures by",
  "resource allocation",
  "twenty-year",
  "five-year",
];

function isTablePage(text: string): boolean {
  const lower = text.toLowerCase();
  if (TABLE_HEADINGS.some((h) => lower.includes(h))) return true;
  const numericTokens = (text.match(/\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?/g) ?? []).length;
  return numericTokens >= 8;
}

// ---- Vision: render a table page to clean markdown (cached) -------------------
const router = makeLlmRouter();

async function tablePageToMarkdown(page: PdfPage, vol: number, pageNum: number): Promise<string> {
  if (!existsSync(CITY_CACHE_DIR)) mkdirSync(CITY_CACHE_DIR, { recursive: true });
  const cachePath = join(CITY_CACHE_DIR, `vol${vol}-p${pageNum}.md`);
  if (existsSync(cachePath)) return readFileSync(cachePath, "utf8");

  const dataUrl = await renderPageToImage(page, 150);
  const res = await router.call({
    provider: "openai",
    model: VISION_MODEL,
    temperature: 0,
    maxTokens: 4096,
    messages: [
      {
        role: "system",
        content:
          "You convert a page from a government budget document into clean GitHub-flavored markdown. " +
          "Reproduce every table with its row labels and numbers EXACTLY as shown — preserve each value's " +
          "alignment with its label. Do not invent, round, or omit any values. Include any surrounding " +
          "narrative text. Return only the markdown, no commentary.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Convert this budget page to markdown, preserving all tables and numbers exactly." },
          { type: "image_url", image_url: { url: dataUrl } },
        ],
      },
    ],
  });

  const md = res.text.trim();
  writeFileSync(cachePath, md, "utf8");
  return md;
}

// ---- Chunking ----------------------------------------------------------------
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

async function chunkText(text: string): Promise<string[]> {
  const docs = await splitter.createDocuments([text]);
  return docs.map((d) => d.pageContent);
}

// ---- Ingest one volume -------------------------------------------------------
async function ingestVolume(systemUserId: string, vol: number, file: string, label: string): Promise<number> {
  const bytes = readFileSync(file);
  const doc = await openPdf(bytes);
  const lastPage = maxPages ? Math.min(maxPages, doc.numPages) : doc.numPages;
  console.log(`[${label}] ${doc.numPages} pages (ingesting ${lastPage})`);

  const records: Array<{ text: string; page: number }> = [];
  let visionOk = 0;
  let visionFail = 0;

  for (let p = 1; p <= lastPage; p++) {
    const page = await doc.getPage(p);
    const text = await pageText(page);
    const provenance = `[${label}, p.${p}]\n`;

    let body = text;
    if (isTablePage(text)) {
      try {
        const md = (await tablePageToMarkdown(page, vol, p)).trim();
        if (md) {
          body = md;
          visionOk++;
        }
      } catch (e) {
        visionFail++;
        console.warn(`  p.${p} vision failed (${(e as Error).message}) -> text fallback`);
      }
    }

    if (!body.trim()) continue;
    const pieces = body.length > MAX_CHUNK_CHARS ? await chunkText(body) : [body];
    for (const piece of pieces) records.push({ text: provenance + piece, page: p });
  }

  await doc.cleanup();

  if (records.length === 0) {
    console.log(`[${label}] no content extracted, skipping`);
    return 0;
  }

  console.log(`[${label}] vision ok=${visionOk} fail=${visionFail}; embedding ${records.length} chunks...`);
  const embeddings = await generateEmbeddings(records.map((r) => r.text));

  const chunks: DocumentChunk[] = records.map((r, i) => ({
    documentId: "",
    documentName: label,
    chunkIndex: i,
    text: r.text,
    embedding: embeddings[i]!,
    pageNumber: r.page,
  }));

  const processed: ProcessedDocument = {
    id: randomUUID(),
    name: label,
    pageCount: lastPage,
    chunks,
    uploadedAt: new Date().toISOString(),
  };

  await saveKbDocument(systemUserId, KB, processed, (i) => ({
    title: `${label}, p.${records[i]!.page}`,
    volume: vol,
    page: records[i]!.page,
  }));

  console.log(`[${label}] saved ${chunks.length} chunks`);
  return chunks.length;
}

// ---- Main --------------------------------------------------------------------
async function main() {
  // System user owns KB docs so FK constraints hold; it is never issued a session.
  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_EMAIL },
    update: {},
    create: {
      email: SYSTEM_EMAIL,
      passwordHash: "system-no-login",
      name: "GovDoc System",
      isAdmin: false,
      status: "ACTIVE",
    },
  });

  console.log(`Deleting existing "${KB}" documents (idempotent re-ingest)...`);
  await deleteKbDocuments(KB);

  let total = 0;
  for (const v of selectedCity.sources) {
    if (onlyVol && v.vol !== onlyVol) continue;
    total += await ingestVolume(systemUser.id, v.vol, v.file, v.label);
  }

  console.log(`Done. Ingested ${total} chunks into "${KB}".`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
