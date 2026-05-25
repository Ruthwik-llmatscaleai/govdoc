"use client";

import { useState } from "react";
import type { CmgcRubricData } from "@/lib/usecases/cmgc-pde/rubric-data";
import type { CucpRubricData } from "@/lib/usecases/cucp-reevals/rubric-data";
import type { RowRubricData } from "@/lib/usecases/row-appraisal/rubric-data";
import type { RubricsManifestEntry } from "@/lib/usecases/rubrics-store";
import type { RubricQuestion } from "@/lib/usecases/cmgc-pde/rubric";

type Props = {
  cmgc: CmgcRubricData;
  cucp: CucpRubricData;
  row: RowRubricData;
  cmgcRubrics: readonly RubricsManifestEntry[];
  cucpRubrics: readonly RubricsManifestEntry[];
  rowRubrics: readonly RubricsManifestEntry[];
};

type TabId = "cmgc-pde" | "cucp-reevals" | "row-appraisal";

const SECTION_KEYS = ["A", "B", "C", "D", "E", "F"] as const;

const SECTION_DESCRIPTIONS: Record<string, string> = {
  "Project Scope & Characteristics": "Foundational definition of work and deliverables",
  "Schedule Issues": "Timeline compression and fast-tracking opportunities",
  "Opportunity for Innovation": "Scope for alternate designs and performance specs",
  "Quality Enhancement": "Value engineering and maintenance provisions",
  "Cost Issues": "Budget, funding, and procurement considerations",
  "Staffing Issues": "Department expertise and resource availability",
};

function sectionNameOnly(label: string): string {
  const m = label.match(/^[A-Z]:\s*(.+)$/);
  return m?.[1] ?? label;
}

export function ReviewRubricsClient({
  cmgc,
  cucp,
  row,
  cmgcRubrics,
  cucpRubrics,
  rowRubrics,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("cmgc-pde");
  const [cmgcData, setCmgcData] = useState(cmgc);
  const [cucpData, setCucpData] = useState(cucp);
  const [rowData, setRowData] = useState(row);
  const [selectedRubricId, setSelectedRubricId] = useState("default");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["A"]),
  );

  const cmgcCount = cmgcData.questions.length;
  const cucpCount = cucpData.l2.length + cucpData.l3.length;
  const rowCount = Object.keys(rowData).length;

  // Group CMGC questions by section
  const bySection = new Map<string, { name: string; qs: RubricQuestion[] }>();
  for (const q of cmgcData.questions) {
    const key =
      q.section.match(/^([A-Z]):/)?.[1] ?? q.section.charAt(0);
    const name = sectionNameOnly(q.section);
    const cur = bySection.get(key) ?? { name, qs: [] };
    cur.qs.push(q);
    bySection.set(key, cur);
  }
  const sections = SECTION_KEYS.map((k) => ({
    key: k,
    name: bySection.get(k)?.name ?? k,
    qs: bySection.get(k)?.qs ?? [],
    weight: cmgcData.weights[k],
  }));

  const totalQuestions = sections.reduce((sum, s) => sum + s.qs.length, 0);
  const sectionCount = sections.filter((s) => s.qs.length > 0).length;

  function toggleSection(key: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const currentRubrics =
    activeTab === "cmgc-pde"
      ? cmgcRubrics
      : activeTab === "cucp-reevals"
        ? cucpRubrics
        : rowRubrics;

  const selectedEntry =
    currentRubrics.find((r) => r.id === selectedRubricId) ?? currentRubrics[0];

  async function handleRubricSelect(id: string) {
    if (id === selectedRubricId) return;
    setSelectedRubricId(id);
    setDropdownOpen(false);
    try {
      const res = await fetch(
        `/api/usecases/${activeTab}/rubric?rubric=${encodeURIComponent(id)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      if (activeTab === "cmgc-pde") setCmgcData(data);
      else if (activeTab === "cucp-reevals") setCucpData(data);
      else setRowData(data);
    } catch {
      // silent — keep current data
    }
  }

  const tabLabel = activeTab === "cmgc-pde" ? "Validate Project" : activeTab === "cucp-reevals" ? "Validate Narrative" : "Validate Appraisal";

  return (
    <div className="space-y-0">
      {/* Tabs */}
      <div className="flex items-stretch border-b border-[var(--color-line)]">
        <TabBtn
          active={activeTab === "cmgc-pde"}
          onClick={() => { setActiveTab("cmgc-pde"); setExpandedSections(new Set(["A"])); }}
          label="Validate Project"
          count={cmgcCount}
          accent
        />
        <TabBtn
          active={activeTab === "row-appraisal"}
          onClick={() => { setActiveTab("row-appraisal"); setExpandedSections(new Set()); }}
          label="Validate Appraisal"
          count={rowCount}
        />
        <TabBtn
          active={activeTab === "cucp-reevals"}
          onClick={() => { setActiveTab("cucp-reevals"); setExpandedSections(new Set()); }}
          label="Validate Narrative"
          count={cucpCount}
        />
      </div>

      {/* Metadata bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          <span>
            Rubric:{" "}
            <strong className="font-semibold text-[var(--color-ink)]">
              {tabLabel}
            </strong>
          </span>
          <span className="text-[var(--color-line)]">|</span>
          <span>
            Sections:{" "}
            <strong className="font-semibold text-[var(--color-ink)]">
              {String(sectionCount).padStart(2, "0")}
            </strong>
          </span>
          <span className="text-[var(--color-line)]">|</span>
          <span>
            Scale:{" "}
            <strong className="font-semibold text-[var(--color-ink)]">
              A / B / C
            </strong>
          </span>
          <span className="text-[var(--color-line)]">|</span>
          <span>
            Delivery Methods:{" "}
            <strong className="font-semibold text-[var(--color-ink)]">
              08
            </strong>
          </span>
        </div>

        {/* Rubric selector dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="inline-flex items-center gap-2 border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[var(--color-ink-soft)] transition hover:bg-[var(--color-cream)]"
          >
            <span>Rubric:</span>
            <span className="font-semibold text-[var(--color-ink)]">
              {selectedEntry?.label ?? "Default"}
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-lg">
              {currentRubrics.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRubricSelect(r.id)}
                  className={`flex w-full items-center px-3 py-2 text-left font-mono text-[10.5px] uppercase tracking-[0.1em] transition hover:bg-[var(--color-cream-soft)] ${
                    r.id === selectedRubricId
                      ? "bg-[var(--color-cream-soft)] font-semibold text-[var(--color-ink)]"
                      : "text-[var(--color-ink-mute)]"
                  }`}
                >
                  {r.label}
                  {r.isDefault && (
                    <span className="ml-2 text-[9px] text-[var(--color-ink-faint)]">
                      (default)
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question sections — CMGC view (the primary/first tab) */}
      {activeTab === "cmgc-pde" && (
        <div className="mt-4 border border-[var(--color-line)] bg-[var(--color-paper)]">
          {sections.map((s, i) => {
            const isOpen = expandedSections.has(s.key);
            const weightPct = Math.round(s.weight * 100);
            const desc =
              SECTION_DESCRIPTIONS[s.name] ?? "";
            return (
              <div
                key={s.key}
                className="border-b border-[var(--color-line)] last:border-b-0"
              >
                {/* Section header */}
                <button
                  type="button"
                  onClick={() => toggleSection(s.key)}
                  className="grid w-full cursor-pointer select-none grid-cols-[32px_1fr_auto_auto] items-center gap-4 bg-transparent px-6 py-5 text-left transition-colors hover:bg-[var(--color-cream-soft)]"
                >
                  <span className="font-mono text-[12px] font-bold tracking-[0.08em] text-[var(--color-govdoc-primary)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span
                      className="block text-[17px] font-medium leading-[1.3] tracking-[-0.01em] text-[var(--color-ink)]"
                      style={{
                        fontFamily: "var(--font-display)",
                        fontVariationSettings: '"opsz" 48',
                      }}
                    >
                      {s.name}
                    </span>
                    {desc && (
                      <span className="mt-0.5 block text-[12px] leading-[1.4] text-[var(--color-ink-faint)]">
                        {desc}
                      </span>
                    )}
                  </div>
                  <span className="border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                    {s.qs.length} questions · {weightPct}%
                  </span>
                  <span
                    className={`flex transition-transform ${
                      isOpen
                        ? "rotate-90 text-[var(--color-govdoc-primary)]"
                        : "text-[var(--color-ink-mute)]"
                    }`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="square"
                      className="size-3.5"
                    >
                      <path d="m6 4 4 4-4 4" />
                    </svg>
                  </span>
                </button>

                {/* Section body (expanded) */}
                {isOpen && (
                  <div className="px-6 pb-6 pl-[72px]">
                    <ol className="flex list-none flex-col gap-5">
                      {s.qs.map((q, qi) => (
                        <li
                          key={q.id}
                          className="border-b border-[var(--color-line)] pb-4 last:border-b-0 last:pb-0"
                        >
                          <div className="grid grid-cols-[24px_1fr] items-baseline gap-3 text-[13.5px] leading-[1.55] text-[var(--color-ink-soft)]">
                            <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-[var(--color-ink-faint)]">
                              {String(qi + 1).padStart(2, "0")}
                            </span>
                            <span className="font-medium text-[var(--color-ink)]">
                              {q.question}
                            </span>
                          </div>
                          <dl className="mt-2.5 ml-[36px] flex flex-col gap-1.5">
                            <OptionRow letter="A" text={q.option_a} />
                            <OptionRow letter="B" text={q.option_b} />
                            <OptionRow letter="C" text={q.option_c} />
                          </dl>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CUCP view */}
      {activeTab === "cucp-reevals" && (
        <div className="mt-4 border border-[var(--color-line)] bg-[var(--color-paper)]">
          {/* L2 Categories */}
          <div className="border-b border-[var(--color-line)] px-6 py-4">
            <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              L2 Categories ({cucpData.l2.length})
            </h3>
          </div>
          {cucpData.l2.map((cat, i) => (
            <div
              key={cat.name}
              className="border-b border-[var(--color-line)] px-6 py-4 last:border-b-0"
            >
              <div className="grid grid-cols-[32px_1fr] items-baseline gap-3">
                <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-[var(--color-govdoc-primary)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="text-[14px] font-medium text-[var(--color-ink)]">
                    {cat.name}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-[1.5] text-[var(--color-ink-mute)]">
                    {cat.description}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {/* L3 Criteria */}
          <div className="border-b border-[var(--color-line)] border-t border-t-[var(--color-line)] px-6 py-4">
            <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              L3 Criteria ({cucpData.l3.length})
            </h3>
          </div>
          {cucpData.l3.map((crit) => (
            <div
              key={crit.s_no}
              className="border-b border-[var(--color-line)] px-6 py-4 last:border-b-0"
            >
              <div className="grid grid-cols-[32px_1fr] items-baseline gap-3">
                <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-[var(--color-govdoc-primary)]">
                  {String(crit.s_no).padStart(2, "0")}
                </span>
                <div>
                  <span className="text-[14px] font-medium text-[var(--color-ink)]">
                    {crit.title ?? crit.name}
                  </span>
                  {crit.pass && (
                    <div className="mt-2 grid grid-cols-[24px_1fr] gap-2">
                      <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-green-700">
                        PASS
                      </span>
                      <span className="text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">
                        {crit.pass}
                      </span>
                    </div>
                  )}
                  {crit.fail && (
                    <div className="mt-1.5 grid grid-cols-[24px_1fr] gap-2">
                      <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-red-700">
                        FAIL
                      </span>
                      <span className="text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">
                        {crit.fail}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ROW view */}
      {activeTab === "row-appraisal" && (
        <div className="mt-4 border border-[var(--color-line)] bg-[var(--color-paper)]">
          {Object.entries(rowData).map(([category, tiers], i) => (
            <div
              key={category}
              className="border-b border-[var(--color-line)] px-6 py-4 last:border-b-0"
            >
              <div className="grid grid-cols-[32px_1fr] items-baseline gap-3">
                <span className="font-mono text-[11px] font-bold tracking-[0.06em] text-[var(--color-govdoc-primary)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <span className="text-[14px] font-medium text-[var(--color-ink)]">
                    {category}
                  </span>
                  <div className="mt-2 flex flex-col gap-1">
                    {(["1", "2", "3", "4", "5"] as const).map((tier) => (
                      <div
                        key={tier}
                        className="grid grid-cols-[20px_1fr] items-baseline gap-2"
                      >
                        <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-[var(--color-ink-faint)]">
                          {tier}.
                        </span>
                        <span className="text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">
                          {tiers[tier]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-[var(--color-ink)] px-6 py-4">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-cream)]">
          <span className="text-[var(--color-govdoc-primary)]">◆</span>
          <span className="border border-[var(--color-ink-mute)] px-2 py-0.5 text-[10px]">
            Summary
          </span>
          <span className="text-[var(--color-cream)]/80">
            {tabLabel} rubric — inspection view across all sections.
          </span>
        </div>
        <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-cream)]/70">
          <span>
            Sections:{" "}
            <strong className="font-semibold text-[var(--color-cream)]">
              {String(sectionCount).padStart(2, "0")}
            </strong>
          </span>
          <span>
            Questions:{" "}
            <strong className="font-semibold text-[var(--color-cream)]">
              {totalQuestions}
            </strong>
          </span>
          <span>
            Weight:{" "}
            <strong className="font-semibold text-[var(--color-cream)]">
              100%
            </strong>
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 space-y-4 border-t border-[var(--color-line)] pt-6">
        <p className="max-w-[52ch] text-[13px] leading-[1.6] text-[var(--color-ink-mute)] italic">
          Reads the document. Checks the policy. Tells you pass or fail
          — with full citations and audit trail.
        </p>
        <div className="flex flex-wrap items-center gap-5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          <span>
            Rubric ID:{" "}
            <strong className="font-semibold text-[var(--color-ink)]">
              VP-2026-05-09
            </strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-[6px] rounded-full bg-[#2d8c4a]" />
            Published &amp; Locked
          </span>
        </div>
      </footer>
    </div>
  );
}

function OptionRow({ letter, text }: { letter: "A" | "B" | "C"; text: string }) {
  return (
    <div className="grid grid-cols-[20px_1fr] items-baseline gap-2.5">
      <span className="font-mono text-[10.5px] font-semibold tracking-[0.08em] text-[var(--color-govdoc-primary)]">
        {letter}
      </span>
      <span className="text-[12.5px] leading-[1.5] text-[var(--color-ink-soft)]">
        {text}
      </span>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
  count,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 border-b-2 px-5 py-3.5 text-[13.5px] font-medium tracking-[-0.005em] transition-colors -mb-px ${
        active
          ? "border-[var(--color-govdoc-primary)] font-semibold text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-ink-mute)] hover:bg-[var(--color-cream-soft)] hover:text-[var(--color-ink)]"
      }`}
    >
      <span>{label}</span>
      <span
        className={`border px-1.5 py-0.5 font-mono text-[10px] tracking-[0.08em] ${
          active
            ? "border-[var(--color-govdoc-primary)] bg-[var(--color-govdoc-primary)]/10 text-[var(--color-govdoc-primary)]"
            : "border-[var(--color-line)] bg-[var(--color-cream-soft)] text-[var(--color-ink-faint)]"
        }`}
      >
        {accent && active ? "●" : ""}{count}
      </span>
    </button>
  );
}
