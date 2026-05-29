import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage } from "@/features/search-ask/service";
import { embedQuery } from "@/features/search-ask/documents";
import { searchChunks } from "@/lib/document-store";
import { getRequestSession } from "@/lib/auth/require-user";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { question, chatHistory, conversationId } = body as {
    question: string;
    chatHistory: ChatMessage[];
    conversationId?: string;
  };

  if (!question) {
    return NextResponse.json({ success: false, error: "Missing question" }, { status: 400 });
  }

  const userId = session.userId;

  try {
    const queryEmbedding = await embedQuery(question);
    const topChunks = await searchChunks(userId, queryEmbedding, 5, conversationId);

    const messages: Array<{ role: "user" | "assistant"; content: string }> = [
      ...chatHistory.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const hasDocContext = topChunks.length > 0;
    if (hasDocContext) {
      const context = topChunks
        .map((chunk) => `[Document: ${chunk.documentName}, Chunk ${chunk.chunkIndex + 1}]\n${chunk.text}`)
        .join("\n\n");
      messages.push({
        role: "user" as const,
        content: `Context from uploaded documents:\n\n${context}\n\nQuestion: ${question}`,
      });
    } else {
      messages.push({ role: "user" as const, content: question });
    }

    const systemPrompt = hasDocContext
      ? "You are a helpful assistant that answers questions based on the provided document context. Only answer based on the information in the context. If the answer is not in the context, say so clearly. Be concise and accurate."
      : "You are GovDoc, an AI assistant for government document review. You can answer general questions, greet users, and help them understand how to use the system. When no documents are uploaded, let the user know they can upload PDF or DOCX files to ask questions about their contents. Be friendly and concise.";

    const response = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    const answerText = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("\n");

    const sources = hasDocContext
      ? topChunks.map((chunk) => ({
          documentName: chunk.documentName,
          chunkIndex: chunk.chunkIndex,
          score: chunk.score,
          excerpt: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? "..." : ""),
        }))
      : undefined;

    const answer: ChatMessage = {
      role: "assistant",
      content: answerText,
      sources,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error("[chat] Error:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Chat request failed" },
      { status: 500 },
    );
  }
}
