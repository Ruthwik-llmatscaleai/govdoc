import { NextRequest, NextResponse } from "next/server";
import { processPDFDocument, processDOCXDocument } from "@/lib/document-service";
import { saveDocument } from "@/lib/bigquery-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const files = formData.getAll("files") as File[];

    if (!userId) {
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    const processedDocuments = [];

    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const documentId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      const processed =
        ext === ".pdf"
          ? await processPDFDocument(buffer, documentId, file.name)
          : await processDOCXDocument(buffer, documentId, file.name);

      await saveDocument({
        userId,
        documentId: processed.id,
        documentName: processed.name,
        pageCount: processed.pageCount,
        chunks: processed.chunks.map((c) => ({
          chunkIndex: c.chunkIndex,
          text: c.text,
          embedding: c.embedding,
        })),
        uploadedAt: processed.uploadedAt,
      });

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
