import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/mock-session";
import { TopBar } from "@/components/shell/top-bar";
import { PageFooter } from "@/components/shared/page-footer";

export default async function WorkLayout({ children }: { children: React.ReactNode }) {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");

  const pathname = (await headers()).get("x-pathname") || "";
  const isChat = pathname === "/work/chat";

  if (isChat) {
    return (
      <div className="flex h-screen flex-col bg-[var(--color-cream-soft)] text-[var(--color-ink)] overflow-hidden">
        <TopBar user={session.user} variant="full" />
        <main className="w-full flex-1 overflow-hidden">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cream-soft)] text-[var(--color-ink)]">
      <TopBar user={session.user} variant="full" />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-10 py-8">{children}</main>
      <PageFooter />
    </div>
  );
}
