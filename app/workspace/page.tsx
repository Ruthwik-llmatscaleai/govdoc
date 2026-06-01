import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/features/auth/mock-session";
import { getRecentActivity } from "@/lib/recent-activity";
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
    <div className="govdoc-grid-bg relative flex min-h-screen flex-col bg-[#F3EEE0]">

      <TopBar user={session.user} />

      <main className="govdoc-page-pad relative z-10 w-full flex-1 pb-10 pt-[clamp(48px,5vw,80px)]">
        <div className="govdoc-page-inner">
        {/* Top section: welcome left, activity right */}
        <div className="flex flex-col items-start justify-between gap-8 xl:flex-row">
          {/* Welcome block */}
          <div>
            <div className="govdoc-kicker mb-5">
              <span>
                WORKSPACE · {dateStamp}
              </span>
            </div>

            <h1
              className="govdoc-display"
              style={{ fontSize: "clamp(48px, 4vw, 64px)" }}
            >
              Welcome back,{" "}
              <em>
                {name}.
              </em>
            </h1>

            <p
              className="govdoc-copy mt-4 max-w-[610px]"
            >
              Pick a capability to run. Each one reads documents, applies policy, and produces an
              auditable decision — every step cited and traceable.
            </p>
          </div>

          {/* Recent activity panel */}
          <RecentActivity items={recentActivity} />
        </div>

        {/* Capability section header + filters */}
        <div className="mb-5 mt-12 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline gap-[18px]">
            <h2
              className="text-[#0E1410]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "24px",
                lineHeight: "26px",
                fontWeight: 700,
                letterSpacing: "-0.3px",
              }}
            >
              Choose a{" "}
              <em style={{ fontStyle: "italic", fontWeight: 500, color: "#3D5740" }}>
                capability
              </em>
            </h2>
            <span
              className="uppercase text-[#6E706A]"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                lineHeight: "13px",
                letterSpacing: "4px",
                fontWeight: 700,
              }}
            >
              9 AVAILABLE
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterChip active>ALL</FilterChip>
            <FilterChip>RUN</FilterChip>
            <FilterChip>REVIEW</FilterChip>
            <FilterChip>ANALYZE</FilterChip>
          </div>
        </div>

        <CapabilityGrid />
        </div>
      </main>

      <PageFooter />
    </div>
  );
}

function FilterChip({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className="transition-colors"
      style={{
        height: "27px",
        borderRadius: "13.5px",
        padding: "0 16px",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        lineHeight: "27px",
        letterSpacing: "2.4px",
        fontWeight: 700,
        textTransform: "uppercase",
        background: active ? "#0E1410" : "#FCFAF3",
        color: active ? "#FCFAF3" : "#0E1410",
        border: active ? "1px solid #0E1410" : "1px solid #D4CDB8",
      }}
    >
      {children}
    </button>
  );
}
