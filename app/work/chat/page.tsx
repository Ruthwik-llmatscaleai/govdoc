import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/mock-session";
import { ChatClient } from "@/components/work/chat/chat-client";

function displayName(user: string): string {
  const head = user.split(/[.@_-]/)[0] ?? user;
  return head.charAt(0).toUpperCase() + head.slice(1);
}

export default async function ChatPage() {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");
  return <ChatClient userId={session.user} userName={displayName(session.user)} />;
}
