import Link from "next/link";
import { ArrowRight, BookOpen, Edit3, Search } from "lucide-react";
import { WorkBreadcrumbs, WorkPageHeader } from "@/components/work/page-shell";

const OPTIONS = [
  {
    title: "Preview Rubrics",
    blurb:
      "Browse the evaluation rubric the AI applies for each review type. Read-only.",
    href: "/work/search/preview",
    icon: BookOpen,
    enabled: true,
    tone: {
      iconBg: "bg-[oklch(0.94_0.05_280)]",
      iconFg: "text-[oklch(0.45_0.15_280)]",
      ring: "ring-[oklch(0.45_0.15_280)]/15",
    },
  },
  {
    title: "Edit Rubrics",
    blurb:
      "Adjust rubric questions, options, and weights. Edits will auto-apply to subsequent reviews.",
    href: "/work/search/edit",
    icon: Edit3,
    enabled: false,
    tone: {
      iconBg: "bg-[oklch(0.94_0.04_15)]",
      iconFg: "text-[oklch(0.55_0.18_15)]",
      ring: "ring-[oklch(0.55_0.18_15)]/15",
    },
  },
];

export default function SearchAskPage() {
  return (
    <div className="space-y-6">
      <WorkBreadcrumbs
        crumbs={[
          { label: "Landing", href: "/landing" },
          { label: "Search & Ask" },
        ]}
      />

      <WorkPageHeader
        icon={Search}
        eyebrow="Search & Ask"
        title="Rubric tools"
        blurb="Inspect and (soon) tailor the rubrics the AI uses for each review type."
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const card = (
            <div
              className={`group relative flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition ${
                opt.enabled
                  ? "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_30px_-10px_oklch(0.62_0.14_38/0.18)]"
                  : "opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`flex size-12 items-center justify-center rounded-full ring-1 ${opt.tone.iconBg} ${opt.tone.ring}`}
                >
                  <Icon className={`size-5 ${opt.tone.iconFg}`} />
                </div>
                {!opt.enabled && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Coming soon
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
                  {opt.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {opt.blurb}
                </p>
              </div>

              {opt.enabled && (
                <div className="mt-auto flex items-center gap-1.5 text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Open
                  <ArrowRight className="size-3.5" />
                </div>
              )}
            </div>
          );

          return opt.enabled ? (
            <Link key={opt.href} href={opt.href as any} className="block h-full">
              {card}
            </Link>
          ) : (
            <div key={opt.href} className="h-full">
              {card}
            </div>
          );
        })}
      </div>
    </div>
  );
}
