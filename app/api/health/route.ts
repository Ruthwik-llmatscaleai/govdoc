import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const body: { ok: true; service: "govdoc"; uptimeSec: number; commit?: string } = {
    ok: true,
    service: "govdoc",
    uptimeSec: Math.round(process.uptime()),
  };
  if (process.env.GIT_COMMIT) body.commit = process.env.GIT_COMMIT;
  return NextResponse.json(body);
}
