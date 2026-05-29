import { NextRequest } from "next/server";
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
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { question, chatHistory, conversationId } = body as {
    question: string;
    chatHistory: ChatMessage[];
    conversationId?: string;
  };

  if (!question) {
    return Response.json({ success: false, error: "Missing question" }, { status: 400 });
  }

  const userId = session.userId;

  // Search for relevant chunks scoped to this conversation
  const queryEmbedding = await embedQuery(question);
  const topChunks = await searchChunks(userId, queryEmbedding, 5, conversationId);

  // Build messages
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

  // Stream response
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send sources first if we have them
        if (hasDocContext) {
          const sources = topChunks.map((chunk) => ({
            documentName: chunk.documentName,
            chunkIndex: chunk.chunkIndex,
            score: chunk.score,
            excerpt: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? "..." : ""),
          }));
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`));
        }

        const response = await anthropic.messages.stream({
          model: "claude-sonnet-4-5-20250514",
          max_tokens: 4096,
          system: systemPrompt,
          messages,
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`));
          }
        }

        controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
