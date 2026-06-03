import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage } from "@/features/search-ask/service";
import { embedQuery } from "@/features/search-ask/documents";
import { searchChunks, searchKbChunks, loadSpreadsheetDocuments } from "@/lib/document-store";
import { detectFinanceIntent } from "@/features/search-ask/finance-intent";
import { getRequestSession } from "@/lib/auth/require-user";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

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

  const userId = session.user;

  try {
    const queryEmbedding = await embedQuery(question);

    // Route Sunnyvale city finance questions to the curated Finance Knowledge Base.
    // If the KB has no match (e.g. before ingestion has run), fall through to the
    // normal per-user document path so existing behavior is never broken.
    const isFinance = detectFinanceIntent(question, queryEmbedding);
    const kbChunks = isFinance ? await searchKbChunks("sunnyvale-finance", queryEmbedding, 8) : [];
    const useFinanceKb = kbChunks.length > 0;

    const topChunks = useFinanceKb
      ? kbChunks
      : await searchChunks(userId, queryEmbedding, 5, conversationId);
    const spreadsheets = useFinanceKb ? [] : await loadSpreadsheetDocuments(userId, conversationId);

    const messages: Array<{ role: "user" | "assistant"; content: string | Anthropic.Messages.ContentBlockParam[] }> = [
      ...chatHistory.slice(-10).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const hasDocContext = topChunks.length > 0;
    const hasSpreadsheets = spreadsheets.length > 0;

    // Build the user message content blocks
    const userContent: Anthropic.Messages.ContentBlockParam[] = [];

    // Add spreadsheet documents as document blocks with citations enabled
    for (const sheet of spreadsheets) {
      userContent.push({
        type: "document",
        source: { type: "text", media_type: "text/plain", data: sheet.textContent },
        title: sheet.name,
        citations: { enabled: true },
      } as Anthropic.Messages.DocumentBlockParam);
    }

    // Add RAG chunks as individual document blocks with citations enabled
    if (hasDocContext) {
      for (const chunk of topChunks) {
        userContent.push({
          type: "document",
          source: { type: "text", media_type: "text/plain", data: chunk.text },
          title: `${chunk.documentName} (Section ${chunk.chunkIndex + 1})`,
          citations: { enabled: true },
        } as Anthropic.Messages.DocumentBlockParam);
      }
    }

    userContent.push({ type: "text", text: question });

    messages.push({ role: "user" as const, content: userContent });

    const systemPrompt = useFinanceKb
      ? "You answer questions about the City of Sunnyvale FY 2025/26 Adopted Budget using ONLY the provided budget excerpts. Always cite the volume and page that figures come from. If the excerpts do not contain the answer, say so plainly rather than guessing. Be concise and accurate. Never use emojis in your responses."
      : hasDocContext || hasSpreadsheets
      ? "You are a helpful assistant that answers questions based on the provided document context. For spreadsheet/CSV data, you can analyze, summarize, find patterns, and answer specific questions about the data. Be concise and accurate. Never use emojis in your responses."
      : "You are GovDoc, an AI assistant for government document review. You can answer general questions, greet users, and help them understand how to use the system. When no documents are uploaded, let the user know they can upload PDF, DOCX, CSV, or Excel files to ask questions about their contents. Be friendly and concise. Never use emojis in your responses.";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    // Extract text and citations from response
    let answerText = "";
    const citations: Array<{ documentName: string; excerpt: string }> = [];

    for (const block of response.content) {
      if (block.type === "text") {
        answerText += block.text;
        // Extract inline citations if present
        if ("citations" in block && Array.isArray((block as any).citations)) {
          for (const cite of (block as any).citations) {
            if (cite.type === "document" && cite.document_title && cite.cited_text) {
              citations.push({
                documentName: cite.document_title,
                excerpt: cite.cited_text.slice(0, 300),
              });
            }
          }
        }
      }
    }

    // Build sources from citations (deduplicated) or fall back to RAG chunks
    const seen = new Set<string>();
    const sources = citations.length > 0
      ? citations.filter((c) => {
          const key = `${c.documentName}::${c.excerpt.slice(0, 50)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).map((c) => ({
          documentName: c.documentName,
          chunkIndex: 0,
          score: 1,
          excerpt: c.excerpt,
        }))
      : hasDocContext
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
