import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/chat-service";
import type { ChatMessage } from "@/lib/chat-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { question, userId, chatHistory, fileIds } = body as {
      question: string;
      userId: string;
      chatHistory: ChatMessage[];
      fileIds: Array<{ fileId: string; fileName: string }>;
    };

    if (!question || !userId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No documents found. Please upload a document first.",
      }, { status: 400 });
    }

    console.log("[chat] Question from", userId, ":", question.slice(0, 80), "| files:", fileIds.length);

    const answer = await answerQuestion(question, fileIds, chatHistory);
    const duration = Date.now() - startTime;
    console.log("[chat] Answered in", duration, "ms");

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
