import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID || "genai-poc-424806",
});

const DATASET_ID = "govdoc_chat";
const MESSAGES_TABLE = "chat_messages";

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
