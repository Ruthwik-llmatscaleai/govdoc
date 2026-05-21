import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";
const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY!;

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
  const pdfParse = require("pdf-parse").PDFParse;
  const data = await pdfParse(pdfBuffer);
  return {
    text: data.text,
    pageCount: data.numpages,
  };
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
 * Call Voyage AI REST API for embeddings
 */
async function callVoyageAPI(input: string[], inputType: "document" | "query"): Promise<number[][]> {
  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(VOYAGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input,
        model: "voyage-2",
        input_type: inputType,
      }),
    });

    if (response.status === 429 && attempt < maxRetries) {
      const wait = Math.pow(2, attempt + 1) * 1000;
      console.log(`[voyage] Rate limited, retrying in ${wait}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  }
  throw new Error("Voyage AI API: max retries exceeded");
}

/**
 * Generate embeddings for text chunks using Voyage AI — batched to avoid rate limits
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 8;
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`[voyage] Embedding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} chunks)`);
    const embeddings = await callVoyageAPI(batch, "document");
    results.push(...embeddings);
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }
  return results;
}

/**
 * Generate query embedding using Voyage AI
 */
export async function embedQuery(query: string): Promise<number[]> {
  const embeddings = await callVoyageAPI([query], "query");
  return embeddings[0]!;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Find top K most relevant chunks based on cosine similarity
 */
export function findTopKChunks(
  queryEmbedding: number[],
  allChunks: DocumentChunk[],
  k: number = 5
): Array<DocumentChunk & { score: number }> {
  const chunksWithScores = allChunks.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  chunksWithScores.sort((a, b) => b.score - a.score);
  return chunksWithScores.slice(0, k);
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
