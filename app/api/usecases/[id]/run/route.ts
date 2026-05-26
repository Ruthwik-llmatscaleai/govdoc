import { NextResponse } from "next/server";
import { verifySession } from "@/features/auth/mock-session";
import { getUseCase } from "@/features/usecases/registry";
import { sseStream } from "@/lib/sse/stream";
import { runPipeline } from "@/features/usecases/shared/run-pipeline";

function getCookie(req: Request, name: string): string | undefined {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifySession(getCookie(req, "govdoc_session"));
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  if (!getUseCase(id)) return new NextResponse("Unknown use case", { status: 404 });

  const formData = await req.formData();

  return sseStream(() => runPipeline({ useCaseId: id, formData, session, abortSignal: req.signal }));
}
