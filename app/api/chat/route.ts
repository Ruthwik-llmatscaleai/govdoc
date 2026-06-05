import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage } from "@/features/search-ask/service";
import { embedQuery } from "@/features/search-ask/documents";
import { searchChunks, searchKbChunks, loadSpreadsheetDocuments } from "@/lib/document-store";
import { detectFinanceIntent, detectCities, CITY_KBS } from "@/features/search-ask/finance-intent";
import { detectCouncilIntent } from "@/features/search-ask/council-intent";
import { detectCodeIntent } from "@/features/search-ask/code-intent";
import { getRequestSession } from "@/lib/auth/require-user";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 120;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Appended to every chat system prompt. Lets the model emit Claude-style artifacts
// that the UI renders in a side panel. Scoped conservatively for a government tool.
const ARTIFACT_INSTRUCTIONS =
  "\n\nArtifacts: When the user explicitly asks you to CREATE substantial, standalone, or visual/interactive content " +
  "(a written document/report, a diagram, an SVG graphic, an interactive HTML widget, or a small React component), " +
  "wrap that content in an artifact tag instead of inlining it:\n" +
  '<antArtifact identifier="kebab-id" type="TYPE" title="Short Title">...content...</antArtifact>\n' +
  'Use type "text/markdown" for documents/reports, "text/mermaid" for diagrams, "image/svg+xml" for SVG graphics, ' +
  '"text/html" for a self-contained interactive page (vanilla JS only; Tailwind is available via CDN), and ' +
  '"application/vnd.ant.react" for a single self-contained React component with a default export named App. ' +
  "Keep every artifact fully self-contained with no external network calls. Do NOT use artifacts for ordinary " +
  "answers, short code snippets, or simple lists - answer those normally. Create only what the user asked for.";

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { question, chatHistory, conversationId, stream } = body as {
    question: string;
    chatHistory: ChatMessage[];
    conversationId?: string;
    stream?: boolean;
  };

  if (!question) {
    return NextResponse.json({ success: false, error: "Missing question" }, { status: 400 });
  }

  const userId = session.user;

  try {
    const queryEmbedding = await embedQuery(question);

    // Route Sunnyvale city finance questions to the curated Finance Knowledge Base.
    // Trigger on the current question OR inherit finance context from the conversation,
    // so follow-ups like "give me a chart" / "show visuals" still hit the budget KB.
    // For inherited follow-ups, anchor retrieval on the previous user question so the
    // embedding matches relevant budget chunks. If the KB has no match (e.g. before
    // ingestion), fall through to the normal per-user document path.
    const recentUserMsgs = chatHistory.filter((m) => m.role === "user").map((m) => m.content).slice(-4);
    // Council meeting-transcript KB takes precedence on meeting/deliberation questions
    // (so "what did the Planning Commission discuss" -> council, "Sunnyvale budget" -> finance).
    const councilNow = detectCouncilIntent(question);
    const lastCouncilMsg = [...recentUserMsgs].reverse().find((m) => detectCouncilIntent(m));
    const councilContext = councilNow || Boolean(lastCouncilMsg);
    let councilChunks: Awaited<ReturnType<typeof searchKbChunks>> = [];
    if (councilContext) {
      const kbEmbedding = councilNow ? queryEmbedding : await embedQuery(`${lastCouncilMsg ?? ""}\n${question}`);
      councilChunks = await searchKbChunks("sunnyvale-council", kbEmbedding, 8);
    }
    const useCouncil = councilChunks.length > 0;

    // Municipal Code KB — building/zoning/permit/code questions (checked after council).
    const codeNow = detectCodeIntent(question);
    const lastCodeMsg = [...recentUserMsgs].reverse().find((m) => detectCodeIntent(m));
    const codeContext = !useCouncil && (codeNow || Boolean(lastCodeMsg));
    let codeChunks: Awaited<ReturnType<typeof searchKbChunks>> = [];
    if (codeContext) {
      const kbEmbedding = codeNow ? queryEmbedding : await embedQuery(`${lastCodeMsg ?? ""}\n${question}`);
      codeChunks = await searchKbChunks("sunnyvale-municode", kbEmbedding, 8);
    }
    const useCode = codeChunks.length > 0;

    const lastFinanceMsg = [...recentUserMsgs].reverse().find((m) => detectFinanceIntent(m));
    const financeNow = detectFinanceIntent(question, queryEmbedding);
    const financeContext = !useCouncil && !useCode && (financeNow || Boolean(lastFinanceMsg));

    // Resolve which cities this question targets: explicit in the question, else
    // inherited from a recent finance turn, else default to Sunnyvale.
    let targetCities = detectCities(question);
    if (targetCities.length === 0 && lastFinanceMsg) targetCities = detectCities(lastFinanceMsg);
    if (targetCities.length === 0) targetCities = [CITY_KBS[0]];

    // Retrieve a balanced set of chunks from each target city's KB, tagged by city,
    // so cross-city comparisons have both sides represented.
    const kbResults: Array<{ chunk: Awaited<ReturnType<typeof searchKbChunks>>[number]; city: string }> = [];
    if (financeContext) {
      const kbEmbedding = financeNow ? queryEmbedding : await embedQuery(`${lastFinanceMsg ?? ""}\n${question}`);
      const perCity = targetCities.length > 1 ? 6 : 8;
      for (const c of targetCities) {
        const chunks = await searchKbChunks(c.kb, kbEmbedding, perCity);
        for (const ch of chunks) kbResults.push({ chunk: ch, city: c.label });
      }
    }
    const useFinanceKb = kbResults.length > 0;

    const useKb = useCouncil || useCode || useFinanceKb;
    const topChunks = useCouncil
      ? councilChunks
      : useCode
      ? codeChunks
      : useFinanceKb
      ? kbResults.map((r) => r.chunk)
      : await searchChunks(userId, queryEmbedding, 5, conversationId);
    const spreadsheets = useKb ? [] : await loadSpreadsheetDocuments(userId, conversationId);

    const messages: Array<{ role: "user" | "assistant"; content: string | Anthropic.Messages.ContentBlockParam[] }> = [
      ...chatHistory.slice(-10).map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    const hasDocContext = topChunks.length > 0;
    const hasSpreadsheets = spreadsheets.length > 0;

    // Build the user message content blocks
    const userContent: Anthropic.Messages.ContentBlockParam[] = [];

    // Add spreadsheet documents as document blocks with citations enabled
    for (const sheet of spreadsheets) {
      userContent.push({
        type: "document",
        source: { type: "text", media_type: "text/plain", data: sheet.textContent },
        title: sheet.name,
        citations: { enabled: true },
      } as Anthropic.Messages.DocumentBlockParam);
    }

    // Add RAG chunks as individual document blocks with citations enabled.
    // Finance KB chunks are prefixed with their city so the model (and citations)
    // can tell which city each excerpt belongs to in a comparison.
    if (useCouncil) {
      for (const chunk of councilChunks) {
        userContent.push({
          type: "document",
          source: { type: "text", media_type: "text/plain", data: chunk.text },
          title: chunk.documentName, // "{meeting name} — {date} @ {timestamp}"
          citations: { enabled: true },
        } as Anthropic.Messages.DocumentBlockParam);
      }
    } else if (useCode) {
      for (const chunk of codeChunks) {
        userContent.push({
          type: "document",
          source: { type: "text", media_type: "text/plain", data: chunk.text },
          title: chunk.documentName, // "§ {section} {heading}"
          citations: { enabled: true },
        } as Anthropic.Messages.DocumentBlockParam);
      }
    } else if (useFinanceKb) {
      for (const { chunk, city } of kbResults) {
        userContent.push({
          type: "document",
          source: { type: "text", media_type: "text/plain", data: chunk.text },
          title: `${city} — ${chunk.documentName}`,
          citations: { enabled: true },
        } as Anthropic.Messages.DocumentBlockParam);
      }
    } else if (hasDocContext) {
      for (const chunk of topChunks) {
        userContent.push({
          type: "document",
          source: { type: "text", media_type: "text/plain", data: chunk.text },
          title: `${chunk.documentName} (Section ${chunk.chunkIndex + 1})`,
          citations: { enabled: true },
        } as Anthropic.Messages.DocumentBlockParam);
      }
    }

    userContent.push({ type: "text", text: question });

    messages.push({ role: "user" as const, content: userContent });

    const cityNames = targetCities.map((c) => c.label);
    const comparisonClause =
      cityNames.length > 1
        ? `\n\nCOMPARISON: The user is comparing ${cityNames.join(" vs ")}. Each excerpt is labeled by city ("City — ..."). The dashboard MUST have 2-3 charts, and the comparison charts use a "series" set to the city name on every data point, e.g. {"label":"Public Safety","value":114338497,"series":"Sunnyvale","cite":"..."} and {"label":"Public Safety","value":...,"series":"Fremont","cite":"..."}. Good set: a grouped "bar" comparing categories across the cities, a second grouped "bar" (or a "stat") for the headline totals per city, and optionally a per-category breakdown. Use only each city's own figures, cited to that city's excerpts, and note in your prose where the cities categorize their budgets differently.`
        : "";

    const systemPrompt = (useCouncil
      ? "You answer questions about City of Sunnyvale City Council and commission MEETINGS, grounded ONLY in the provided caption-note excerpts (automatic speech-to-text transcripts of the public meetings). For each fact, cite the meeting name, date, and timestamp, e.g. \"[City Council — 12/18/2025 @ 00:14:22]\". These are ASR captions and may contain transcription errors and misheard names/numbers (e.g. \"7 0\" means a 7-0 vote); paraphrase tolerantly and do not over-rely on exact wording. If the excerpts do not cover the question, say so plainly rather than guessing. Be concise and neutral. Never use emojis."
      : useCode
      ? "You answer questions about the City of Sunnyvale Municipal Code, grounded ONLY in the provided code-section excerpts. For each statement, cite the exact section number and heading, e.g. \"§ 1.05.020 Definitions\". Quote or closely paraphrase the regulation precisely; do not invent requirements, numbers, or sections. If the provided sections do not cover the question, say so plainly and note that the municipal code may not be fully loaded yet (only some titles are ingested) — do not guess. Be precise and neutral. Never use emojis."
      : useFinanceKb
      ? `You answer questions about the FY 2025/26 Adopted Budget(s) of ${cityNames.join(", ")}, grounded in the provided budget excerpts. Cite the source (city + volume/page) for figures taken from the excerpts. Be concise and accurate. Never use emojis.\n\n` +
        "FORECASTING: For questions about future years (e.g., FY 2026/27 and beyond) where an explicit table is not in the excerpts, do NOT refuse. Project values by applying the City's stated growth assumptions (the per-year growth rates given in the excerpts, e.g. Property Tax growing about 5%/year, Sales Tax roughly flat) to the most recent stated base-year figure, year by year. Clearly label these as projected/estimated and state the assumption and base year you used. It is expected and acceptable to show estimated forward values for a forecast.\n\n" +
        "VISUALS: When the user asks for a visual, chart, graph, or dashboard - or whenever the answer has comparable numbers - append ONE govdoc-viz block after your prose that the UI renders as a dashboard in a side panel. ALWAYS use the DASHBOARD form with 2-3 complementary charts (never a single chart): for example a bar breakdown by category, a stat card of the headline total(s), and a pie of shares (or, for a forecast, a bar of projected values across years). Use a fenced code block with language govdoc-viz containing JSON of this dashboard shape:\n" +
        '```govdoc-viz\n{"title":"Revenue overview (FY 2025/26)","charts":[{"kind":"stat","title":"Headline figures","unit":"$","data":[{"label":"Total General Fund","value":275500000,"cite":"Vol 1, p.17"}]},{"kind":"bar","title":"Top revenues by source","unit":"$","data":[{"label":"Property Tax","value":140000000,"cite":"Vol 1, p.17"},{"label":"Sales Tax","value":40500000,"cite":"Vol 1, p.17"}]},{"kind":"pie","title":"Share of revenue","unit":"$","data":[{"label":"Property Tax","value":140000000,"cite":"Vol 1, p.17"},{"label":"Sales Tax","value":40500000,"cite":"Vol 1, p.17"}]}]}\n```\n' +
        'Rules: each chart kind is "bar" (compare categories), "pie" (parts of one whole), or "stat" (one to three headline figures). value MUST be a raw number (no commas or symbols); put currency in unit ("$"). Include a cite for figures from the excerpts; for projected/forecast values use a cite like "Projected (City assumptions)". Always write your normal text answer first.' +
        comparisonClause
      : hasDocContext || hasSpreadsheets
      ? "You are a helpful assistant that answers questions based on the provided document context. For spreadsheet/CSV data, you can analyze, summarize, find patterns, and answer specific questions about the data. Be concise and accurate. Never use emojis in your responses."
      : "You are GovDoc, an AI assistant for government document review. You can answer general questions, greet users, and help them understand how to use the system. When no documents are uploaded, let the user know they can upload PDF, DOCX, CSV, or Excel files to ask questions about their contents. Be friendly and concise. Never use emojis in your responses.") + ARTIFACT_INSTRUCTIONS;

    // RAG-chunk sources, used by the streaming path (which doesn't parse the
    // model's inline citation blocks). Same shape as the non-streaming fallback.
    const ragSources = hasDocContext
      ? topChunks.map((chunk) => ({
          documentName: chunk.documentName,
          chunkIndex: chunk.chunkIndex,
          score: chunk.score,
          excerpt: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? "..." : ""),
        }))
      : undefined;

    // ---- Streaming path (Server-Sent Events) ----
    if (stream) {
      const encoder = new TextEncoder();
      const rs = new ReadableStream({
        async start(controller) {
          const send = (o: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(o)}\n\n`));
          try {
            if (ragSources) send({ type: "sources", sources: ragSources });
            const s = anthropic.messages.stream({
              model: "claude-sonnet-4-6",
              max_tokens: 4096,
              system: systemPrompt,
              messages,
            });
            for await (const ev of s) {
              if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
                send({ type: "text", delta: ev.delta.text });
              }
            }
            send({ type: "done" });
          } catch (e) {
            send({ type: "error", message: e instanceof Error ? e.message : "stream failed" });
          } finally {
            controller.close();
          }
        },
      });
      return new Response(rs, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
          Connection: "keep-alive",
        },
      });
    }

    // ---- Non-streaming path (JSON, fallback) ----
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    // Extract text and citations from response
    let answerText = "";
    const citations: Array<{ documentName: string; excerpt: string }> = [];

    for (const block of response.content) {
      if (block.type === "text") {
        answerText += block.text;
        // Extract inline citations if present
        if ("citations" in block && Array.isArray((block as any).citations)) {
          for (const cite of (block as any).citations) {
            if (cite.type === "document" && cite.document_title && cite.cited_text) {
              citations.push({
                documentName: cite.document_title,
                excerpt: cite.cited_text.slice(0, 300),
              });
            }
          }
        }
      }
    }

    // Build sources from citations (deduplicated) or fall back to RAG chunks
    const seen = new Set<string>();
    const sources = citations.length > 0
      ? citations.filter((c) => {
          const key = `${c.documentName}::${c.excerpt.slice(0, 50)}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }).map((c) => ({
          documentName: c.documentName,
          chunkIndex: 0,
          score: 1,
          excerpt: c.excerpt,
        }))
      : hasDocContext
        ? topChunks.map((chunk) => ({
            documentName: chunk.documentName,
            chunkIndex: chunk.chunkIndex,
            score: chunk.score,
            excerpt: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? "..." : ""),
          }))
        : undefined;

    const answer: ChatMessage = {
      role: "assistant",
      content: answerText,
      sources,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, answer });
  } catch (error) {
    console.error("[chat] Error:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Chat request failed" },
      { status: 500 },
    );
  }
}
