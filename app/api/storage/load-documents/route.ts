import { NextRequest, NextResponse } from "next/server";
import { loadDocuments } from "@/lib/document-store";
import { getRequestSession } from "@/lib/auth/require-user";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = request.nextUrl.searchParams.get("conversationId") ?? undefined;
    const documents = await loadDocuments(session.user, conversationId);

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error("[storage] Load documents error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load documents" },
      { status: 500 },
    );
  }
}
