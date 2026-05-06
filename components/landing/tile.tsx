import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export type TileTone = "blue" | "indigo" | "green" | "rose";

const TONE: Record<TileTone, { iconBg: string; iconFg: string; ring: string }> = {
  blue: {
    iconBg: "bg-[oklch(0.94_0.04_254)]",
    iconFg: "text-[oklch(0.42_0.13_254)]",
    ring: "ring-[oklch(0.42_0.13_254)]/15",
  },
  indigo: {
    iconBg: "bg-[oklch(0.94_0.05_280)]",
    iconFg: "text-[oklch(0.45_0.15_280)]",
    ring: "ring-[oklch(0.45_0.15_280)]/15",
  },
  green: {
    iconBg: "bg-[oklch(0.94_0.05_150)]",
    iconFg: "text-[oklch(0.48_0.14_150)]",
    ring: "ring-[oklch(0.48_0.14_150)]/20",
  },
  rose: {
    iconBg: "bg-[oklch(0.94_0.04_15)]",
    iconFg: "text-[oklch(0.55_0.18_15)]",
    ring: "ring-[oklch(0.55_0.18_15)]/15",
  },
};

type Props = {
  title: string;
  blurb: string;
  href: string;
  enabled: boolean;
  icon?: LucideIcon;
  tone?: TileTone;
};

export function Tile({ title, blurb, href, enabled, icon: Icon, tone = "blue" }: Props) {
  const t = TONE[tone];
  const card = (
    <div
      className={`group relative flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition ${
        enabled
          ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_30px_-10px_oklch(0.42_0.13_254/0.18)]"
          : "opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div
            className={`flex size-12 items-center justify-center rounded-full ring-1 ${t.iconBg} ${t.ring}`}
          >
            <Icon className={`size-5 ${t.iconFg}`} />
          </div>
        )}
        {!enabled && (
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Coming soon
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{blurb}</p>
      </div>

      {enabled && (
        <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          Open
          <ArrowRight className="size-3.5" />
        </div>
      )}
    </div>
  );

  return enabled ? (
    <Link href={href as any} className="block h-full">
      {card}
    </Link>
  ) : (
    <div className="h-full">{card}</div>
  );
}
