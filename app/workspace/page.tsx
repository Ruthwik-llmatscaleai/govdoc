import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/mock-session";
import { getRecentActivity } from "@/lib/bigquery-recent-activity";
import { TopBar } from "@/components/shell/top-bar";
import { CapabilityGrid } from "@/components/workspace/capability-grid";
import { RecentActivity } from "@/components/workspace/recent-activity";

function displayName(user: string): string {
  const head = user.split(/[.@_-]/)[0] ?? user;
  return head.charAt(0).toUpperCase() + head.slice(1);
}

function formatDate(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export default async function WorkspacePage() {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");

  const name = displayName(session.user);
  const dateStamp = formatDate();
  const recentActivity = await getRecentActivity(session.user);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-cream)]">
      <TopBar user={session.user} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 pb-16 pt-10 lg:px-10 lg:pt-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <header className="mb-8">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
                Workspace · {dateStamp}
              </div>
              <h1
                className="leading-[1.02] tracking-[-0.025em] text-[var(--color-ink)]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "clamp(48px, 6vw, 72px)",
                  fontVariationSettings: '"opsz" 144',
                }}
              >
                Welcome back,{" "}
                <em
                  className="text-[var(--color-govdoc-primary)]"
                  style={{ fontStyle: "italic", fontWeight: 300 }}
                >
                  {name}.
                </em>
              </h1>
              <p
                className="mt-4 max-w-[600px] leading-relaxed text-[var(--color-ink-soft)]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(16px, 1.5vw, 18px)",
                  fontWeight: 400,
                  fontVariationSettings: '"opsz" 72',
                }}
              >
                Pick a capability to run. Each one reads documents, applies policy, and produces an auditable
                decision — every step cited and traceable.
              </p>
            </header>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span
                  className="tracking-[-0.015em] text-[var(--color-ink)]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "20px",
                    fontWeight: 400,
                    fontVariationSettings: '"opsz" 72',
                  }}
                >
                  Choose a{" "}
                  <em
                    className="text-[var(--color-govdoc-primary)]"
                    style={{ fontStyle: "italic", fontWeight: 300 }}
                  >
                    capability
                  </em>
                </span>
                <span className="rounded bg-[var(--color-cream)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
                  9 Available
                </span>
              </div>
              <div className="flex gap-2">
                <FilterButton active>ALL</FilterButton>
                <FilterButton>RUN</FilterButton>
                <FilterButton>REVIEW</FilterButton>
                <FilterButton>ANALYZE</FilterButton>
              </div>
            </div>

            <CapabilityGrid />
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <RecentActivity items={recentActivity} />
          </aside>
        </div>
      </main>

      <footer className="border-t border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-6 py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] md:flex-row md:items-center md:justify-between lg:px-10">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>© 2026 LLM at Scale.AI</span>
            <Sep />
            <span>Confidential &amp; Proprietary</span>
            <Sep />
            <span>Authorized Use Only</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>Privacy</span>
            <span>Terms</span>
            <span>Section 508</span>
            <span>Support</span>
            <span>v 1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FilterButton({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`rounded px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
        active
          ? "bg-[var(--color-ink)] text-white"
          : "border border-[var(--color-line)] bg-white text-[var(--color-ink-mute)] hover:border-[var(--color-govdoc-primary)]"
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span aria-hidden className="text-[var(--color-ink-faint)]/60">·</span>;
}
