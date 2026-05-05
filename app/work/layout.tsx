import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/mock-session";
import { TopBar } from "@/components/shell/top-bar";

export default async function WorkLayout({ children }: { children: React.ReactNode }) {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");
  return (
    <>
      <TopBar user={session.user} />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </>
  );
}
