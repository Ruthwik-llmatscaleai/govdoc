import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/features/auth/mock-session";
import { TopBar } from "@/components/shell/top-bar";
import { PageFooter } from "@/components/shared/page-footer";

export default async function WorkLayout({ children }: { children: React.ReactNode }) {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");

  const pathname = (await headers()).get("x-pathname") || "";
  const isChat = pathname === "/work/chat";
  const isRubricHub = pathname === "/work/search";
  const isRubricDetail = pathname === "/work/search/preview" || pathname === "/work/search/edit";

  if (isChat) {
    return (
      <div className="flex h-screen flex-col bg-[var(--color-cream-soft)] text-[var(--color-ink)] overflow-hidden">
        <TopBar user={session.user} variant="full" />
        <main className="w-full flex-1 overflow-hidden">{children}</main>
        <PageFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cream)] text-[var(--color-ink)]">
      <TopBar user={session.user} variant={isRubricDetail ? "rubric" : "full"} />
      <main className="govdoc-grid-bg govdoc-page-pad w-full flex-1 py-[clamp(42px,5vw,72px)]">
        <div className={isRubricDetail ? "govdoc-reading-inner" : isRubricHub ? "govdoc-wide-inner" : "govdoc-page-inner"}>{children}</div>
      </main>
      <PageFooter />
    </div>
  );
}
