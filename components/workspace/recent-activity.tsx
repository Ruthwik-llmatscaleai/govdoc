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
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
          Recent Activity · Last 24H
        </div>
        <Link
          href="/work/audit"
          className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-govdoc-primary)] hover:underline"
        >
          View All →
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
    <div className="flex items-start gap-3 text-sm">
      <span
        className="mt-0.5 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
        style={{ background: badge.bg, color: badge.color }}
      >
        {item.status}
      </span>
      <div className="flex-1">
        <div className="text-[var(--color-ink)]">{item.documentName}</div>
        <div className="text-xs text-[var(--color-ink-faint)]">{timeAgo}</div>
      </div>
    </div>
  );
}

function getBadge(status: string) {
  switch (status) {
    case "PASS":
      return { bg: "#d1fae5", color: "#065f46" };
    case "FAIL":
      return { bg: "#fee2e2", color: "#991b1b" };
    default:
      return { bg: "#fef3c7", color: "#92400e" };
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
