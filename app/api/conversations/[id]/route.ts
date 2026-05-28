import { NextRequest, NextResponse } from "next/server";
import {
  getConversationMessages,
  updateConversationTitle,
  deleteConversation,
} from "@/lib/chat-store";
import { getRequestSession } from "@/lib/auth/require-user";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const messages = await getConversationMessages(id, session.userId);
  return NextResponse.json({ success: true, messages });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json();
  if (typeof body?.title === "string") {
    await updateConversationTitle(id, session.userId, body.title);
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getRequestSession(request);
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteConversation(id, session.userId);
  return NextResponse.json({ success: true });
}
