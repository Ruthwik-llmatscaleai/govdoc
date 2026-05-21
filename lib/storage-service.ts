import type { ProcessedDocument } from "./document-service";
import type { ChatMessage } from "./chat-service";

const STORAGE_KEYS = {
  DOCUMENTS: "govdoc_documents",
  CHAT_HISTORY: "govdoc_chat_history",
} as const;

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Save documents to localStorage
 */
export function saveDocuments(documents: ProcessedDocument[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
}

/**
 * Load documents from localStorage
 */
export function loadDocuments(): ProcessedDocument[] {
  if (!isBrowser()) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get all chunks from all documents
 */
export function getAllChunks(): Array<ProcessedDocument["chunks"][number]> {
  const documents = loadDocuments();
  return documents.flatMap((doc) => doc.chunks);
}

/**
 * Save chat history to localStorage
 */
export function saveChatHistory(history: ChatMessage[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(history));
}

/**
 * Load chat history from localStorage
 */
export function loadChatHistory(): ChatMessage[] {
  if (!isBrowser()) return [];
  const stored = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear all data from localStorage
 */
export function clearAllData(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.DOCUMENTS);
  localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
}
