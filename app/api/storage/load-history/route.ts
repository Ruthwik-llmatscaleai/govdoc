import { NextRequest, NextResponse } from "next/server";
import { loadChatHistory } from "@/lib/bigquery-storage";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    const history = await loadChatHistory(userId);
    console.log("[storage] Loaded", history.length, "messages for", userId);

    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error("[storage] Load history error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load history",
      },
      { status: 500 }
    );
  }
}
