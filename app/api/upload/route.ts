import { NextRequest, NextResponse } from "next/server";
import { processPDFDocument, processDOCXDocument, processDOCDocument } from "@/features/search-ask/documents";
import { saveDocument, saveSpreadsheetDocument } from "@/lib/document-store";
import { getRequestSession } from "@/lib/auth/require-user";
import { isSpreadsheet, parseSpreadsheet } from "@/lib/files/spreadsheet";

export const runtime = "nodejs";
export const maxDuration = 300;

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".csv", ".xlsx", ".xls"];

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log("[upload] Starting upload request");
    const session = await getRequestSession(request);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user;
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const conversationId = formData.get("conversationId") as string | null;
    console.log("[upload] Files:", files.map(f => `${f.name} (${(f.size / 1024).toFixed(0)}KB)`).join(", "));

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    const processedDocuments = [];
    const skippedFiles: string[] = [];

    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      if (!SUPPORTED_EXTENSIONS.includes(ext)) {
        skippedFiles.push(file.name);
        continue;
      }

      console.log("[upload] Processing:", file.name);
      const buffer = Buffer.from(await file.arrayBuffer());
      const documentId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      if (isSpreadsheet(file.name)) {
        const textContent = await parseSpreadsheet(buffer, file.name);
        console.log("[upload] Spreadsheet parsed:", textContent.length, "chars — saving to DB");
        await saveSpreadsheetDocument(userId, documentId, file.name, textContent, conversationId ?? undefined);
        processedDocuments.push({ id: documentId, name: file.name, pageCount: 1, uploadedAt: new Date().toISOString() });
      } else {
        const processed =
          ext === ".pdf"
            ? await processPDFDocument(buffer, documentId, file.name)
            : ext === ".doc"
              ? await processDOCDocument(buffer, documentId, file.name)
              : await processDOCXDocument(buffer, documentId, file.name);

        console.log("[upload] Chunks:", processed.chunks.length, "— saving to DB");
        await saveDocument(userId, processed, conversationId ?? undefined);
        processedDocuments.push(processed);
      }
    }

    if (processedDocuments.length === 0 && skippedFiles.length > 0) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type(s): ${skippedFiles.join(", ")}. Only PDF, DOCX, and DOC are supported.` },
        { status: 400 },
      );
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
