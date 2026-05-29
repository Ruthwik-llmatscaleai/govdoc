import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIM = 1536;

export interface DocumentChunk {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  pageNumber?: number;
}

export interface ProcessedDocument {
  id: string;
  name: string;
  pageCount: number;
  chunks: DocumentChunk[];
  uploadedAt: string;
}

/**
 * Extract text from PDF buffer
 */
async function extractTextFromPDF(pdfBuffer: Buffer): Promise<{ text: string; pageCount: number }> {
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
        .map((item: { str?: string }) => item.str ?? "")
        .join(" ")
        .trim(),
    );
  }
  return {
    text: pages.join("\n\n"),
    pageCount: doc.numPages,
  };
}

/**
 * Extract text from DOC buffer (legacy binary OLE2 format)
 */
async function extractTextFromDOC(docBuffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const WordExtractor = require("word-extractor");
  const extractor = new WordExtractor();
  const doc = await extractor.extract(docBuffer);
  const text: string = doc.getBody();
  if (!text.trim()) {
    throw new Error("Document appears to be empty or could not extract text.");
  }
  const pageCount = Math.max(1, Math.ceil(text.length / 3000));
  return { text, pageCount };
}

/**
 * Extract text from DOCX buffer
 */
async function extractTextFromDOCX(docxBuffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const mammoth = require("mammoth");
  // Verify it's actually a ZIP-based DOCX (starts with PK magic bytes)
  if (docxBuffer.length < 4 || docxBuffer[0] !== 0x50 || docxBuffer[1] !== 0x4B) {
    throw new Error("File is not a valid DOCX format. Please upload a .docx file (Word 2007+), not a .doc file.");
  }
  const result = await mammoth.extractRawText({ buffer: docxBuffer });
  const text: string = result.value;
  if (!text.trim()) {
    throw new Error("Document appears to be empty or could not extract text.");
  }
  const pageCount = Math.max(1, Math.ceil(text.length / 3000));
  return { text, pageCount };
}

/**
 * Split text into chunks using LangChain's RecursiveCharacterTextSplitter
 */
async function chunkText(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await splitter.createDocuments([text]);
  return docs.map((doc) => doc.pageContent);
}

/**
 * Call the OpenAI embeddings API (text-embedding-3-small, 1536-dim).
 */
async function callOpenAiEmbeddings(texts: string[]): Promise<number[][]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI Embeddings API error: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { data: { embedding: number[]; index: number }[] };
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/**
 * Generate embeddings for text chunks — batched.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 100;
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`[embed] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} chunks)`);
    results.push(...(await callOpenAiEmbeddings(batch)));
  }
  return results;
}

/**
 * Generate a single query embedding.
 */
export async function embedQuery(query: string): Promise<number[]> {
  const embeddings = await callOpenAiEmbeddings([query]);
  return embeddings[0]!;
}

/**
 * Main function to process a PDF document
 */
export async function processPDFDocument(
  pdfBuffer: Buffer,
  documentId: string,
  documentName: string
): Promise<ProcessedDocument> {
  const { text, pageCount } = await extractTextFromPDF(pdfBuffer);
  return buildProcessedDocument(text, pageCount, documentId, documentName);
}

/**
 * Main function to process a DOCX document
 */
export async function processDOCXDocument(
  docxBuffer: Buffer,
  documentId: string,
  documentName: string
): Promise<ProcessedDocument> {
  const { text, pageCount } = await extractTextFromDOCX(docxBuffer);
  return buildProcessedDocument(text, pageCount, documentId, documentName);
}

/**
 * Main function to process a DOC document (legacy binary format)
 */
export async function processDOCDocument(
  docBuffer: Buffer,
  documentId: string,
  documentName: string
): Promise<ProcessedDocument> {
  const { text, pageCount } = await extractTextFromDOC(docBuffer);
  return buildProcessedDocument(text, pageCount, documentId, documentName);
}

async function buildProcessedDocument(
  text: string,
  pageCount: number,
  documentId: string,
  documentName: string
): Promise<ProcessedDocument> {
  const textChunks = await chunkText(text);
  const embeddings = await generateEmbeddings(textChunks);

  const chunks: DocumentChunk[] = textChunks.map((text, index) => ({
    documentId,
    documentName,
    chunkIndex: index,
    text,
    embedding: embeddings[index]!,
  }));

  return {
    id: documentId,
    name: documentName,
    pageCount,
    chunks,
    uploadedAt: new Date().toISOString(),
  };
}
