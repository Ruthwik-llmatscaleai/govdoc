import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/features/auth/mock-session";
import { getRecentActivity } from "@/lib/bigquery-recent-activity";
import { TopBar } from "@/components/shell/top-bar";
import { CapabilityGrid } from "@/components/workspace/capability-grid";
import { RecentActivity } from "@/components/workspace/recent-activity";
import { PageFooter } from "@/components/shared/page-footer";

function displayName(user: string): string {
  const head = user.split(/[.@_-]/)[0] ?? user;
  return head.charAt(0).toUpperCase() + head.slice(1);
}

function formatDate(): string {
  const d = new Date();
  const weekday = d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  const year = d.getFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

export default async function WorkspacePage() {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");

  const name = displayName(session.user);
  const dateStamp = formatDate();
  const recentActivity = await getRecentActivity(session.user);

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--color-cream)]">
      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,10,10,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <TopBar user={session.user} />

      <main className="relative z-10 mx-auto w-full max-w-[1400px] flex-1 px-6 pb-16 pt-10 lg:px-10 lg:pt-14">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            <header className="mb-8">
              <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                <span>━━━ WORKSPACE · {dateStamp}</span>
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
                  className="text-[#b04a2f]"
                  style={{ fontStyle: "italic", fontWeight: 300 }}
                >
                  {name}.
                </em>
              </h1>
              <p className="mt-4 max-w-[600px] text-[15px] leading-[1.6] text-[var(--color-ink-mute)]">
                Pick a capability to run. Each one reads documents, applies policy, and produces an
                auditable decision — every step cited and traceable.
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

      <PageFooter />
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

