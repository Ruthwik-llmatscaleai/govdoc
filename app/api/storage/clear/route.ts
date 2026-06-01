import { NextRequest, NextResponse } from "next/server";
import { clearUserDocuments } from "@/lib/document-store";
import { clearUserChat } from "@/lib/chat-store";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const { userId } = (await request.json()) as { userId: string };

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    await clearUserDocuments(userId);
    await clearUserChat(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to clear data",
      },
      { status: 500 }
    );
  }
}
