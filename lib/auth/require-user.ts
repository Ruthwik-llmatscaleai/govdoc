import { NextRequest } from "next/server";
import { verifySession, type Session } from "@/features/auth/mock-session";

export async function getRequestSession(request: NextRequest): Promise<Session | null> {
  const cookie = request.cookies.get("govdoc_session")?.value;
  return verifySession(cookie);
}

export async function getPageSession(cookie: string | undefined): Promise<Session | null> {
  return verifySession(cookie);
}
