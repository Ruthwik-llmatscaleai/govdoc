import Link from "next/link";
import { WorkBreadcrumbs } from "@/components/work/page-shell";

const RECENT_RUBRICS = [
  { name: "Grievance Evaluation", category: "Public Records", questions: 24, version: "v2.1", ago: "2h ago" },
  { name: "Audit Finding Review", category: "Compliance", questions: 18, version: "v3.0", ago: "Yesterday" },
  { name: "Vendor Compliance", category: "Procurement", questions: 31, version: "v1.4", ago: "3d ago" },
  { name: "Policy Exception Request", category: "Risk", questions: 12, version: "v1.2", ago: "5d ago" },
];

const DRAFT_RUBRICS = [
  { name: "Procurement Contract", version: "v0.9", progress: 70, status: "DRAFT", ago: "Today" },
  { name: "Whistleblower Intake", version: "v0.4", progress: 35, status: "DRAFT", ago: "2d ago" },
  { name: "FOIA Response Review", version: "v0.2", progress: 15, status: "DRAFT", ago: "1w ago" },
];

export default function SearchAskPage() {
  return (
    <div>
      {/* Breadcrumbs */}
      <WorkBreadcrumbs
        crumbs={[
          { label: "Workspace", href: "/workspace" },
          { label: "Rubrics" },
        ]}
      />

      {/* Section number */}
      <div className="mb-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        ━━━ 01&nbsp;&nbsp;RUBRICS
      </div>

      {/* Title + Description + Stats */}
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <h1
            className="leading-none tracking-[-0.025em] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: "clamp(36px, 4.5vw, 52px)",
              fontVariationSettings: '"opsz" 96',
            }}
          >
            Rubric{" "}
            <em
              className="text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              Tools
            </em>
          </h1>
          <p className="max-w-[62ch] text-[15px] leading-[1.55] text-[var(--color-ink-mute)]">
            A rubric is the set of scoring questions GovDoc uses to evaluate a document type.
            Inspect, refine, and version the rubrics behind every review.
          </p>
        </div>

        {/* Stats bar */}
        <div className="flex items-baseline gap-7 font-mono">
          <div className="text-right">
            <span className="text-[28px] font-medium leading-none tracking-tight text-[var(--color-ink)]">12</span>
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">ACTIVE</span>
          </div>
          <span className="text-[var(--color-line)]">|</span>
          <div className="text-right">
            <span className="text-[28px] font-medium leading-none tracking-tight text-[var(--color-ink)]">3</span>
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">DRAFTS</span>
          </div>
          <span className="text-[var(--color-line)]">|</span>
          <div className="text-right">
            <span className="text-[28px] font-medium leading-none tracking-tight text-[var(--color-ink)]">186</span>
            <span className="ml-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">QUESTIONS</span>
          </div>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Left panel — Review Rubrics */}
        <div className="flex flex-col border border-[var(--color-line)] bg-[var(--color-paper)]">
          <div className="px-7 pt-7 pb-6">
            {/* Icon + Badge */}
            <div className="mb-5 flex items-start justify-between">
              <div className="flex size-10 items-center justify-center bg-[var(--color-ink)] text-[var(--color-cream)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="round" className="size-[18px]">
                  <path d="M3 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z" />
                  <path d="M21 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z" />
                </svg>
              </div>
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                PRIMARY · READ-ONLY
              </span>
            </div>

            {/* Title */}
            <h2
              className="mb-2 leading-[1.15] tracking-[-0.015em] text-[var(--color-ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 24,
                fontVariationSettings: '"opsz" 96',
              }}
            >
              Review{" "}
              <em
                className="text-[var(--color-govdoc-primary)]"
                style={{ fontStyle: "italic", fontWeight: 400 }}
              >
                Rubrics
              </em>
            </h2>

            {/* Description */}
            <p className="text-[13.5px] leading-[1.55] text-[var(--color-ink-mute)]">
              Browse the production library. View every question, scoring weight, and pass
              criteria — versioned and audit-ready.
            </p>
          </div>

          {/* Divider with label */}
          <div className="px-7">
            <div className="border-t border-[var(--color-line)] pt-4 pb-3 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              ━━━ RECENT · 4 OF 12
            </div>
          </div>

          {/* Recent rubrics list */}
          <div className="flex-1 px-7 pb-6">
            <ul className="space-y-3">
              {RECENT_RUBRICS.map((r) => (
                <li key={r.name} className="flex items-start gap-2.5 text-[12.5px] leading-[1.5]">
                  <span className="mt-[5px] inline-block size-[6px] shrink-0 rounded-full bg-[var(--color-ink-mute)]" />
                  <div>
                    <span className="font-medium text-[var(--color-ink-soft)]">{r.name}</span>
                    <span className="text-[var(--color-ink-faint)]"> / {r.category}</span>
                    <span className="text-[var(--color-ink-faint)]"> · {r.questions} questions / {r.version} / {r.ago}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[var(--color-line)] px-7 py-4">
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
                <span className="size-[5px] rounded-full bg-[var(--color-ink-mute)]" />
                12 RUBRICS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
                <span className="size-[5px] rounded-full bg-[var(--color-ink-mute)]" />
                VERSIONED
              </span>
            </div>
            <Link
              href="/work/search/preview"
              className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-govdoc-primary)]"
            >
              Browse all rubrics →
            </Link>
          </div>
        </div>

        {/* Right panel — Manage Rubrics */}
        <div className="flex flex-col border border-[var(--color-line)] bg-[var(--color-paper)]">
          <div className="px-7 pt-7 pb-6">
            {/* Icon + Badge */}
            <div className="mb-5 flex items-start justify-between">
              <div className="flex size-10 items-center justify-center bg-[var(--color-ink)] text-[var(--color-cream)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="round" className="size-[18px]">
                  <path d="m4 20 1-4L17 4l3 3L8 19z" />
                  <path d="m14 7 3 3" />
                </svg>
              </div>
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--color-govdoc-primary)]">
                ADMIN · GOVERNED
              </span>
            </div>

            {/* Title */}
            <h2
              className="mb-2 leading-[1.15] tracking-[-0.015em] text-[var(--color-ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 24,
                fontVariationSettings: '"opsz" 96',
              }}
            >
              Manage{" "}
              <em
                className="text-[var(--color-govdoc-primary)]"
                style={{ fontStyle: "italic", fontWeight: 400 }}
              >
                Rubrics
              </em>
            </h2>

            {/* Description */}
            <p className="text-[13.5px] leading-[1.55] text-[var(--color-ink-mute)]">
              Create, adjust, and version rubrics. Every change governed and audit-logged.
            </p>
          </div>

          {/* Big green CTA */}
          <div className="px-7 pb-5">
            <Link
              href="/work/search/edit"
              className="group/cta flex items-center justify-between rounded bg-[#1a3a2a] px-5 py-4 text-white no-underline transition-colors hover:bg-[#224a34]"
            >
              <span className="text-[14px] font-medium">+ Create New Rubric</span>
              <span className="font-mono text-[9.5px] uppercase tracking-[0.1em] opacity-70 transition-opacity group-hover/cta:opacity-100">
                START WITH A TEMPLATE OR FROM SCRATCH →
              </span>
            </Link>
          </div>

          {/* Divider with label */}
          <div className="px-7">
            <div className="border-t border-[var(--color-line)] pt-4 pb-3 font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
              ━━━ IN PROGRESS · 3 DRAFTS
            </div>
          </div>

          {/* Drafts list */}
          <div className="flex-1 px-7 pb-6">
            <ul className="space-y-3">
              {DRAFT_RUBRICS.map((d) => (
                <li key={d.name} className="flex items-start gap-2.5 text-[12.5px] leading-[1.5]">
                  <span className="mt-[5px] inline-block size-[6px] shrink-0 rounded-full bg-[var(--color-govdoc-primary)]" />
                  <div>
                    <span className="font-medium text-[var(--color-ink-soft)]">{d.name}</span>
                    <span className="text-[var(--color-ink-faint)]"> / {d.version}</span>
                    <span className="text-[var(--color-ink-faint)]"> · {d.progress}% complete / {d.status} / {d.ago}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[var(--color-line)] px-7 py-4">
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--color-govdoc-primary)]">
                <span className="size-[5px] rounded-full bg-[var(--color-govdoc-primary)]" />
                ADMIN
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--color-govdoc-primary)]">
                <span className="size-[5px] rounded-full bg-[var(--color-govdoc-primary)]" />
                AUDIT-LOG
              </span>
            </div>
            <Link
              href="/work/search/edit"
              className="font-mono text-[10.5px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-govdoc-primary)]"
            >
              Open admin console →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
