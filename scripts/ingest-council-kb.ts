#!/usr/bin/env npx tsx
/**
 * Ingest Sunnyvale City Council / commission caption-note transcripts from S3 into
 * the curated "sunnyvale-council" Knowledge Base, using our existing OpenAI
 * embeddings + document_chunks (no Bedrock / no separate service).
 *
 * Per meeting: parse lines[] -> timestamp-aware ~500-token chunks (12% overlap) ->
 * prefix each with "[body — date @ start_ts]" -> OpenAI embed -> store with citation
 * metadata (the meeting name leads every citation).
 *
 * Usage (env must be loaded):
 *   node --env-file=.env.local --import tsx scripts/ingest-council-kb.ts
 *   node --env-file=.env.local --import tsx scripts/ingest-council-kb.ts --limit=3   (test)
 *
 * Requires env: DATABASE_URL, OPENAI_API_KEY, AWS_ACCESS_KEY_ID/SECRET, AWS_REGION,
 * S3_CAPTION_BUCKET, S3_CAPTION_PREFIX.
 */

import { randomUUID } from "crypto";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

import { prisma } from "@/lib/db";
import { generateEmbeddings } from "@/features/search-ask/documents";
import type { DocumentChunk, ProcessedDocument } from "@/features/search-ask/documents";
import { saveKbDocument, deleteKbDocuments } from "@/lib/document-store";

const KB = "sunnyvale-council";
const SYSTEM_EMAIL = "system@govdoc.local";
const BUCKET = process.env.S3_CAPTION_BUCKET ?? "sunnyvale-captionnotes";
const PREFIX = process.env.S3_CAPTION_PREFIX ?? "sunnyvale/caption-notes/";
const REGION = process.env.AWS_REGION ?? "us-west-2";
const BUDGET_CHARS = 1900; // ~500 tokens
const OVERLAP_CHARS = 250; // ~12%

const limitArg = process.argv.slice(2).find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : undefined;

interface Line { ts: string; text: string }
interface Transcript {
  meeting_id1: string;
  body: string;
  meeting_date: string;
  transcript_url: string;
  lines: Line[];
}

const s3 = new S3Client({ region: REGION });

// Pack whole caption lines into ~BUDGET_CHARS chunks with ~OVERLAP_CHARS overlap,
// tracking the timestamp span of each chunk.
function chunkLines(lines: Line[]): Array<{ text: string; startTs: string; endTs: string }> {
  const out: Array<{ text: string; startTs: string; endTs: string }> = [];
  let cur: Line[] = [];
  let curLen = 0;
  const lineLen = (l: Line) => l.ts.length + 1 + l.text.length + 1;
  const flush = () => {
    if (cur.length === 0) return;
    out.push({
      text: cur.map((l) => `${l.ts} ${l.text}`).join("\n"),
      startTs: cur[0]!.ts,
      endTs: cur[cur.length - 1]!.ts,
    });
  };
  for (const line of lines) {
    if (curLen + lineLen(line) > BUDGET_CHARS && cur.length > 0) {
      flush();
      // re-seed next chunk with trailing lines (~OVERLAP_CHARS) for boundary recall
      const seed: Line[] = [];
      let seedLen = 0;
      for (let i = cur.length - 1; i >= 0; i--) {
        const ll = lineLen(cur[i]!);
        if (seedLen + ll > OVERLAP_CHARS) break;
        seed.unshift(cur[i]!);
        seedLen += ll;
      }
      cur = seed;
      curLen = seedLen;
    }
    cur.push(line);
    curLen += lineLen(line);
  }
  flush();
  return out;
}

async function listTranscriptKeys(): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX, ContinuationToken: token }));
    for (const o of res.Contents ?? []) {
      if (o.Key && o.Key.endsWith(".json") && !o.Key.endsWith("meetings.json")) keys.push(o.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys.sort();
}

async function getTranscript(key: string): Promise<Transcript> {
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return JSON.parse(await obj.Body!.transformToString()) as Transcript;
}

async function ingestMeeting(systemUserId: string, t: Transcript): Promise<number> {
  if (!Array.isArray(t.lines) || t.lines.length === 0) return 0;
  const name = `${t.body} — ${t.meeting_date}`;
  const chunked = chunkLines(t.lines);
  const records = chunked.map((c) => ({
    text: `[${t.body} — ${t.meeting_date} @ ${c.startTs}]\n${c.text}`,
    startTs: c.startTs,
    endTs: c.endTs,
  }));

  const embeddings = await generateEmbeddings(records.map((r) => r.text));
  const chunks: DocumentChunk[] = records.map((r, i) => ({
    documentId: "",
    documentName: name,
    chunkIndex: i,
    text: r.text,
    embedding: embeddings[i]!,
  }));

  const processed: ProcessedDocument = {
    id: randomUUID(),
    name,
    pageCount: t.lines.length,
    chunks,
    uploadedAt: new Date().toISOString(),
  };

  await saveKbDocument(systemUserId, KB, processed, (i) => ({
    title: `${t.body} — ${t.meeting_date} @ ${records[i]!.startTs}`,
    body: t.body,
    meetingDate: t.meeting_date,
    startTs: records[i]!.startTs,
    endTs: records[i]!.endTs,
    transcriptUrl: t.transcript_url,
    meetingId1: t.meeting_id1,
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

  let keys = await listTranscriptKeys();
  if (LIMIT) keys = keys.slice(0, LIMIT);
  console.log(`Found ${keys.length} transcript(s) under s3://${BUCKET}/${PREFIX}`);

  let totalChunks = 0;
  let done = 0;
  for (const key of keys) {
    const t = await getTranscript(key);
    const n = await ingestMeeting(systemUser.id, t);
    totalChunks += n;
    done += 1;
    console.log(`  [${done}/${keys.length}] ${t.body} ${t.meeting_date} -> ${n} chunks`);
  }

  console.log(`Done. Ingested ${totalChunks} chunks from ${done} meetings into "${KB}".`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
