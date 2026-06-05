#!/usr/bin/env npx tsx
/**
 * Ingest the Sunnyvale Municipal Code from S3 into the curated "sunnyvale-municode"
 * Knowledge Base, using our existing OpenAI embeddings + document_chunks.
 *
 * The code is already structured (one clean JSON per section), so each section is
 * one chunk (large sections are split), prefixed with its citation + title/chapter
 * for context. Re-run anytime as more titles are scraped (idempotent).
 *
 * Usage:
 *   node --env-file=.env.local --import tsx scripts/ingest-municode-kb.ts
 *
 * Requires env: DATABASE_URL, OPENAI_API_KEY, AWS_ACCESS_KEY_ID/SECRET, AWS_REGION.
 */

import { randomUUID } from "crypto";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

import { prisma } from "@/lib/db";
import { generateEmbeddings } from "@/features/search-ask/documents";
import type { DocumentChunk, ProcessedDocument } from "@/features/search-ask/documents";
import { saveKbDocument, deleteKbDocuments } from "@/lib/document-store";

const KB = "sunnyvale-municode";
const SYSTEM_EMAIL = "system@govdoc.local";
const BUCKET = process.env.S3_MUNICODE_BUCKET ?? "sunnyvale-municipalcode";
const PREFIX = process.env.S3_MUNICODE_PREFIX ?? "";
const REGION = process.env.AWS_REGION ?? "us-west-2";
const MAX_CHUNK_CHARS = 6000;

interface Section {
  section_number: string;
  title_number: string;
  title_name: string;
  chapter_number: string;
  chapter_name: string;
  full_citation: string;
  heading: string;
  text: string;
  url: string;
}

const s3 = new S3Client({ region: REGION });
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 3500, chunkOverlap: 350 });

async function listKeys(): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX, ContinuationToken: token }));
    for (const o of res.Contents ?? []) if (o.Key && o.Key.endsWith(".json")) keys.push(o.Key);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys.sort();
}

async function getSection(key: string): Promise<Section> {
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return JSON.parse(await obj.Body!.transformToString()) as Section;
}

async function ingestSection(systemUserId: string, sec: Section): Promise<number> {
  const text = (sec.text ?? "").trim();
  if (!text) return 0;
  const citation = `${sec.full_citation ?? "§ " + sec.section_number}`.trim();
  const ctx = `[${citation} — Title ${sec.title_number} ${sec.title_name} > Ch. ${sec.chapter_number} ${sec.chapter_name}]`;
  const pieces = text.length > MAX_CHUNK_CHARS ? await splitter.splitText(text) : [text];

  const embeddings = await generateEmbeddings(pieces.map((p) => `${ctx}\n${p}`));
  const chunks: DocumentChunk[] = pieces.map((p, i) => ({
    documentId: "",
    documentName: citation,
    chunkIndex: i,
    text: `${ctx}\n${p}`,
    embedding: embeddings[i]!,
  }));

  const processed: ProcessedDocument = {
    id: randomUUID(),
    name: citation,
    pageCount: 1,
    chunks,
    uploadedAt: new Date().toISOString(),
  };

  await saveKbDocument(systemUserId, KB, processed, () => ({
    title: citation,
    section: sec.section_number,
    chapter: `${sec.chapter_number} ${sec.chapter_name}`.trim(),
    titleName: `Title ${sec.title_number} ${sec.title_name}`.trim(),
    url: sec.url,
  }));

  return chunks.length;
}

async function main() {
  const systemUser = await prisma.user.upsert({
    where: { email: SYSTEM_EMAIL },
    update: {},
    create: { email: SYSTEM_EMAIL, passwordHash: "system-no-login", name: "GovDoc System", isAdmin: false, status: "ACTIVE" },
  });

  console.log(`Deleting existing "${KB}" documents (idempotent re-ingest)...`);
  await deleteKbDocuments(KB);

  const keys = await listKeys();
  console.log(`Found ${keys.length} section(s) under s3://${BUCKET}/${PREFIX || "(root)"}`);

  let total = 0;
  let done = 0;
  for (const key of keys) {
    const sec = await getSection(key);
    const n = await ingestSection(systemUser.id, sec);
    total += n;
    done += 1;
    if (done % 10 === 0 || done === keys.length) console.log(`  [${done}/${keys.length}] ${total} chunks so far`);
  }

  console.log(`Done. Ingested ${total} chunks from ${done} sections into "${KB}".`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
