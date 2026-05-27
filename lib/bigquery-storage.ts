import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID || "genai-poc-424806",
});

const DATASET_ID = "govdoc_chat";
const MESSAGES_TABLE = "chat_messages";
const DOCUMENTS_TABLE = "chat_documents";

let _initialized = false;
let _initPromise: Promise<void> | null = null;

async function ensureTables() {
  if (_initialized) return;
  if (!_initPromise) {
    _initPromise = initializeBigQueryTables().then(() => {
      _initialized = true;
    });
  }
  await _initPromise;
}

export interface ChatMessage {
  userId: string;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    documentName: string;
    chunkIndex: number;
    score: number;
    excerpt: string;
  }>;
  timestamp: string;
}

export interface StoredDocument {
  userId: string;
  documentId: string;
  documentName: string;
  pageCount: number;
  chunks: Array<{
    chunkIndex: number;
    text: string;
    embedding: number[];
  }>;
  uploadedAt: string;
}

async function initializeBigQueryTables() {
  const dataset = bigquery.dataset(DATASET_ID);

  const [datasetExists] = await dataset.exists();
  if (!datasetExists) {
    await bigquery.createDataset(DATASET_ID, { location: "US" });
  }

  const messagesTable = dataset.table(MESSAGES_TABLE);
  const [messagesExists] = await messagesTable.exists();
  if (!messagesExists) {
    await dataset.createTable(MESSAGES_TABLE, {
      schema: [
        { name: "userId", type: "STRING", mode: "REQUIRED" },
        { name: "messageId", type: "STRING", mode: "REQUIRED" },
        { name: "role", type: "STRING", mode: "REQUIRED" },
        { name: "content", type: "STRING", mode: "REQUIRED" },
        { name: "sources", type: "JSON", mode: "NULLABLE" },
        { name: "timestamp", type: "TIMESTAMP", mode: "REQUIRED" },
      ],
      timePartitioning: { type: "DAY", field: "timestamp" },
      clustering: { fields: ["userId"] },
    });
  }

  const documentsTable = dataset.table(DOCUMENTS_TABLE);
  const [documentsExists] = await documentsTable.exists();
  if (!documentsExists) {
    await dataset.createTable(DOCUMENTS_TABLE, {
      schema: [
        { name: "userId", type: "STRING", mode: "REQUIRED" },
        { name: "documentId", type: "STRING", mode: "REQUIRED" },
        { name: "documentName", type: "STRING", mode: "REQUIRED" },
        { name: "pageCount", type: "INT64", mode: "REQUIRED" },
        { name: "chunks", type: "JSON", mode: "REQUIRED" },
        { name: "uploadedAt", type: "TIMESTAMP", mode: "REQUIRED" },
      ],
      clustering: { fields: ["userId"] },
    });
  }
}

export async function saveChatMessage(message: ChatMessage): Promise<void> {
  await ensureTables();
  const table = bigquery.dataset(DATASET_ID).table(MESSAGES_TABLE);
  await table.insert([{
    userId: message.userId,
    messageId: message.messageId,
    role: message.role,
    content: message.content,
    sources: message.sources ? JSON.stringify(message.sources) : null,
    timestamp: message.timestamp,
  }]);
}

export async function loadChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
  await ensureTables();
  const [rows] = await bigquery.query({
    query: `
      SELECT userId, messageId, role, content, sources, timestamp
      FROM \`${DATASET_ID}.${MESSAGES_TABLE}\`
      WHERE userId = @userId
      ORDER BY timestamp DESC
      LIMIT @limit
    `,
    params: { userId, limit },
  });

  return rows.map((row: Record<string, unknown>) => ({
    userId: row.userId as string,
    messageId: row.messageId as string,
    role: row.role as "user" | "assistant",
    content: row.content as string,
    sources: row.sources ? JSON.parse(row.sources as string) : undefined,
    timestamp: (row.timestamp as { value: string }).value,
  })).reverse();
}

export async function clearChatHistory(userId: string): Promise<void> {
  await ensureTables();
  await bigquery.query({
    query: `DELETE FROM \`${DATASET_ID}.${MESSAGES_TABLE}\` WHERE userId = @userId`,
    params: { userId },
  });
}

export async function saveDocument(document: StoredDocument): Promise<void> {
  await ensureTables();
  const table = bigquery.dataset(DATASET_ID).table(DOCUMENTS_TABLE);
  await table.insert([{
    userId: document.userId,
    documentId: document.documentId,
    documentName: document.documentName,
    pageCount: document.pageCount,
    chunks: JSON.stringify(document.chunks),
    uploadedAt: document.uploadedAt,
  }]);
}

export async function loadDocuments(userId: string): Promise<StoredDocument[]> {
  await ensureTables();
  const [rows] = await bigquery.query({
    query: `
      SELECT userId, documentId, documentName, pageCount, chunks, uploadedAt
      FROM \`${DATASET_ID}.${DOCUMENTS_TABLE}\`
      WHERE userId = @userId
      ORDER BY uploadedAt DESC
    `,
    params: { userId },
  });

  return rows.map((row: Record<string, unknown>) => ({
    userId: row.userId as string,
    documentId: row.documentId as string,
    documentName: row.documentName as string,
    pageCount: row.pageCount as number,
    chunks: JSON.parse(row.chunks as string),
    uploadedAt: (row.uploadedAt as { value: string }).value,
  }));
}

export async function getAllChunks(userId: string): Promise<Array<{
  documentId: string;
  documentName: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
}>> {
  const documents = await loadDocuments(userId);
  return documents.flatMap((doc) =>
    doc.chunks.map((chunk) => ({
      documentId: doc.documentId,
      documentName: doc.documentName,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      embedding: chunk.embedding,
    }))
  );
}

export async function clearUserData(userId: string): Promise<void> {
  await ensureTables();
  await bigquery.query({
    query: `DELETE FROM \`${DATASET_ID}.${MESSAGES_TABLE}\` WHERE userId = @userId`,
    params: { userId },
  });
  await bigquery.query({
    query: `DELETE FROM \`${DATASET_ID}.${DOCUMENTS_TABLE}\` WHERE userId = @userId`,
    params: { userId },
  });
}
