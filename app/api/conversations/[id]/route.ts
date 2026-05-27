import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { getConversation } from "@/lib/search-ask/chat-storage";
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

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await verifySession(getCookie(request, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { id } = await ctx.params;
    const conv = await getConversation(id, session.user);
    if (!conv) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, conversation: conv });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : String(error) },
      "[search-ask] getConversation failed",
    );
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Load failed" },
      { status: 500 },
    );
  }
}
