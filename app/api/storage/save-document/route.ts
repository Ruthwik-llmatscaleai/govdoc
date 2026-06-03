import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { saveDocument } from "@/lib/document-store";
import type { ProcessedDocument } from "@/features/search-ask/documents";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  try {
    const { userId, documentName, chunks } = (await request.json()) as {
      userId: string;
      documentName: string;
      chunks: { text: string; embedding: number[] }[];
    };

    const doc: ProcessedDocument = {
      id: randomUUID(),
      name: documentName,
      pageCount: 1,
      chunks: chunks.map((c, i) => ({
        documentId: "",
        documentName,
        chunkIndex: i,
        text: c.text,
        embedding: c.embedding,
      })),
      uploadedAt: new Date().toISOString(),
    };

    await saveDocument(userId, doc);

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
