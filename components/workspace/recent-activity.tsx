import Link from "next/link";
import type { RecentActivityItem } from "@/lib/bigquery-recent-activity";

interface RecentActivityProps {
  items: RecentActivityItem[];
}

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <aside
      className="rounded-lg border border-[var(--color-line)] bg-white p-6"
      data-testid="recent-activity"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#107e54]" />
          RECENT ACTIVITY - LAST 24H
        </div>
        <Link
          href="/work/audit"
          className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-soft)] hover:underline flex items-center gap-1"
        >
          VIEW ALL →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--color-ink-mute)]">No recent activity</div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <ActivityItem key={idx} item={item} />
          ))}
        </div>
      )}
    </aside>
  );
}

function ActivityItem({ item }: { item: RecentActivityItem }) {
  const badge = getBadge(item.status);
  const timeAgo = formatTimeAgo(item.timestamp);

  return (
    <div className="flex items-center gap-3">
      <span
        className="shrink-0 rounded px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider border"
        style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}
      >
        {item.status}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--color-ink)]">
        {item.documentName}
      </span>
      <span className="shrink-0 font-mono text-[10px] text-[var(--color-ink-faint)]">
        {timeAgo}
      </span>
    </div>
  );
}

function getBadge(status: string) {
  switch (status) {
    case "PASS":
      return { bg: "#e2f9ee", border: "#b2f2d2", color: "#107e54" };
    case "FAIL":
      return { bg: "#fff1f1", border: "#ffd1d1", color: "#c72c2c" };
    default:
      return { bg: "#faf4f1", border: "#f4d4ca", color: "#b04a2f" };
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
