import { VoyageAIClient } from "voyageai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const voyage = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY!,
});

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
 * Generate embeddings for text chunks using Voyage AI
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await voyage.embed({
    input: texts,
    model: "voyage-2",
    inputType: "document", // Use 'document' for storing, 'query' for searching
  });

  if (!response.data || response.data.length === 0) {
    throw new Error("No embeddings returned from Voyage AI");
  }

  return response.data.map((item) => {
    if (!item.embedding) {
      throw new Error("Missing embedding in response");
    }
    return item.embedding;
  });
}

/**
 * Generate query embedding using Voyage AI
 */
export async function embedQuery(query: string): Promise<number[]> {
  const response = await voyage.embed({
    input: [query],
    model: "voyage-2",
    inputType: "query",
  });

  if (!response.data?.[0]?.embedding) {
    throw new Error("No embedding returned from Voyage AI");
  }

  return response.data[0].embedding;
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
  // Extract text from PDF
  const { text, pageCount } = await extractTextFromPDF(pdfBuffer);

  // Chunk the text
  const textChunks = await chunkText(text);

  // Generate embeddings for all chunks
  const embeddings = await generateEmbeddings(textChunks);

  // Create document chunks
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
