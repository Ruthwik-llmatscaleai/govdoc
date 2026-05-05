import { NextResponse } from "next/server";
import { signSession } from "@/lib/auth/mock-session";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { username?: string; password?: string } | null;
  if (
    !body ||
    !body.username ||
    !body.password ||
    body.username !== process.env.GOVDOC_DEV_USER ||
    body.password !== process.env.GOVDOC_DEV_PASS
  ) {
    return new NextResponse("Invalid credentials", { status: 401 });
  }
  const token = await signSession({ user: body.username });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("govdoc_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
