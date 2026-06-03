import { NextRequest, NextResponse } from "next/server";
import { listConversations, createConversation } from "@/lib/chat-store";
import { getRequestSession } from "@/lib/auth/require-user";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const conversations = await listConversations(session.user);
    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error("[conversations] GET error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load conversations" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title : "New Conversation";
  const id = await createConversation(session.user, title);
  return NextResponse.json({ success: true, id });
}
