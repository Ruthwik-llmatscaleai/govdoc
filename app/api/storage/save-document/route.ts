import { NextRequest, NextResponse } from "next/server";
import { saveDocument, type StoredDocument } from "@/lib/bigquery-storage";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const document = (await request.json()) as StoredDocument;

    await saveDocument(document);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save document error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save document",
      },
      { status: 500 }
    );
  }
}
