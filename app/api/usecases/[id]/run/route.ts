import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/mock-session";
import { getUseCase } from "@/lib/usecases/registry";
import { sseStream } from "@/lib/sse/stream";
import { makeLlmRouter } from "@/lib/llm/router";
import type { StepContext, StepEvent } from "@/lib/usecases/types";

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
  const useCase = getUseCase(id);
  if (!useCase) return new NextResponse("Unknown use case", { status: 404 });

  const formData = await req.formData();
  const runId = crypto.randomUUID();

  return sseStream(async function* () {
    const ctx: StepContext = {
      userId: session.user,
      runId,
      prior: {},
      llm: makeLlmRouter(),
      abortSignal: req.signal,
      log: (msg, data) => console.warn(JSON.stringify({ runId, msg, data })),
    };
    yield { type: "progress", stage: "init", pct: 0, message: `Starting ${useCase.label}` } satisfies StepEvent;

    for (const step of useCase.pipeline) {
      try {
        for await (const ev of step.run(formData, ctx)) {
          yield ev;
          if (ev.type === "stage-done") ctx.prior[step.id] = ev.data;
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        yield { type: "error", stage: step.id, message };
        return;
      }
      if (req.signal.aborted) return;
    }
    yield { type: "done", result: ctx.prior };
  });
}
