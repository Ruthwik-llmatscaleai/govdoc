import { NextRequest, NextResponse } from "next/server";
import { saveChatMessage } from "@/lib/chat-store";
import { getRequestSession } from "@/lib/auth/require-user";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const body = (await request.json()) as {
      role: "user" | "assistant";
      content: string;
      sources?: unknown;
      conversationId?: string;
    };
    if (!body?.role || typeof body.content !== "string") {
      return NextResponse.json({ success: false, error: "role and content required" }, { status: 400 });
    }

    const result = await saveChatMessage(
      session.user,
      { role: body.role, content: body.content, sources: body.sources },
      body.conversationId,
    );

    return NextResponse.json({ success: true, conversationId: result.conversationId });
  } catch (error) {
    console.error("Save message error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save message" },
      { status: 500 },
    );
  }
}
