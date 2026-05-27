import { NextRequest, NextResponse } from "next/server";
import { uploadToClaudeFiles } from "@/lib/search-ask/document-service";
import { verifySession } from "@/lib/auth/mock-session";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

function getCookie(req: NextRequest, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

const SUPPORTED_EXTENSIONS: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".txt": "text/plain",
  ".csv": "text/csv",
};

export async function POST(request: NextRequest) {
  const session = await verifySession(getCookie(request, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const startTime = Date.now();
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 });
    }

    const uploadedDocuments = [];
    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      const mimeType = SUPPORTED_EXTENSIONS[ext];
      if (!mimeType) {
        logger.warn({ name: file.name }, "[search-ask] skipping unsupported file");
        continue;
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const { fileId, sizeBytes } = await uploadToClaudeFiles(buffer, file.name, mimeType);
      uploadedDocuments.push({ fileId, name: file.name, sizeBytes });
    }

    const duration = Date.now() - startTime;
    logger.info(
      { user: session.user, count: uploadedDocuments.length, durationMs: duration },
      "[search-ask] upload complete",
    );

    return NextResponse.json({ success: true, documents: uploadedDocuments });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      { durationMs: duration, error: error instanceof Error ? error.message : String(error) },
      "[search-ask] upload error",
    );
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
