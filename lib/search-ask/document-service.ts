import Anthropic, { toFile } from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface UploadedDocument {
  id: string;
  fileId: string;
  name: string;
  sizeBytes: number;
  uploadedAt: string;
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const mammoth = require("mammoth");
  if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error("File is not a valid DOCX format.");
  }
  const result = await mammoth.extractRawText({ buffer });
  const text: string = result.value;
  if (!text.trim()) {
    throw new Error("Document appears to be empty.");
  }
  return text;
}

async function extractTextFromDOC(buffer: Buffer): Promise<string> {
  const WordExtractor = require("word-extractor");
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  const text: string = doc.getBody();
  if (!text.trim()) {
    throw new Error("Document appears to be empty.");
  }
  return text;
}

export async function uploadToClaudeFiles(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<{ fileId: string; sizeBytes: number }> {
  let uploadBuffer = buffer;
  let uploadName = fileName;
  let uploadMime = mimeType;

  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));

  if (ext === ".docx") {
    const text = await extractTextFromDOCX(buffer);
    uploadBuffer = Buffer.from(text, "utf-8");
    uploadName = fileName.replace(/\.docx$/i, ".txt");
    uploadMime = "text/plain";
  } else if (ext === ".doc") {
    const text = await extractTextFromDOC(buffer);
    uploadBuffer = Buffer.from(text, "utf-8");
    uploadName = fileName.replace(/\.doc$/i, ".txt");
    uploadMime = "text/plain";
  }

  const file = await toFile(uploadBuffer, uploadName, { type: uploadMime });

  const uploaded = await anthropic.beta.files.upload({
    file,
    betas: ["files-api-2025-04-14"],
  });

  return { fileId: uploaded.id, sizeBytes: uploaded.size_bytes };
}

export async function deleteClaudeFile(fileId: string): Promise<void> {
  await anthropic.beta.files.delete(fileId, {
    betas: ["files-api-2025-04-14"],
  });
}
