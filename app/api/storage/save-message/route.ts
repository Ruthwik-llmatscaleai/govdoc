import { NextRequest, NextResponse } from "next/server";
import { saveChatMessage, type ChatMessage } from "@/lib/bigquery-storage";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const message = (await request.json()) as ChatMessage;

    await saveChatMessage(message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save message error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save message",
      },
      { status: 500 }
    );
  }
}
