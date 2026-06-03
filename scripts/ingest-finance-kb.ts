#!/usr/bin/env npx tsx
/**
 * Ingest the Sunnyvale FY 2025/26 Adopted Budget PDFs into the curated
 * "sunnyvale-finance" Knowledge Base that the chat answers finance questions from.
 *
 * Narrative pages are extracted as text; table-heavy pages are rendered to images
 * and converted to clean markdown by a vision model (plain text extraction
 * scrambles budget tables — numbers misalign from their labels). Every chunk
 * carries its volume + page so answers can cite the source.
 *
 * Idempotent: deletes the existing KB docs before re-ingesting. Vision output is
 * cached per page under finance/.vision-cache so re-runs don't re-pay.
 *
 * Usage:
 *   npx tsx scripts/ingest-finance-kb.ts                 # both volumes, all pages
 *   npx tsx scripts/ingest-finance-kb.ts --vol=1         # only volume 1
 *   npx tsx scripts/ingest-finance-kb.ts --max-pages=40  # first N pages (quick test)
 *
 * Requires in the shell env: DATABASE_URL, OPENAI_API_KEY.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { prisma } from "@/lib/db";
import { generateEmbeddings } from "@/features/search-ask/documents";
import type { DocumentChunk, ProcessedDocument } from "@/features/search-ask/documents";
import { saveKbDocument, deleteKbDocuments } from "@/lib/document-store";
import { renderPdfPagesAsImages } from "@/features/usecases/row-appraisal/vision/render-pdf";
import { makeLlmRouter } from "@/lib/llm/router";

const KB = "sunnyvale-finance";
const SYSTEM_EMAIL = "system@govdoc.local";
const VISION_MODEL = "gpt-4o";
const VISION_CACHE_DIR = join("finance", ".vision-cache");
const MAX_CHUNK_CHARS = 6000;

const VOLUMES = [
  { vol: 1, file: "finance/FY 202526 Adopted Budget Volume 1  Summary and Operating Budget.pdf", label: "FY25/26 Budget Vol 1" },
  { vol: 2, file: "finance/FY 202526 Adopted Budget Volume 2  Projects Budget.pdf", label: "FY25/26 Budget Vol 2" },
];

// ---- CLI args ----------------------------------------------------------------
const args = process.argv.slice(2);
const onlyVol = numArg("--vol");
const maxPages = numArg("--max-pages");

function numArg(flag: string): number | undefined {
  const hit = args.find((a) => a.startsWith(`${flag}=`));
  if (!hit) return undefined;
  const n = Number(hit.split("=")[1]);
  return Number.isFinite(n) ? n : undefined;
}

// ---- PDF text extraction (per page, mirrors features/search-ask/documents.ts) -
async function extractPages(pdfBuffer: Buffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  (globalThis as Record<string, unknown>).pdfjsWorker = pdfjsWorker;

  const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item: unknown) => (item as { str?: string }).str ?? "")
        .join(" ")
        .trim(),
    );
  }
  await doc.cleanup();
  return pages;
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
  // Count currency / large-number tokens (e.g. "$1,234,567" or "12,345").
  const numericTokens = (text.match(/\$?\d{1,3}(?:,\d{3})+(?:\.\d+)?/g) ?? []).length;
  return numericTokens >= 8;
}

// ---- Vision: render a table page to clean markdown (cached) -------------------
const router = makeLlmRouter();

async function tablePageToMarkdown(pdfBytes: Buffer, vol: number, page: number): Promise<string> {
  if (!existsSync(VISION_CACHE_DIR)) mkdirSync(VISION_CACHE_DIR, { recursive: true });
  const cachePath = join(VISION_CACHE_DIR, `vol${vol}-p${page}.md`);
  if (existsSync(cachePath)) return readFileSync(cachePath, "utf8");

  const [dataUrl] = await renderPdfPagesAsImages(pdfBytes, [page, page], 150);
  if (!dataUrl) return "";

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

async function chunkPage(text: string): Promise<string[]> {
  const docs = await splitter.createDocuments([text]);
  return docs.map((d) => d.pageContent);
}

// ---- Ingest one volume -------------------------------------------------------
async function ingestVolume(systemUserId: string, vol: number, file: string, label: string): Promise<number> {
  const bytes = readFileSync(file);
  const pages = await extractPages(bytes);
  const lastPage = maxPages ? Math.min(maxPages, pages.length) : pages.length;
  console.log(`[${label}] ${pages.length} pages (ingesting ${lastPage})`);

  const records: Array<{ text: string; page: number }> = [];

  for (let p = 1; p <= lastPage; p++) {
    const pageText = pages[p - 1] ?? "";
    const provenance = `[${label}, p.${p}]\n`;

    if (isTablePage(pageText)) {
      const md = await tablePageToMarkdown(bytes, vol, p);
      const body = md.trim() || pageText; // fall back to raw text if vision returned nothing
      const pieces = body.length > MAX_CHUNK_CHARS ? await chunkPage(body) : [body];
      for (const piece of pieces) records.push({ text: provenance + piece, page: p });
      console.log(`  p.${p} table -> ${pieces.length} chunk(s)`);
    } else {
      if (!pageText.trim()) continue;
      const pieces = await chunkPage(pageText);
      for (const piece of pieces) records.push({ text: provenance + piece, page: p });
    }
  }

  if (records.length === 0) {
    console.log(`[${label}] no content extracted, skipping`);
    return 0;
  }

  console.log(`[${label}] embedding ${records.length} chunks...`);
  const embeddings = await generateEmbeddings(records.map((r) => r.text));

  const chunks: DocumentChunk[] = records.map((r, i) => ({
    documentId: "",
    documentName: label,
    chunkIndex: i,
    text: r.text,
    embedding: embeddings[i]!,
    pageNumber: r.page,
  }));

  const doc: ProcessedDocument = {
    id: randomUUID(),
    name: label,
    pageCount: pages.length,
    chunks,
    uploadedAt: new Date().toISOString(),
  };

  await saveKbDocument(systemUserId, KB, doc, (i) => ({
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
  for (const v of VOLUMES) {
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
