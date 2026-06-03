import { NextRequest, NextResponse } from "next/server";
import { loadChatHistory } from "@/lib/chat-store";
import { getRequestSession } from "@/lib/auth/require-user";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const history = await loadChatHistory(session.user);
    console.log("[storage] Loaded", history.length, "messages for", session.user);

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("[storage] Load history error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load history" },
      { status: 500 },
    );
  }
}
