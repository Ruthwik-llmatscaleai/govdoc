import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Search, FileText, CheckCircle2, Inbox } from "lucide-react";
import { verifySession } from "@/lib/auth/mock-session";
import { TopBar } from "@/components/shell/top-bar";
import { Tile } from "@/components/landing/tile";

function displayName(user: string): string {
  const head = user.split(/[.@_-]/)[0] ?? user;
  return head.charAt(0).toUpperCase() + head.slice(1);
}

export default async function LandingPage() {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");

  const name = displayName(session.user);

  return (
    <div className="min-h-screen bg-background">
      <TopBar user={session.user} showSearch={false} />

      <main className="mx-auto max-w-5xl px-6 pb-16 pt-12 md:pt-16">
        <header className="mb-10 space-y-2">
          <h1 className="text-[2.75rem] font-bold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Welcome back, {name}.
          </h1>
          <p className="text-base text-muted-foreground">
            What would you like to do today?
          </p>
        </header>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Tile
            icon={Search}
            tone="blue"
            title="Search & Ask"
            blurb="Find information across all documents."
            href="/work/search"
            enabled={false}
          />
          <Tile
            icon={FileText}
            tone="indigo"
            title="Draft a Document"
            blurb="Generate documents from templates and prior records."
            href="/work/draft"
            enabled={false}
          />
          <Tile
            icon={CheckCircle2}
            tone="green"
            title="Review Documents"
            blurb="Validate, redline, and approve work."
            href="/work/review"
            enabled
          />
          <Tile
            icon={Inbox}
            tone="rose"
            title="My Inbox"
            blurb="3 items needing your approval."
            href="/work/inbox"
            enabled={false}
          />
        </section>

        <div className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-border bg-card px-5 py-3 text-sm">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-muted-foreground">
            Recent:
          </span>
          <RecentItem text="Approved TR violation case" />
          <Sep />
          <RecentItem text="Drafted Director's deck" />
          <Sep />
          <RecentItem text="12 tasks completed this week" />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          Pick what to do. Four entry points. No menus to learn.
        </p>
      </main>
    </div>
  );
}

function RecentItem({ text }: { text: string }) {
  return <span className="text-foreground/85">{text}</span>;
}

function Sep() {
  return <span aria-hidden className="text-muted-foreground/50">·</span>;
}
