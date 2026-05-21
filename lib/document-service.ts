import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleAuth } from "google-auth-library";

const GCP_PROJECT = process.env.GCP_PROJECT_ID || "genai-poc-424806";
const GCP_LOCATION = "us-central1";
const EMBEDDING_MODEL = "text-embedding-005";

const auth = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });

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
 * Call Google Vertex AI text-embedding-005
 */
async function callGoogleEmbeddings(texts: string[], taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<number[][]> {
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  const url = `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}/locations/${GCP_LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

  const instances = texts.map((text) => ({ content: text, task_type: taskType }));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token.token}`,
    },
    body: JSON.stringify({ instances }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Embeddings API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.predictions.map((p: { embeddings: { values: number[] } }) => p.embeddings.values);
}

/**
 * Generate embeddings for text chunks — batched (max 250 per request for Google)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const BATCH_SIZE = 50;
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`[embed] Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(texts.length / BATCH_SIZE)} (${batch.length} chunks)`);
    const embeddings = await callGoogleEmbeddings(batch, "RETRIEVAL_DOCUMENT");
    results.push(...embeddings);
  }
  return results;
}

/**
 * Generate query embedding
 */
export async function embedQuery(query: string): Promise<number[]> {
  const embeddings = await callGoogleEmbeddings([query], "RETRIEVAL_QUERY");
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
