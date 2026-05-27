import { NextRequest, NextResponse } from "next/server";
import { uploadToClaudeFiles } from "@/lib/document-service";

export const runtime = "nodejs";
export const maxDuration = 60;

const SUPPORTED_EXTENSIONS: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".txt": "text/plain",
  ".csv": "text/csv",
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
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

    console.log("[upload] Starting:", files.length, "file(s) from", userId);

    const uploadedDocuments = [];

    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      const mimeType = SUPPORTED_EXTENSIONS[ext];
      if (!mimeType) {
        console.warn("[upload] Skipping unsupported:", file.name);
        continue;
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      console.log("[upload] Uploading to Claude Files API:", file.name, `(${buffer.length} bytes)`);

      const { fileId, sizeBytes } = await uploadToClaudeFiles(buffer, file.name, mimeType);
      console.log("[upload] Done:", file.name, "→", fileId);

      uploadedDocuments.push({ fileId, name: file.name, sizeBytes });
    }

    const duration = Date.now() - startTime;
    console.log("[upload] Complete:", uploadedDocuments.length, "doc(s) in", duration, "ms");

    return NextResponse.json({ success: true, documents: uploadedDocuments });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[upload] Error after", duration, "ms:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
