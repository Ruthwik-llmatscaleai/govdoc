import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID || "genai-poc-424806",
});

const DATASET_ID = "govdoc_chat";
const MESSAGES_TABLE = "chat_messages";
const DOCUMENTS_TABLE = "chat_documents";

let _initialized = false;
async function ensureTables() {
  if (_initialized) return;
  await initializeBigQueryTables();
  _initialized = true;
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

/**
 * Initialize BigQuery dataset and tables
 */
export async function initializeBigQueryTables() {
  const dataset = bigquery.dataset(DATASET_ID);

  // Create dataset if it doesn't exist
  const [datasetExists] = await dataset.exists();
  if (!datasetExists) {
    await bigquery.createDataset(DATASET_ID, {
      location: "US",
    });
  }

  // Create messages table (partitioned by date, clustered by userId)
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
      timePartitioning: {
        type: "DAY",
        field: "timestamp",
      },
      clustering: {
        fields: ["userId"],
      },
    });
  }

  // Create documents table (clustered by userId)
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
      clustering: {
        fields: ["userId"],
      },
    });
  }
}

/**
 * Save a chat message to BigQuery
 */
export async function saveChatMessage(message: ChatMessage): Promise<void> {
  await ensureTables();
  const dataset = bigquery.dataset(DATASET_ID);
  const table = dataset.table(MESSAGES_TABLE);

  await table.insert([
    {
      userId: message.userId,
      messageId: message.messageId,
      role: message.role,
      content: message.content,
      sources: message.sources ? JSON.stringify(message.sources) : null,
      timestamp: message.timestamp,
    },
  ]);
}

/**
 * Load chat history for a user (last 50 messages)
 */
export async function loadChatHistory(userId: string, limit: number = 50): Promise<ChatMessage[]> {
  await ensureTables();
  const query = `
    SELECT
      userId,
      messageId,
      role,
      content,
      sources,
      timestamp
    FROM \`${DATASET_ID}.${MESSAGES_TABLE}\`
    WHERE userId = @userId
    ORDER BY timestamp DESC
    LIMIT @limit
  `;

  const options = {
    query,
    params: { userId, limit },
  };

  const [rows] = await bigquery.query(options);

  return rows.map((row) => ({
    userId: row.userId,
    messageId: row.messageId,
    role: row.role,
    content: row.content,
    sources: row.sources ? JSON.parse(row.sources) : undefined,
    timestamp: row.timestamp.value,
  })).reverse(); // Reverse to get chronological order
}

/**
 * Save a processed document to BigQuery
 */
export async function saveDocument(document: StoredDocument): Promise<void> {
  await ensureTables();
  const dataset = bigquery.dataset(DATASET_ID);
  const table = dataset.table(DOCUMENTS_TABLE);

  await table.insert([
    {
      userId: document.userId,
      documentId: document.documentId,
      documentName: document.documentName,
      pageCount: document.pageCount,
      chunks: JSON.stringify(document.chunks),
      uploadedAt: document.uploadedAt,
    },
  ]);
}

/**
 * Load all documents for a user
 */
export async function loadDocuments(userId: string): Promise<StoredDocument[]> {
  await ensureTables();
  const query = `
    SELECT
      userId,
      documentId,
      documentName,
      pageCount,
      chunks,
      uploadedAt
    FROM \`${DATASET_ID}.${DOCUMENTS_TABLE}\`
    WHERE userId = @userId
    ORDER BY uploadedAt DESC
  `;

  const options = {
    query,
    params: { userId },
  };

  const [rows] = await bigquery.query(options);

  return rows.map((row) => ({
    userId: row.userId,
    documentId: row.documentId,
    documentName: row.documentName,
    pageCount: row.pageCount,
    chunks: JSON.parse(row.chunks),
    uploadedAt: row.uploadedAt.value,
  }));
}

/**
 * Get all chunks from all documents for a user
 */
export async function getAllChunks(userId: string): Promise<Array<{
  documentId: string;
  documentName: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
}>> {
  const documents = await loadDocuments(userId);

  const allChunks = documents.flatMap((doc) =>
    doc.chunks.map((chunk) => ({
      documentId: doc.documentId,
      documentName: doc.documentName,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      embedding: chunk.embedding,
    }))
  );

  return allChunks;
}

/**
 * Clear all data for a user
 */
export async function clearUserData(userId: string): Promise<void> {
  await ensureTables();
  await bigquery.query({
    query: `DELETE FROM \`${DATASET_ID}.${MESSAGES_TABLE}\` WHERE userId = @userId`,
    params: { userId },
  });

  // Delete documents
  await bigquery.query({
    query: `DELETE FROM \`${DATASET_ID}.${DOCUMENTS_TABLE}\` WHERE userId = @userId`,
    params: { userId },
  });
}
