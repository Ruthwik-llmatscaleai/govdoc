import { loadCmgcRubric } from "@/lib/usecases/cmgc-pde/rubric-merged";
import { loadCucpRubric } from "@/lib/usecases/cucp-reevals/rubric-merged";
import { loadRowRubric } from "@/lib/usecases/row-appraisal/rubric-merged";
import { listRubrics } from "@/lib/usecases/rubrics-store";
import { ReviewRubricsClient } from "@/components/work/rubric/review-rubrics-client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PreviewRubricsPage() {
  const [cmgc, cucp, row, cmgcRubrics, cucpRubrics, rowRubrics] = await Promise.all([
    loadCmgcRubric(),
    loadCucpRubric(),
    loadRowRubric(),
    listRubrics("cmgc-pde"),
    listRubrics("cucp-reevals"),
    listRubrics("row-appraisal"),
  ]);

  const cmgcCount = cmgc.questions.length;
  const cmgcSections = new Set(cmgc.questions.map((q) => q.section)).size;

  return (
    <div className="min-h-full">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        <Link
          href="/workspace"
          className="text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]"
        >
          Workspace
        </Link>
        <span className="opacity-60">/</span>
        <Link
          href="/work/search"
          className="text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)]"
        >
          Rubrics
        </Link>
        <span className="opacity-60">/</span>
        <span className="font-medium text-[var(--color-ink)]">Review Rubrics</span>
      </nav>

      {/* Section label */}
      <div className="mb-4 flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
        <span className="text-[var(--color-line)]">━━━</span>
        <span>02</span>
        <span>Rubrics · Preview</span>
      </div>

      {/* Header area */}
      <header className="mb-8 border-b border-[var(--color-line)] pb-7">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
          {/* Left: Title + description */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <h1
                className="leading-[1.05] tracking-[-0.025em] text-[var(--color-ink)]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 400,
                  fontSize: "clamp(36px, 4vw, 52px)",
                  fontVariationSettings: '"opsz" 96',
                }}
              >
                Review{" "}
                <em
                  className="text-[var(--color-govdoc-primary)]"
                  style={{ fontStyle: "italic", fontWeight: 300 }}
                >
                  Rubrics.
                </em>
              </h1>
            </div>
            <p className="max-w-[64ch] text-[14px] leading-[1.6] text-[var(--color-ink-mute)]">
              A read-only view of the rubric GovDoc applies for each review type. For
              inspection only — questions, scoring tiers, and section weights cannot be
              modified from this screen.
            </p>
          </div>

          {/* Right: Badge + version info */}
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <span className="inline-flex items-center gap-2 border border-[var(--color-ink)] px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink)]">
              <span>◆</span> Read-Only
            </span>
            <div className="flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] lg:items-end">
              <span>
                Version{" "}
                <strong className="font-medium text-[var(--color-ink)]">1.0.0</strong>
              </span>
              <span>
                Updated{" "}
                <strong className="font-medium text-[var(--color-ink)]">09 May 2026</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 flex flex-wrap items-center gap-6 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          <span>
            <strong className="font-semibold text-[var(--color-ink)]">{String(cmgcCount).padStart(2, "0")}</strong>{" "}
            Questions
          </span>
          <span className="text-[var(--color-line)]">|</span>
          <span>
            <strong className="font-semibold text-[var(--color-ink)]">{String(cmgcSections).padStart(2, "0")}</strong>{" "}
            Sections
          </span>
          <span className="text-[var(--color-line)]">|</span>
          <span>
            <strong className="font-semibold text-[var(--color-ink)]">v1.0</strong>{" "}
            <span className="normal-case">(09 May 2026)</span>
          </span>
        </div>
      </header>

      {/* Interactive client component with tabs + sections */}
      <ReviewRubricsClient
        cmgc={cmgc}
        cucp={cucp}
        row={row}
        cmgcRubrics={cmgcRubrics}
        cucpRubrics={cucpRubrics}
        rowRubrics={rowRubrics}
      />
    </div>
  );
}
