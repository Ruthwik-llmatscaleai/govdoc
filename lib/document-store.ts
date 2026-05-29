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
      conversationId: conversationId ?? null,
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
  k = 5,
  conversationId?: string,
): Promise<ScoredChunk[]> {
  const vec = `[${queryEmbedding.join(",")}]`;

  // If conversationId is provided, only search docs in that conversation
  const convFilter = conversationId
    ? `AND d.conversation_id = '${conversationId}'`
    : "";

  const rows = await prisma.$queryRawUnsafe<
    Array<{ document_id: string; document_name: string; chunk_index: number; text: string; score: number }>
  >(`
    SELECT dc.document_id, d.name AS document_name, dc.chunk_index, dc.text,
           1 - (dc.embedding <=> '${vec}'::vector) AS score
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE d.user_id = $1 AND d.deleted_at IS NULL ${convFilter}
    ORDER BY dc.embedding <=> '${vec}'::vector
    LIMIT ${k}
  `, userId);

  return rows.map((r) => ({
    documentId: r.document_id,
    documentName: r.document_name,
    chunkIndex: r.chunk_index,
    text: r.text,
    embedding: [],
    score: Number(r.score),
  }));
}

export async function clearUserDocuments(userId: string): Promise<void> {
  await prisma.document.deleteMany({ where: { userId } });
}
