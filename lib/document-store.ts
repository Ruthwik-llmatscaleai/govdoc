import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import type { ProcessedDocument, DocumentChunk } from "@/features/search-ask/documents";

export type ScoredChunk = DocumentChunk & { score: number };

export interface StoredDocumentMeta {
  id: string;
  name: string;
  pageCount: number;
  uploadedAt: string;
}

export async function saveDocument(
  userId: string,
  doc: ProcessedDocument,
  conversationId?: string,
): Promise<void> {
  const created = await prisma.document.create({
    data: {
      userId,
      name: doc.name,
      pageCount: doc.pageCount,
      status: "INDEXED",
      ...(conversationId ? { conversationId } : {}),
    },
  });
  for (const chunk of doc.chunks) {
    const vec = `[${chunk.embedding.join(",")}]`;
    await prisma.$executeRaw`
      INSERT INTO document_chunks (id, document_id, chunk_index, text, embedding, metadata, created_at)
      VALUES (${randomUUID()}, ${created.id}, ${chunk.chunkIndex}, ${chunk.text}, ${vec}::vector, '{}'::jsonb, now())`;
  }
}

export async function loadDocuments(
  userId: string,
  conversationId?: string,
): Promise<StoredDocumentMeta[]> {
  const docs = await prisma.document.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(conversationId ? { conversationId } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });
  return docs.map((d) => ({
    id: d.id,
    name: d.name,
    pageCount: d.pageCount ?? 0,
    uploadedAt: d.uploadedAt.toISOString(),
  }));
}

export async function searchChunks(
  userId: string,
  queryEmbedding: number[],
  k = 10,
  conversationId?: string,
): Promise<ScoredChunk[]> {
  const vec = `[${queryEmbedding.join(",")}]`;

  const rows = conversationId
    ? await prisma.$queryRawUnsafe<
        Array<{ document_id: string; document_name: string; chunk_index: number; text: string; score: number }>
      >(`
        SELECT dc.document_id, d.name AS document_name, dc.chunk_index, dc.text,
               1 - (dc.embedding <=> '${vec}'::vector) AS score
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE d.user_id = $1 AND d.deleted_at IS NULL AND d.conversation_id = $2
        ORDER BY dc.embedding <=> '${vec}'::vector
        LIMIT 30
      `, userId, conversationId)
    : await prisma.$queryRawUnsafe<
        Array<{ document_id: string; document_name: string; chunk_index: number; text: string; score: number }>
      >(`
        SELECT dc.document_id, d.name AS document_name, dc.chunk_index, dc.text,
               1 - (dc.embedding <=> '${vec}'::vector) AS score
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE d.user_id = $1 AND d.deleted_at IS NULL
        ORDER BY dc.embedding <=> '${vec}'::vector
        LIMIT 30
      `, userId);

  // Ensure at least 2 chunks per document, then fill remaining slots by score
  const byDoc = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!byDoc.has(r.document_id)) byDoc.set(r.document_id, []);
    byDoc.get(r.document_id)!.push(r);
  }

  const selected: typeof rows = [];
  // First pass: take top 2 from each document
  for (const chunks of byDoc.values()) {
    selected.push(...chunks.slice(0, 2));
  }
  // Second pass: fill to k from remaining by score
  const selectedSet = new Set(selected.map(r => `${r.document_id}-${r.chunk_index}`));
  for (const r of rows) {
    if (selected.length >= k) break;
    if (!selectedSet.has(`${r.document_id}-${r.chunk_index}`)) {
      selected.push(r);
      selectedSet.add(`${r.document_id}-${r.chunk_index}`);
    }
  }

  return selected.slice(0, k).map((r) => ({
    documentId: r.document_id,
    documentName: r.document_name,
    chunkIndex: r.chunk_index,
    text: r.text,
    embedding: [],
    score: Number(r.score),
  }));
}

export async function saveSpreadsheetDocument(
  userId: string,
  documentId: string,
  name: string,
  textContent: string,
  conversationId?: string,
): Promise<void> {
  await prisma.document.create({
    data: {
      userId,
      name,
      pageCount: 1,
      status: "SPREADSHEET",
      textContent,
      ...(conversationId ? { conversationId } : {}),
    },
  });
}

export async function loadSpreadsheetDocuments(
  userId: string,
  conversationId?: string,
): Promise<Array<{ id: string; name: string; textContent: string }>> {
  const docs = await prisma.document.findMany({
    where: {
      userId,
      deletedAt: null,
      status: "SPREADSHEET",
      ...(conversationId ? { conversationId } : {}),
    },
    orderBy: { uploadedAt: "desc" },
  });
  return docs
    .filter((d) => d.textContent)
    .map((d) => ({ id: d.id, name: d.name, textContent: d.textContent! }));
}

export async function clearUserDocuments(userId: string): Promise<void> {
  await prisma.document.deleteMany({ where: { userId } });
}
