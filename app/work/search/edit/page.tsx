"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Pencil, Trash2, Upload, Plus, Settings } from "lucide-react";

/* ─── Rubric data (CMGC-PDE Caltrans CUCP questions) ─── */
const SECTIONS = [
  {
    id: "A",
    title: "Project Scope & Characteristics",
    description: "Foundational definition of work and deliverables",
    weight: 38,
    questions: [
      {
        id: "A1",
        text: "Where is the Project in the project development process?",
        options: [
          "Detailed or final engineering stage (60% design or later).",
          "Preliminary design (30% design).",
          "Conceptual engineering stage (before PA&ED).",
        ],
      },
      {
        id: "A2",
        text: "What is the size of the Project?",
        options: [
          "Small project (less than $25 million construction capital cost).",
          "Medium size project (between $25 to $75 million construction capital cost).",
          "Large project (greater than $75 million construction capital cost).",
        ],
      },
      {
        id: "A3",
        text: "What is the complexity of the Project?",
        options: [
          "Relatively simple project with no need for specialized outside expertise.",
          "Project with more technically complex components and schedule complexity.",
          "Very complex project with significant schedule complexity (e.g., multiple phases, extensive third-party issues, and/or specialized expertise needed).",
        ],
      },
      {
        id: "A4",
        text: "Does the Project involve significant impacts to highway users and local businesses/community during construction?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "A5",
        text: "Does the Project present right of way limitations that would benefit from the Entity's assistance?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "A6",
        text: "Does the Project present environmental permitting issues that would benefit from the Entity's assistance?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "A7",
        text: "Does the Project present utility or third-party issues that would benefit from the Entity's assistance?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "A8",
        text: "Does the Project present unique work restrictions (e.g., strict environmental windows, railroad restrictions) or traffic maintenance requirements that would benefit from the Entity's assistance?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "A9",
        text: "Would the Project benefit by packaging features of work to allow early lock-in of construction materials/labor pricing?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "A10",
        text: "Would the Project benefit by raising quality standards/benchmarks to minimize maintenance and achieve lower life-cycle cost?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
    ],
  },
  {
    id: "B",
    title: "Schedule Issues",
    description: "Timeline compression and fast-tracking opportunities",
    weight: 15,
    questions: [
      {
        id: "B1",
        text: "Can time savings be realized through concurrent design and construction activities (fast-tracking)?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "B2",
        text: "Can the schedule be compressed?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
    ],
  },
  {
    id: "C",
    title: "Opportunity for Innovation",
    description: "Scope for alternate designs and performance specifications",
    weight: 12,
    questions: [
      {
        id: "C1",
        text: "Will the Project scope allow for innovation (e.g., alternate designs, traffic management, construction means and methods, etc.)?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "C2",
        text: "Must the Project scope be primarily defined in terms of prescriptive specifications, or can performance specifications be used, or a combination of both?",
        options: [
          "Primarily prescriptive specifications.",
          "Combination of prescriptive and performance specifications.",
          "Performance specifications for significant elements.",
        ],
      },
    ],
  },
  {
    id: "D",
    title: "Quality Enhancement",
    description: "Value engineering and lifecycle quality improvements",
    weight: 10,
    questions: [
      {
        id: "D1",
        text: "Will there be opportunities for the Entity to provide materials or methods that provide greater value than normally specified by the state on similar projects?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "D2",
        text: "Will there be the opportunity for realization of greater value due to designs tailored to Entity's area of expertise?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "D3",
        text: "Will warranties or maintenance agreements be used?",
        options: [
          "No.",
          "Limited to short-term workmanship and materials.",
          "Much more than typical.",
        ],
      },
    ],
  },
  {
    id: "E",
    title: "Cost Issues",
    description: "Budget control, funding, and procurement economics",
    weight: 20,
    questions: [
      {
        id: "E1",
        text: "Will there be opportunities for the Entity to provide designs with lower initial construction costs than those typically specified by the state?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "E2",
        text: "Will there be opportunities for the Entity to provide alternate design concepts with lower lifecycle costs than those typically specified by the state?",
        options: ["No more than typical.", "More than typical.", "Much more than typical."],
      },
      {
        id: "E3",
        text: "Is funding for the Project committed and available?",
        options: [
          "Secured for design phase only or cannot support accelerated construction.",
          "Funding can accommodate fast-tracking to some extent.",
          "Funding will accommodate compressed schedule/fast-tracking.",
        ],
      },
      {
        id: "E4",
        text: "Will the cost of procurement affect the number of bidders?",
        options: [
          "Procurement cost would significantly limit competition.",
          "Procurement cost could affect the number of bidders.",
          "Procurement cost would not be a significant issue given the size or complexity of the Project.",
        ],
      },
      {
        id: "E5",
        text: "Will Project budget control benefit from the use of formal contingencies?",
        options: [
          "No benefit.",
          "A formal contingency may permit the Department to add Project scope or enhance quality within the constraints of its published budget.",
          "A formal contingency is required to allow the Department to maximize Project scope and quality within the constraints of its published budget.",
        ],
      },
    ],
  },
  {
    id: "F",
    title: "Staffing Issues",
    description: "Resource availability and expertise requirements",
    weight: 13,
    questions: [
      {
        id: "F1",
        text: "Does the Department have the expertise and resources necessary for a complicated procurement process?",
        options: [
          "Inadequate resources or expertise.",
          "Limited resources or expertise.",
          "Adequate resources and expertise.",
        ],
      },
      {
        id: "F2",
        text: "Are resources available to complete the design?",
        options: [
          "Resources are available to complete design.",
          "Resources are available for partial design.",
          "Specialized expertise, not available in-house, is required.",
        ],
      },
      {
        id: "F3",
        text: "Are resources available to provide construction oversight?",
        options: [
          "Resources are available.",
          "Full-time construction oversight could strain staff resources.",
          "Resources are unavailable.",
        ],
      },
    ],
  },
];

const TOTAL_QUESTIONS = SECTIONS.reduce((sum, s) => sum + s.questions.length, 0);

const TABS = [
  { label: "Manage Project", count: TOTAL_QUESTIONS },
  { label: "Manage Appraisal", count: 6 },
  { label: "Manage Narrative", count: 11 },
];

const VERSION_HISTORY = [
  {
    version: "v002",
    current: true,
    date: "09 May 2026 · 11:34 AM",
    author: "JOTHI",
    note: "Updated weights for Section 01 — Project Scope & Characteristics",
  },
  {
    version: "v001",
    current: false,
    date: "07 May 2026 · 04:42 PM",
    author: "JOTHI",
    note: "Initial rubric — 6 sections, 25 questions established.",
  },
];

export default function ManageRubricsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string>("A");

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? "" : id);
  };

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
        <nav className="mb-7 flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
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
          <span className="font-medium text-[var(--color-ink)]">Manage Rubrics</span>
        </nav>

        {/* Section label */}
        <div className="mb-5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
          <span className="mr-2 text-[var(--color-line)]">━━━</span>
          03&nbsp;&nbsp;RUBRICS&nbsp;&middot;&nbsp;MANAGE
        </div>

        {/* Header row: title + badge + version info */}
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-3">
            <h1
              className="leading-none tracking-[-0.025em] text-[var(--color-ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: "clamp(34px, 4vw, 48px)",
                fontVariationSettings: '"opsz" 96',
              }}
            >
              Manage{" "}
              <em
                className="text-[var(--color-govdoc-primary)]"
                style={{ fontStyle: "italic", fontWeight: 300 }}
              >
                Rubrics.
              </em>
            </h1>
            <p className="max-w-[62ch] text-[14.5px] leading-[1.6] text-[var(--color-ink-mute)]">
              Build and refine the scoring rubrics GovDoc applies to each review type. Add
              questions, set weights, adjust options &mdash;{" "}
              <strong className="font-semibold text-[var(--color-ink-soft)]">
                every change is versioned and audit-logged
              </strong>
              .
            </p>
          </div>

          <div className="shrink-0 space-y-2 text-right">
            {/* Admin badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-emerald-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ACTIVE&nbsp;&middot;&nbsp;EDIT MODE
            </span>
            {/* Version info */}
            <div className="space-y-0.5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[var(--color-ink-faint)]">
              <div>EDITING: <span className="font-bold text-[var(--color-ink-soft)]">V1.0.0</span></div>
              <div>LAST SAVED: <span className="font-bold text-[var(--color-ink-soft)]">09 MAY 2026</span></div>
              <div>AUTHOR: <span className="font-bold text-[var(--color-ink-soft)]">JOTHI</span></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 border-b border-[var(--color-line)]">
          {TABS.map((tab, i) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(i)}
              className={`relative px-4 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors ${
                activeTab === i
                  ? "text-[var(--color-ink)] after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-[var(--color-govdoc-primary)]"
                  : "text-[var(--color-ink-mute)] hover:text-[var(--color-ink-soft)]"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] text-[9px] font-bold text-white">
                  {tab.count}
                </span>
              )}
              {tab.count === 0 && (
                <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-line)] text-[9px] font-bold text-[var(--color-ink-faint)]">
                  0
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2.5">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
            <span className="text-[var(--color-ink-faint)]">RUBRIC:</span>
            <span className="font-medium">Manage Project</span>
            <ChevronDown className="size-3 text-[var(--color-ink-faint)]" />
          </div>
          <div className="mx-3 h-5 w-px bg-[var(--color-line)]" />
          <button className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-emerald-700">
            <Plus className="size-3" />
            New Section
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-cream)]">
            <Upload className="size-3" />
            Upload
          </button>
          <button className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] bg-[var(--color-cream-soft)] px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-cream)]">
            <Settings className="size-3" />
            Compare
            <ChevronDown className="size-3" />
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-0">
          {SECTIONS.map((section, idx) => {
            const isExpanded = expandedSection === section.id;
            const sectionNum = String(idx + 1).padStart(2, "0");

            return (
              <div
                key={section.id}
                className={`border border-[var(--color-line)] ${idx === 0 ? "rounded-t-lg" : ""} ${idx === SECTIONS.length - 1 ? "rounded-b-lg" : ""} ${idx > 0 ? "-mt-px" : ""} ${isExpanded ? "bg-[var(--color-paper)]" : "bg-[var(--color-cream-soft)]"}`}
              >
                {/* Section header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <span className="font-mono text-[12px] font-bold text-[var(--color-ink-faint)]">
                    {sectionNum}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold text-[var(--color-ink)]">
                      {section.title}
                    </div>
                    <div className="mt-0.5 text-[12px] text-[var(--color-ink-mute)]">
                      {section.description}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-ink-faint)]">
                    {section.questions.length} QUESTIONS&nbsp;&middot;&nbsp;{section.weight}%
                  </span>
                  {isExpanded ? (
                    <span className="inline-flex items-center gap-1.5 rounded border border-[var(--color-line)] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-cream)]">
                      <Pencil className="size-3" />
                      Edit Section
                    </span>
                  ) : null}
                  {isExpanded ? (
                    <span className="inline-flex items-center justify-center rounded border border-[var(--color-line)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="size-3.5" />
                    </span>
                  ) : null}
                  <span className="text-[var(--color-ink-faint)]">
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                  </span>
                </button>

                {/* Expanded questions */}
                {isExpanded && (
                  <div className="border-t border-[var(--color-line-soft)] px-5 pb-5">
                    <div className="divide-y divide-[var(--color-line-soft)]">
                      {section.questions.map((q, qi) => {
                        const qNum = String(qi + 1).padStart(2, "0");
                        return (
                          <div key={q.id} className="group/question py-4">
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 font-mono text-[11px] font-bold text-[var(--color-ink-faint)]">
                                {qNum}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] font-medium leading-[1.5] text-[var(--color-ink-soft)]">
                                  {q.text}
                                </div>
                                <div className="mt-2 space-y-1">
                                  {q.options.map((opt, oi) => (
                                    <div
                                      key={oi}
                                      className="flex items-start gap-2 text-[12px] leading-[1.5] text-[var(--color-ink-mute)]"
                                    >
                                      <span className="mt-px font-mono font-bold text-[var(--color-ink-faint)]">
                                        {String.fromCharCode(65 + oi)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover/question:opacity-100">
                                <button className="inline-flex items-center gap-1 rounded border border-[var(--color-line)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-cream)]">
                                  <Pencil className="size-2.5" />
                                  Edit
                                </button>
                                <button className="inline-flex items-center justify-center rounded border border-[var(--color-line)] p-1 text-[var(--color-ink-faint)] transition-colors hover:bg-red-50 hover:text-red-500">
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add question button */}
                    <button className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--color-line)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink-mute)] transition-colors hover:border-[var(--color-govdoc-primary)] hover:text-[var(--color-govdoc-primary)]">
                      <Plus className="size-3" />
                      Add question to this section
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Version History */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
            <div>
              <span className="mr-2 text-[var(--color-line)]">━━━</span>
              VERSION HISTORY
            </div>
            <div className="flex items-center gap-6 text-[var(--color-ink-faint)]">
              <span>
                TOTAL VERSIONS:{" "}
                <span className="font-bold text-[var(--color-ink-soft)]">
                  {String(VERSION_HISTORY.length).padStart(2, "0")}
                </span>
              </span>
              <span>RETENTION: 90 DAYS</span>
            </div>
          </div>

          <div className="space-y-3">
            {VERSION_HISTORY.map((v) => (
              <div
                key={v.version}
                className="flex items-start gap-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-4"
              >
                <span className="font-mono text-[12px] font-bold text-[var(--color-ink-soft)]">
                  {v.version}
                </span>
                {v.current && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                    Current
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-[var(--color-ink-faint)]">
                    {v.date}&nbsp;&nbsp;AUTHOR: {v.author}
                  </div>
                  <div className="mt-1 text-[13px] text-[var(--color-ink-mute)]">{v.note}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button className="inline-flex items-center gap-1 rounded border border-[var(--color-line)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-cream)]">
                    &#8634; Restore
                  </button>
                  <button className="inline-flex items-center justify-center rounded border border-[var(--color-line)] p-1.5 text-[var(--color-ink-faint)] transition-colors hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom status bar */}
        <div className="mt-8 flex items-center justify-between rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-5 py-3">
          <span className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-emerald-600">
            <span>&#9670;</span>
            NO UNSAVED CHANGES
          </span>
          <div className="flex items-center gap-2">
            <button className="rounded-md border border-[var(--color-line)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--color-ink-mute)] transition-colors hover:bg-[var(--color-cream)]">
              Save Section
            </button>
            <button className="rounded-md bg-[var(--color-ink)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--color-ink-soft)]">
              Save
            </button>
            <button className="rounded-md bg-[var(--color-govdoc-primary)] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-white transition-colors hover:bg-[var(--color-govdoc-deep)]">
              &#10003; Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
