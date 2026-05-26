import { NextRequest, NextResponse } from "next/server";
import { processPDFDocument, processDOCXDocument, processDOCDocument } from "@/features/search-ask/documents";
import { saveDocument } from "@/lib/bigquery-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc"];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const files = formData.getAll("files") as File[];

    if (!userId) {
      console.warn("[upload] Missing userId");
      return NextResponse.json({ success: false, error: "userId required" }, { status: 400 });
    }

    if (files.length === 0) {
      console.warn("[upload] No files from", userId);
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    console.log("[upload] Starting:", files.length, "file(s) from", userId, files.map((f) => `${f.name} (${(f.size / 1024).toFixed(0)}KB)`).join(", "));

    const processedDocuments = [];

    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        console.warn("[upload] Skipping unsupported:", file.name);
        continue;
      }

      const fileStart = Date.now();
      const buffer = Buffer.from(await file.arrayBuffer());
      const documentId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      console.log("[upload] Processing", file.name, "(" + ext + ",", buffer.length, "bytes)");

      const processed =
        ext === ".pdf"
          ? await processPDFDocument(buffer, documentId, file.name)
          : ext === ".doc"
            ? await processDOCDocument(buffer, documentId, file.name)
            : await processDOCXDocument(buffer, documentId, file.name);

      console.log("[upload] Extracted", processed.pageCount, "pages,", processed.chunks.length, "chunks from", file.name, "in", Date.now() - fileStart, "ms");

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

      console.log("[upload] Saved to BigQuery:", file.name);
      processedDocuments.push(processed);
    }

    const duration = Date.now() - startTime;
    console.log("[upload] Complete:", processedDocuments.length, "doc(s) in", duration, "ms");

    return NextResponse.json({ success: true, documents: processedDocuments });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[upload] Error after", duration, "ms:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
