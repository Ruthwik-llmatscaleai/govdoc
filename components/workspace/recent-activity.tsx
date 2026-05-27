import Link from "next/link";
import type { RecentActivityItem } from "@/lib/bigquery-recent-activity";

interface RecentActivityProps {
  items: RecentActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <aside
      className="w-full max-w-[500px] shrink-0 rounded-[8px] border border-[#D4CDB8] bg-[#FCFAF3] px-[22px] py-[20px]"
      style={{ minHeight: "220px" }}
      data-testid="recent-activity"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <span className="inline-block h-[6px] w-[6px] rounded-full bg-[#3D5740]" />
          <span
            className="uppercase text-[#3D5740]"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              lineHeight: "11px",
              letterSpacing: "3px",
              fontWeight: 700,
            }}
          >
            RECENT ACTIVITY · LAST 24H
          </span>
        </div>
        <Link
          href="/work/audit"
          className="uppercase text-[#6E706A] hover:text-[#0E1410]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            lineHeight: "11px",
            letterSpacing: "3px",
            fontWeight: 700,
          }}
        >
          VIEW ALL →
        </Link>
      </div>

      {/* Divider */}
      <div className="my-[12px] h-px bg-[#D4CDB8]" />

      {/* Scrollable content */}
      <div className="activity-scroll overflow-y-auto" style={{ maxHeight: "150px" }}>
        {items.length > 0 ? (
          <div className="space-y-[16px]">
            {items.map((item, idx) => (
              <ActivityRow key={idx} item={item} />
            ))}
          </div>
        ) : (
          <p
            className="text-[#6E706A]"
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 500 }}
          >
            No recent activity
          </p>
        )}
      </div>
    </aside>
  );
}

function ActivityRow({ item }: { item: RecentActivityItem }) {
  const badge = getBadge(item.status);
  const timeAgo = formatTimeAgo(item.timestamp);

  return (
    <div className="flex items-center gap-[10px]">
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[2px] uppercase"
        style={{
          height: "14px",
          minWidth: "52px",
          background: badge.bg,
          color: badge.color,
          fontFamily: "var(--font-mono)",
          fontSize: "8px",
          lineHeight: "14px",
          letterSpacing: "1.5px",
          fontWeight: 700,
          textAlign: "center",
        }}
      >
        {item.status}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-[#0E1410]"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          lineHeight: "14px",
          fontWeight: 500,
        }}
      >
        {item.documentName}
      </span>
      <span
        className="shrink-0 text-[#6E706A]"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          lineHeight: "11px",
          letterSpacing: "0.5px",
          fontWeight: 500,
          textAlign: "right",
        }}
      >
        {timeAgo}
      </span>
    </div>
  );
}

function getBadge(status: string) {
  switch (status) {
    case "PASS":
      return { bg: "#E3E5DB", color: "#475F49" };
    case "FAIL":
      return { bg: "#F1E1DC", color: "#8E3535" };
    default:
      return { bg: "#F2E7D5", color: "#8A6335" };
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
