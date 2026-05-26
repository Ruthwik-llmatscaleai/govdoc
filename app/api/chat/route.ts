import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/features/search-ask/service";
import type { ChatMessage } from "@/features/search-ask/service";
import { getAllChunks } from "@/lib/bigquery-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { question, userId, chatHistory } = body as {
      question: string;
      userId: string;
      chatHistory: ChatMessage[];
    };

    if (!question || !userId) {
      console.warn("[chat] Missing fields", { question: !!question, userId: !!userId });
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    console.log("[chat] Question from", userId, ":", question.slice(0, 80));

    const allChunks = await getAllChunks(userId);
    console.log("[chat] Loaded", allChunks.length, "chunks for", userId);

    if (allChunks.length === 0) {
      console.warn("[chat] No chunks found for", userId);
      return NextResponse.json({
        success: false,
        error: "No documents found. Please upload a document first.",
      }, { status: 400 });
    }

    const answer = await answerQuestion(question, allChunks, chatHistory);
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
