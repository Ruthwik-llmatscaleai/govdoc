import Link from "next/link";
import { ArrowRight, CheckCircle2, FileCheck2, Building2, MapPin } from "lucide-react";
import { USE_CASES_BY_TILE } from "@/lib/usecases/registry";
import type { UseCaseId } from "@/lib/usecases/types";
import { WorkBreadcrumbs, WorkPageHeader } from "@/components/work/page-shell";
import { TONE_CLASSES, USE_CASE_FAMILY, USE_CASE_TONE } from "@/components/work/use-case-tone";

const ICONS: Record<UseCaseId, typeof Building2> = {
  "cmgc-pde": Building2,
  "cucp-reevals": FileCheck2,
  "row-appraisal": MapPin,
};

export default function ReviewPicker() {
  const cases = USE_CASES_BY_TILE.review;
  return (
    <div className="space-y-6">
      <WorkBreadcrumbs
        crumbs={[
          { label: "Landing", href: "/landing" },
          { label: "Review Documents" },
        ]}
      />

      <WorkPageHeader
        icon={CheckCircle2}
        eyebrow="Review"
        title="Review Documents"
        blurb="Validate, score, and approve customer-submitted documents against the applicable rubric. Pick an evaluator below to start."
      />

      {cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No evaluators registered yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cases.map((uc) => {
            const Icon = ICONS[uc.id as UseCaseId] ?? CheckCircle2;
            const t = TONE_CLASSES[USE_CASE_TONE[uc.id as UseCaseId]];
            return (
              <div
                key={uc.id}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_30px_-10px_oklch(0.62_0.14_38/0.18)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex size-12 items-center justify-center rounded-full ring-1 ${t.iconBg} ${t.ring}`}>
                    <Icon className={`size-5 ${t.iconFg}`} />
                  </div>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {USE_CASE_FAMILY[uc.id as UseCaseId] ?? "Review"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-[17px] font-semibold tracking-tight text-foreground">
                    {uc.label}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {uc.blurb}
                  </p>
                </div>
                <div className="mt-auto">
                  <Link
                    href={`/work/review/${uc.id}` as any}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-[var(--color-govdoc-deep)]"
                  >
                    Open evaluator
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
