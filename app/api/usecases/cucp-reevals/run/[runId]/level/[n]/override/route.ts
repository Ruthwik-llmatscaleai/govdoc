import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { resolveLevelDecision } from "@/lib/runs/level-rendezvous";
import type { L2OverridePayload, L3OverridePayload } from "@/lib/usecases/cucp-reevals/memory/staged";

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

function isL2Override(o: unknown): o is L2OverridePayload {
  if (!o || typeof o !== "object") return false;
  const r = o as Record<string, unknown>;
  return typeof r.fact_id === "string" && typeof r.new_category === "string" && typeof r.reason === "string";
}

function isL3Override(o: unknown): o is L3OverridePayload {
  if (!o || typeof o !== "object") return false;
  const r = o as Record<string, unknown>;
  return (
    typeof r.s_no === "string" &&
    (r.verdict === "Pass" || r.verdict === "Fail") &&
    (r.request_info === "Yes" || r.request_info === "No") &&
    typeof r.reason === "string"
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string; n: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { runId, n } = await params;
  const level = Number(n);
  if (level !== 2 && level !== 3) {
    return NextResponse.json({ error: "n must be 2 or 3" }, { status: 400 });
  }

  let body: { override?: unknown };
  try {
    body = (await req.json()) as { override?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const valid = level === 2 ? isL2Override(body.override) : isL3Override(body.override);
  if (!valid) {
    return NextResponse.json({ error: `override payload shape invalid for level ${level}` }, { status: 400 });
  }

  const ok = resolveLevelDecision(runId, level, { action: "override-and-rerun", override: body.override });
  if (!ok) return new NextResponse("Run not waiting for input on this level", { status: 404 });
  return NextResponse.json({ ok: true });
}
