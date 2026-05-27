import { randomUUID } from "node:crypto";
import { bq, bqDataset, bqFqn, bqTable } from "@/lib/bigquery";
import type { ChatMessage, Citation } from "./chat-service";

/** Wire shape of a row in `chat_messages`. */
interface MessageRow {
  message_id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[] | null;
  sources: Array<{ documentName: string }> | null;
  file_ids: Array<{ fileId: string; fileName: string }> | null;
  created_at: string; // ISO 8601
}

interface ConversationRow {
  conversation_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
}

export interface StoredConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  lastActivityAt: string;
}

export interface StoredConversation {
  id: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
  fileIds: Array<{ fileId: string; fileName: string }>;
}

/**
 * Insert a new conversation row. Conversations are created lazily on the
 * first user message — see appendMessage's ensureConversation flag.
 */
export async function createConversation(input: {
  conversationId: string;
  userId: string;
  title: string;
}): Promise<void> {
  const row: ConversationRow = {
    conversation_id: input.conversationId,
    user_id: input.userId,
    title: input.title.slice(0, 200),
    created_at: new Date().toISOString(),
  };
  await bq()
    .dataset(bqDataset())
    .table(bqTable("BIGQUERY_TABLE_CONVERSATIONS"))
    .insert([row]);
}

/** Append a message. Caller is responsible for createConversation on the first message. */
export async function appendMessage(input: {
  conversationId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  sources?: Array<{ documentName: string }>;
  fileIds?: Array<{ fileId: string; fileName: string }>;
}): Promise<string> {
  const messageId = randomUUID();
  const row: MessageRow = {
    message_id: messageId,
    conversation_id: input.conversationId,
    user_id: input.userId,
    role: input.role,
    content: input.content,
    citations: input.citations && input.citations.length > 0 ? input.citations : null,
    sources: input.sources && input.sources.length > 0 ? input.sources : null,
    file_ids: input.fileIds && input.fileIds.length > 0 ? input.fileIds : null,
    created_at: new Date().toISOString(),
  };
  await bq()
    .dataset(bqDataset())
    .table(bqTable("BIGQUERY_TABLE_MESSAGES"))
    .insert([row]);
  return messageId;
}

/**
 * List a user's conversations ordered by most-recent activity (last message
 * timestamp), capped at `limit`. Uses a single join+aggregation query.
 */
export async function listConversations(
  userId: string,
  limit = 50,
): Promise<StoredConversationSummary[]> {
  const sql = `
    SELECT
      c.conversation_id AS id,
      c.title AS title,
      c.created_at AS created_at,
      COALESCE(MAX(m.created_at), c.created_at) AS last_activity_at
    FROM ${bqFqn("BIGQUERY_TABLE_CONVERSATIONS")} c
    LEFT JOIN ${bqFqn("BIGQUERY_TABLE_MESSAGES")} m
      ON m.conversation_id = c.conversation_id AND m.user_id = c.user_id
    WHERE c.user_id = @user_id
    GROUP BY c.conversation_id, c.title, c.created_at
    ORDER BY last_activity_at DESC
    LIMIT @lim
  `;
  const result = (await bq().query({
    query: sql,
    params: { user_id: userId, lim: limit },
  })) as unknown as [
    Array<{
      id: string;
      title: string | null;
      created_at: { value: string };
      last_activity_at: { value: string };
    }>,
    unknown,
  ];
  const rows = result[0];
  return rows.map((r) => ({
    id: r.id,
    title: r.title ?? "(untitled)",
    createdAt: r.created_at.value,
    lastActivityAt: r.last_activity_at.value,
  }));
}

/**
 * Load a single conversation's messages in chronological order, plus the
 * union of `file_ids` referenced on any user message (so the client can
 * restore attached-document chips when resuming a thread).
 */
export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<StoredConversation | null> {
  const convSql = `
    SELECT conversation_id, title, created_at
    FROM ${bqFqn("BIGQUERY_TABLE_CONVERSATIONS")}
    WHERE conversation_id = @cid AND user_id = @uid
    LIMIT 1
  `;
  const convResult = (await bq().query({
    query: convSql,
    params: { cid: conversationId, uid: userId },
  })) as unknown as [
    Array<{
      conversation_id: string;
      title: string | null;
      created_at: { value: string };
    }>,
    unknown,
  ];
  const convRows = convResult[0];
  if (convRows.length === 0) return null;
  const conv = convRows[0]!;

  const msgSql = `
    SELECT role, content, citations, sources, file_ids, created_at
    FROM ${bqFqn("BIGQUERY_TABLE_MESSAGES")}
    WHERE conversation_id = @cid AND user_id = @uid
    ORDER BY created_at ASC
  `;
  const msgResult = (await bq().query({
    query: msgSql,
    params: { cid: conversationId, uid: userId },
  })) as unknown as [
    Array<{
      role: "user" | "assistant";
      content: string;
      citations: string | null;
      sources: string | null;
      file_ids: string | null;
      created_at: { value: string };
    }>,
    unknown,
  ];
  const msgRows = msgResult[0];

  const messages: ChatMessage[] = [];
  const fileIdMap = new Map<string, string>();
  for (const m of msgRows) {
    const citations = parseJsonOrNull<Citation[]>(m.citations) ?? undefined;
    const sources = parseJsonOrNull<Array<{ documentName: string }>>(m.sources) ?? undefined;
    const fileIds = parseJsonOrNull<Array<{ fileId: string; fileName: string }>>(m.file_ids);
    if (fileIds) {
      for (const f of fileIds) fileIdMap.set(f.fileId, f.fileName);
    }
    messages.push({
      role: m.role,
      content: m.content,
      citations: citations && citations.length > 0 ? citations : undefined,
      sources: sources && sources.length > 0 ? sources : undefined,
      timestamp: m.created_at.value,
    });
  }
  return {
    id: conv.conversation_id,
    title: conv.title ?? "(untitled)",
    createdAt: conv.created_at.value,
    messages,
    fileIds: Array.from(fileIdMap.entries()).map(([fileId, fileName]) => ({ fileId, fileName })),
  };
}

function parseJsonOrNull<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
