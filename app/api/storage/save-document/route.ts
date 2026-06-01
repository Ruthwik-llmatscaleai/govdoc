import { NextRequest, NextResponse } from "next/server";
import { saveDocument } from "@/lib/document-store";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const { userId, documentName, chunks } = (await request.json()) as {
      userId: string;
      documentName: string;
      chunks: { text: string; embedding: number[] }[];
    };

    await saveDocument(userId, documentName, chunks);

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
