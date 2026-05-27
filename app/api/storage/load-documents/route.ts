import { NextRequest, NextResponse } from "next/server";
import { loadDocuments } from "@/lib/bigquery-storage";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    const documents = await loadDocuments(userId);
    console.log("[storage] Loaded", documents.length, "documents for", userId);

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error("[storage] Load documents error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load documents",
      },
      { status: 500 }
    );
  }
}
