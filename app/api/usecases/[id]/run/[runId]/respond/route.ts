import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { resolveHumanResponse } from "@/lib/runs/needs-input-rendezvous";

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; runId: string }> }) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { runId } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const ok = resolveHumanResponse(runId, body);
  if (!ok) return new NextResponse("Run not found or already responded", { status: 404 });
  return NextResponse.json({ ok: true });
}
