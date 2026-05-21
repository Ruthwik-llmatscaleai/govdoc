import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/chat-service";
import type { ChatMessage } from "@/lib/chat-service";
import { getAllChunks } from "@/lib/bigquery-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, userId, chatHistory } = body as {
      question: string;
      userId: string;
      chatHistory: ChatMessage[];
    };

    if (!question || !userId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Load all chunks from BigQuery
    const allChunks = await getAllChunks(userId);

    if (allChunks.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No documents found. Please upload a PDF first.",
      }, { status: 400 });
    }

    const answer = await answerQuestion(question, allChunks, chatHistory);

    return NextResponse.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Chat request failed",
      },
      { status: 500 }
    );
  }
}
