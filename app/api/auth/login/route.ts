import { NextResponse } from "next/server";
import { signSession } from "@/features/auth/mock-session";
import { prisma } from "@/lib/db";

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

  // Ensure a User row exists so FK constraints on conversations/documents work
  const user = await prisma.user.upsert({
    where: { email: `${body.username}@govdoc.local` },
    update: { lastLogin: new Date() },
    create: {
      email: `${body.username}@govdoc.local`,
      passwordHash: "dev-login-no-hash",
      name: body.username,
      isAdmin: true,
      status: "ACTIVE",
    },
  });

  const token = await signSession({ user: user.id, name: user.name ?? body.username });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("govdoc_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: req.headers.get("x-forwarded-proto") === "https",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return res;
}
