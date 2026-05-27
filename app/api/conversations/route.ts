import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { listConversations } from "@/lib/search-ask/chat-storage";
import { bqErrorMessage } from "@/lib/search-ask/bq-error";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

function getCookie(req: NextRequest, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const session = await verifySession(getCookie(request, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const items = await listConversations(session.user, 50);
    return NextResponse.json({ success: true, conversations: items });
  } catch (error) {
    const detail = bqErrorMessage(error, "List failed");
    logger.warn({ detail }, "[search-ask] listConversations failed — returning empty list");
    // Soft-fail: the chat page still loads with an empty recents column when
    // BigQuery is unconfigured. Surface the underlying reason via `warning`
    // so the UI can show a banner without losing the page.
    return NextResponse.json({ success: true, conversations: [], warning: detail });
  }
}
