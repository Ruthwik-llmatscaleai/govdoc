import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/chat-service";
import type { DocumentChunk } from "@/lib/document-service";
import type { ChatMessage } from "@/lib/chat-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, allChunks, chatHistory } = body as {
      question: string;
      allChunks: DocumentChunk[];
      chatHistory: ChatMessage[];
    };

    if (!question || !allChunks) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
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
