import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/features/search-ask/service";
import type { ChatMessage } from "@/features/search-ask/service";
import { embedQuery } from "@/features/search-ask/documents";
import { searchChunks } from "@/lib/document-store";
import { getRequestSession } from "@/lib/auth/require-user";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { question, chatHistory } = body as { question: string; chatHistory: ChatMessage[] };

    if (!question) {
      return NextResponse.json({ success: false, error: "Missing question" }, { status: 400 });
    }

    const userId = session.userId;
    console.log("[chat] Question from", userId, ":", question.slice(0, 80));

    const queryEmbedding = await embedQuery(question);
    const topChunks = await searchChunks(userId, queryEmbedding, 5);
    console.log("[chat] Retrieved", topChunks.length, "chunks for", userId);

    if (topChunks.length === 0) {
      return NextResponse.json(
        { success: false, error: "No documents found. Please upload a document first." },
        { status: 400 },
      );
    }

    const answer = await answerQuestion(question, topChunks, chatHistory);
    const duration = Date.now() - startTime;
    console.log("[chat] Answered in", duration, "ms, sources:", answer.sources?.length ?? 0);

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[chat] Error after", duration, "ms:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Chat request failed" },
      { status: 500 },
    );
  }
}
