import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { saveRubric, deleteRubric } from "@/lib/usecases/rubric-store";
import { loadCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { loadCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { loadRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";

const KNOWN_IDS = new Set(["cmgc-pde", "cucp-reevals", "row-appraisal"]);

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

async function loadFor(id: string): Promise<unknown> {
  if (id === "cmgc-pde") return loadCmgcRubric();
  if (id === "cucp-reevals") return loadCucpRubric();
  if (id === "row-appraisal") return loadRowRubric();
  throw new Error(`Unknown id: ${id}`);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown rubric use case" }, { status: 404 });
  }
  const data = await loadFor(id);
  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown rubric use case" }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  await saveRubric(id, body);
  // Re-load with validation (rejects malformed payloads by falling back to defaults)
  const verified = await loadFor(id);
  return NextResponse.json({ ok: true, rubric: verified });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!KNOWN_IDS.has(id)) {
    return NextResponse.json({ error: "Unknown rubric use case" }, { status: 404 });
  }
  await deleteRubric(id);
  const data = await loadFor(id);
  return NextResponse.json({ ok: true, rubric: data });
}
