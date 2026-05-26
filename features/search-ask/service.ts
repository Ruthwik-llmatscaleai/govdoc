import Anthropic from "@anthropic-ai/sdk";
import { embedQuery, findTopKChunks, type DocumentChunk } from "./documents";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ChatMessage {
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

/**
 * Answer a question using semantic search and Claude
 */
export async function answerQuestion(
  question: string,
  allChunks: DocumentChunk[],
  chatHistory: ChatMessage[] = []
): Promise<ChatMessage> {
  // Generate query embedding
  const queryEmbedding = await embedQuery(question);

  // Find top 5 most relevant chunks
  const topChunks = findTopKChunks(queryEmbedding, allChunks, 5);

  // Build context from retrieved chunks
  const context = topChunks
    .map((chunk) => `[Document: ${chunk.documentName}, Chunk ${chunk.chunkIndex + 1}]\n${chunk.text}`)
    .join("\n\n");

  // Build conversation history for Claude
  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...chatHistory.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: "user" as const,
      content: `Context from uploaded documents:\n\n${context}\n\nQuestion: ${question}`,
    },
  ];

  // Call Claude with adaptive thinking
  const response = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 4096,
    thinking: {
      type: "adaptive",
      display: "omitted",
    },
    system:
      "You are a helpful assistant that answers questions based on the provided document context. Only answer based on the information in the context. If the answer is not in the context, say so clearly. Be concise and accurate.",
    messages,
  });

  const answerText = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n");

  return {
    role: "assistant",
    content: answerText,
    sources: topChunks.map((chunk) => ({
      documentName: chunk.documentName,
      chunkIndex: chunk.chunkIndex,
      score: chunk.score,
      excerpt: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? "..." : ""),
    })),
    timestamp: new Date().toISOString(),
  };
}
