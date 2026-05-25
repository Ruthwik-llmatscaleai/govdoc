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
    <div className="relative min-h-full">
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

      <div className="relative z-10">
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
        <div className="mb-4 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
          <span className="text-[var(--color-line)]">━━━</span>
          <span>01</span>
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

            {/* Right: Badge + version info + Stats */}
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-emerald-700">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                READ-ONLY
              </span>
              <div className="flex flex-col gap-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)] lg:items-end">
                <div>VERSION: v1.0.0</div>
                <div>POSTED: 09 MAY 2026</div>
              </div>
              <div className="mt-2 flex items-center gap-6 font-mono text-center">
                <div>
                  <div className="text-[24px] font-semibold leading-none tracking-tight text-[var(--color-ink)]">{String(cmgcCount).padStart(2, "0")}</div>
                  <div className="mt-1 text-[8.5px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">QUESTIONS</div>
                </div>
                <span className="text-[var(--color-line)] text-lg">|</span>
                <div>
                  <div className="text-[24px] font-semibold leading-none tracking-tight text-[var(--color-ink)]">{String(cmgcSections).padStart(2, "0")}</div>
                  <div className="mt-1 text-[8.5px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">SECTIONS</div>
                </div>
                <span className="text-[var(--color-line)] text-lg">|</span>
                <div>
                  <div className="text-[24px] font-semibold leading-none tracking-tight text-[var(--color-ink)]">v1.0</div>
                  <div className="mt-1 text-[8.5px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">09 MAY 2026</div>
                </div>
              </div>
            </div>
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

      {/* Bottom summary bar */}
      <div className="mt-8 flex items-center gap-4 rounded-lg bg-[#1a3a1a] px-6 py-4">
        <span className="inline-block size-1.5 rounded-full bg-[#4ade80]" />
        <span className="rounded bg-[#2d5016] px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#4ade80]">
          Summary
        </span>
        <span
          className="flex-1 text-[13px] text-white/90"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}
        >
          Validate Project rubric — inspection view across all sections.
        </span>
        <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.1em] text-white/70">
          <span>Sections <strong className="font-bold text-white">{String(cmgcSections).padStart(2, "0")}</strong></span>
          <span>Questions <strong className="font-bold text-white">{String(cmgcCount).padStart(2, "0")}</strong></span>
          <span>Weight <strong className="font-bold text-white">100%</strong></span>
        </div>
      </div>

      {/* Bottom metadata */}
      <div className="mt-6 flex items-end justify-between">
        <p
          className="max-w-[400px] text-[13px] leading-[1.5] text-[var(--color-ink-mute)]"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}
        >
          Reads the document. Checks the policy. Tells you pass or fail — with full citations and audit trail.
        </p>
        <div className="text-right font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
          <div>Rubric ID</div>
          <div className="font-bold text-[var(--color-ink-soft)]">VP-2026-05-09</div>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-[var(--color-govdoc-primary)]" />
            Published &amp; Locked
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
