import { NextRequest, NextResponse } from "next/server";
import { answerQuestion, type ChatMessage } from "@/lib/search-ask/chat-service";
import { verifySession } from "@/lib/auth/mock-session";
import {
  appendMessage,
  createConversation,
  getConversation,
} from "@/lib/search-ask/chat-storage";
import { bqErrorMessage } from "@/lib/search-ask/bq-error";
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

// Persistence helpers that NEVER throw. Conversations + messages are nice
// to have for history; if BigQuery is unconfigured (no tables yet, wrong
// schema, expired creds, etc.) the LLM answer should still reach the user.
// We capture the failure server-side and surface it via the JSON response
// `warning` field so the UI can show a soft banner if it wants.
async function safeEnsureConversation(input: {
  conversationId: string;
  userId: string;
  title: string;
}): Promise<string | null> {
  try {
    const existing = await getConversation(input.conversationId, input.userId);
    if (!existing) {
      await createConversation(input);
    }
    return null;
  } catch (err) {
    const detail = bqErrorMessage(err, "Failed to open chat history");
    logger.warn(
      { conversationId: input.conversationId, user: input.userId, detail },
      "[search-ask] persistence: ensureConversation failed",
    );
    return detail;
  }
}

async function safeAppendMessage(input: Parameters<typeof appendMessage>[0]): Promise<string | null> {
  try {
    await appendMessage(input);
    return null;
  } catch (err) {
    const detail = bqErrorMessage(err, "Failed to save message");
    logger.warn(
      { conversationId: input.conversationId, user: input.userId, role: input.role, detail },
      "[search-ask] persistence: appendMessage failed",
    );
    return detail;
  }
}

export async function POST(request: NextRequest) {
  const session = await verifySession(getCookie(request, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const startTime = Date.now();
  try {
    const body = await request.json();
    const { conversationId, question, chatHistory, fileIds } = body as {
      conversationId?: string;
      question: string;
      chatHistory: ChatMessage[];
      fileIds?: Array<{ fileId: string; fileName: string }>;
    };

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 },
      );
    }
    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: "Missing conversationId" },
        { status: 400 },
      );
    }

    // fileIds is optional: with docs → grounded Q&A with citations;
    // without → plain assistant chat. Both modes share the same conversation.
    const docs = fileIds ?? [];

    const warnings: string[] = [];

    // Lazily create the conversation on the first user message. Soft-fail
    // so the answer still reaches the user when BigQuery is misconfigured.
    const ensureWarn = await safeEnsureConversation({
      conversationId,
      userId: session.user,
      title: question,
    });
    if (ensureWarn) warnings.push(ensureWarn);

    const userTurnWarn = await safeAppendMessage({
      conversationId,
      userId: session.user,
      role: "user",
      content: question,
      fileIds: docs.length > 0 ? docs : undefined,
    });
    if (userTurnWarn) warnings.push(userTurnWarn);

    // The LLM call itself is the only step that can hard-fail the request.
    let answer: ChatMessage;
    try {
      answer = await answerQuestion(question, docs, chatHistory);
    } catch (err) {
      const detail =
        err instanceof Error && err.message ? err.message : "AI provider request failed";
      logger.error(
        { user: session.user, detail },
        "[search-ask] LLM error",
      );
      return NextResponse.json(
        { success: false, error: detail },
        { status: 502 },
      );
    }

    const assistantTurnWarn = await safeAppendMessage({
      conversationId,
      userId: session.user,
      role: "assistant",
      content: answer.content,
      citations: answer.citations,
      sources: answer.sources,
    });
    if (assistantTurnWarn) warnings.push(assistantTurnWarn);

    const duration = Date.now() - startTime;
    logger.info(
      {
        user: session.user,
        durationMs: duration,
        fileCount: docs.length,
        mode: docs.length > 0 ? "grounded" : "general",
        conversationId,
        warnings: warnings.length,
      },
      "[search-ask] answered",
    );

    return NextResponse.json({
      success: true,
      answer,
      ...(warnings.length > 0 ? { warning: warnings[0] } : {}),
    });
  } catch (error) {
    // Catch-all for unexpected failures (JSON parse, etc).
    const detail =
      error instanceof Error && error.message
        ? error.message
        : bqErrorMessage(error, "Chat request failed");
    const duration = Date.now() - startTime;
    logger.error({ durationMs: duration, detail }, "[search-ask] chat error");
    return NextResponse.json({ success: false, error: detail }, { status: 500 });
  }
}
