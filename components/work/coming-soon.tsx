import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  title: string;
  blurb: string;
  icon?: LucideIcon;
  backHref?: string;
};

export function ComingSoon({ title, blurb, icon: Icon, backHref }: Props) {
  return (
    <div className="text-center py-20 space-y-4">
      {Icon ? (
        <div className="mx-auto flex size-14 items-center justify-center rounded-full ring-1 bg-[oklch(0.94_0.04_254)] ring-[oklch(0.42_0.13_254)]/15">
          <Icon className="size-6 text-[oklch(0.42_0.13_254)]" />
        </div>
      ) : null}
      <span className="inline-block text-xs px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">
        Coming soon
      </span>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-neutral-600 max-w-lg mx-auto">{blurb}</p>
      {backHref ? (
        <Link
          href={backHref as any}
          className="inline-block mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          ← Back to dashboard
        </Link>
      ) : null}
    </div>
  );
}
