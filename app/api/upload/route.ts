import { NextRequest, NextResponse } from "next/server";
import { processPDFDocument, processDOCXDocument, processDOCDocument } from "@/features/search-ask/documents";
import { saveDocument } from "@/lib/document-store";
import { getRequestSession } from "@/lib/auth/require-user";

export const runtime = "nodejs";
export const maxDuration = 120;

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc"];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const conversationId = formData.get("conversationId") as string | null;

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
          : ext === ".doc"
            ? await processDOCDocument(buffer, documentId, file.name)
            : await processDOCXDocument(buffer, documentId, file.name);

      await saveDocument(userId, processed, conversationId ?? undefined);
      processedDocuments.push(processed);
    }

    const duration = Date.now() - startTime;
    console.log("[upload] Complete:", processedDocuments.length, "doc(s) in", duration, "ms");

    const summary = processedDocuments.map((d) => ({
      id: d.id,
      name: d.name,
      pageCount: d.pageCount,
      uploadedAt: d.uploadedAt,
    }));
    return NextResponse.json({ success: true, documents: summary });
  } catch (error) {
    console.error("[upload] Error:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
