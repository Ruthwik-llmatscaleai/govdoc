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
    <div className="relative">
        {/* Breadcrumbs */}
        <WorkBreadcrumbs
          crumbs={[
            { label: "Workspace", href: "/workspace" },
            { label: "Rubrics" },
          ]}
        />

        {/* Section number */}
        <div className="govdoc-kicker mb-6">
          <span className="govdoc-kicker-number">01</span>
          <span>Rubrics</span>
        </div>

        {/* Title + Description + Stats */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <h1 className="govdoc-display">
              Rubric{" "}
              <em>Tools</em>
            </h1>
            <p className="govdoc-copy">
              A <strong>rubric</strong> is the set of scoring questions GovDoc uses to evaluate a document
              type. <em>Inspect, refine, and version</em> the rubrics behind every review.
            </p>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-7 font-mono text-center">
            <div>
              <div className="text-[28px] font-medium leading-none tracking-tight text-[var(--color-ink)]">12</div>
              <div className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">ACTIVE</div>
            </div>
            <span className="text-[var(--color-line)] text-xl">|</span>
            <div>
              <div className="text-[28px] font-medium leading-none tracking-tight text-[var(--color-ink)]">3</div>
              <div className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">DRAFTS</div>
            </div>
            <span className="text-[var(--color-line)] text-xl">|</span>
            <div>
              <div className="text-[28px] font-medium leading-none tracking-tight text-[var(--color-ink)]">186</div>
              <div className="mt-1.5 text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">QUESTIONS</div>
            </div>
          </div>
        </div>

        {/* Two-panel layout */}
        <div className="mx-auto grid max-w-[2560px] grid-cols-1 gap-10 md:grid-cols-2">
          {/* Left panel — Review Rubrics */}
          <div className="govdoc-surface flex flex-col overflow-hidden">
            <div className="px-7 pt-7 pb-6">
              {/* Icon + Badge */}
              <div className="mb-5 flex items-start justify-between">
                <div className="flex size-10 items-center justify-center bg-[var(--color-ink)] text-[var(--color-cream)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="round" className="size-[18px]">
                    <path d="M3 5h7a3 3 0 0 1 3 3v12a2 2 0 0 0-2-2H3z" />
                    <path d="M21 5h-7a3 3 0 0 0-3 3v12a2 2 0 0 1 2-2h8z" />
                  </svg>
                </div>
                <span className="govdoc-pill">
                  PRIMARY - READ-ONLY
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
                <Link href="/work/search/preview" className="hover:underline">
                  Review
                </Link>{" "}
                <em
                  className="text-[var(--color-govdoc-primary)]"
                  style={{ fontStyle: "italic", fontWeight: 500 }}
                >
                  Rubrics
                </em>
              </h2>

              {/* Description */}
              <p className="text-[13px] leading-[1.55] text-[var(--color-ink-mute)]">
                Browse the <strong>production library</strong>. View every question, scoring weight, and pass
                criteria — versioned and audit-ready.
              </p>
            </div>

            {/* Divider with label */}
            <div className="px-7">
              <div className="border-t border-[var(--color-line)] pt-4 pb-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                ━━━ RECENT · 4 OF 12
              </div>
            </div>

            {/* Recent rubrics list */}
            <div className="flex-1 px-7 pb-6">
              <ul className="space-y-4">
                {RECENT_RUBRICS.map((r) => (
                  <li key={r.name} className="flex items-center gap-3">
                    <span className="govdoc-dot-glow inline-block size-[5px] shrink-0 rounded-full bg-[var(--color-govdoc-primary)]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[var(--color-ink-soft)]">{r.name}</div>
                      <div className="text-[11px] text-[var(--color-ink-faint)]">{r.category} · {r.questions} questions</div>
                    </div>
                    <span className="shrink-0 rounded border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-ink-mute)]">
                      {r.version}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--color-ink-faint)]">
                      {r.ago}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--color-line)] px-7 py-4 bg-[var(--color-cream-soft)]/20">
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-govdoc-primary)] px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-govdoc-primary)]">
                  <span className="govdoc-dot-glow size-[5px] rounded-full bg-[var(--color-govdoc-primary)]" />
                  12 RUBRICS
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-govdoc-primary)] px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-govdoc-primary)]">
                  <span className="govdoc-dot-glow size-[5px] rounded-full bg-[var(--color-govdoc-primary)]" />
                  VERSIONED
                </span>
              </div>
              <Link
                href="/work/search/preview"
                className="inline-flex items-center border border-[var(--color-ink)] bg-transparent hover:bg-[var(--color-ink)] hover:text-white px-4 py-1.5 rounded-full font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)] transition-colors"
              >
                Browse all rubrics →
              </Link>
            </div>
          </div>

          {/* Right panel — Manage Rubrics */}
          <div className="govdoc-surface flex flex-col overflow-hidden">
            <div className="px-7 pt-7 pb-6">
              {/* Icon + Badge */}
              <div className="mb-5 flex items-start justify-between">
                <div className="flex size-10 items-center justify-center bg-[var(--color-ink)] text-[var(--color-cream)]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" strokeLinejoin="round" className="size-[18px]">
                    <path d="m4 20 1-4L17 4l3 3L8 19z" />
                    <path d="m14 7 3 3" />
                  </svg>
                </div>
                <span className="govdoc-pill border-[#D6C2A0] text-[#8A6335] before:bg-[#C78B3A]">
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
                <Link href="/work/search/edit" className="hover:underline">
                  Manage
                </Link>{" "}
                <em
                  className="text-[var(--color-govdoc-primary)]"
                  style={{ fontStyle: "italic", fontWeight: 500 }}
                >
                  Rubrics
                </em>
              </h2>

              {/* Description */}
              <p className="text-[13px] leading-[1.55] text-[var(--color-ink-mute)]">
                Create, adjust, and version rubrics. Every change <strong>governed</strong> and <strong>audit-logged</strong>.
              </p>
            </div>

            {/* Big green CTA */}
            <div className="px-7 pb-5">
              <Link
                href="/work/search/edit"
                className="group/cta flex items-center gap-4 rounded-[8px] bg-[#345243] px-5 py-4 text-white no-underline transition-colors hover:bg-[#253f32]"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-white/10 border border-white/20">
                  <span className="text-lg leading-none font-light">+</span>
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-semibold">Create New Rubric</div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.1em] opacity-70">
                    Start with a template or from scratch
                  </div>
                </div>
                <span className="text-white/60 transition-transform group-hover/cta:translate-x-1">→</span>
              </Link>
            </div>

            {/* Divider with label */}
            <div className="px-7">
              <div className="border-t border-[var(--color-line)] pt-4 pb-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                ━━━ IN PROGRESS · 3 DRAFTS
              </div>
            </div>

            {/* Drafts list */}
            <div className="flex-1 px-7 pb-6">
              <ul className="space-y-4">
                {DRAFT_RUBRICS.map((d) => (
                  <li key={d.name} className="flex items-center gap-3">
                    <span className="inline-block size-[5px] shrink-0 rounded-full bg-[#b04a2f]" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[var(--color-ink-soft)]">{d.name}</div>
                      <div className="text-[11px] text-[var(--color-ink-faint)]">{d.version} · {d.progress}% complete</div>
                    </div>
                    <span className="shrink-0 rounded border border-[#e8c4b9] bg-[#faf4f1] px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[#b04a2f]">
                      {d.status}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-[var(--color-ink-faint)]">
                      {d.ago}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--color-line)] px-7 py-4 bg-[var(--color-cream-soft)]/20">
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-govdoc-primary)] px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-govdoc-primary)]">
                  <span className="govdoc-dot-glow size-[5px] rounded-full bg-[var(--color-govdoc-primary)]" />
                  ADMIN
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-govdoc-primary)] px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--color-govdoc-primary)]">
                  <span className="govdoc-dot-glow size-[5px] rounded-full bg-[var(--color-govdoc-primary)]" />
                  AUDIT-LOG
                </span>
              </div>
              <Link
                href="/work/search/edit"
                className="inline-flex items-center border border-[var(--color-ink)] bg-transparent hover:bg-[var(--color-ink)] hover:text-white px-4 py-1.5 rounded-full font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-ink)] transition-colors"
              >
                Open admin console →
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
}
