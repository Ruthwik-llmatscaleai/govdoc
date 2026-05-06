import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { addPrecedent, type Level } from "@/lib/usecases/cucp-reevals/memory/precedents";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

type Body = {
  level?: unknown;
  target?: unknown;
  correction?: unknown;
  reasoning?: unknown;
};

export async function POST(req: Request) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { level, target, correction, reasoning } = body;
  if (level !== 1 && level !== 2 && level !== 3) {
    return NextResponse.json({ error: "level must be 1, 2, or 3" }, { status: 400 });
  }
  if (typeof target !== "string" || target.trim() === "") {
    return NextResponse.json({ error: "target must be a non-empty string" }, { status: 400 });
  }
  if (typeof correction !== "string" || correction.trim() === "") {
    return NextResponse.json({ error: "correction must be a non-empty string" }, { status: 400 });
  }
  if (typeof reasoning !== "string" || reasoning.trim() === "") {
    return NextResponse.json({ error: "reasoning must be a non-empty string" }, { status: 400 });
  }

  const { count } = addPrecedent(level as Level, target, correction, reasoning);
  logger.info({ user: session.user, level, target }, "cucp precedent added");
  return NextResponse.json({ ok: true, level, count });
}
