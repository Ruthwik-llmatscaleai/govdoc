import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.set("govdoc_session", "", { maxAge: 0, path: "/" });
  return res;
}
