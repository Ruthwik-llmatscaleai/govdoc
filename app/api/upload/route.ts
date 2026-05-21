import { NextRequest, NextResponse } from "next/server";
import { processPDFDocument } from "@/lib/document-service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    const processedDocuments = [];

    for (const file of files) {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const documentId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const processed = await processPDFDocument(buffer, documentId, file.name);
      processedDocuments.push(processed);
    }

    return NextResponse.json({
      success: true,
      documents: processedDocuments,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
