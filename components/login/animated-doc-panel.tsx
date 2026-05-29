"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface DocScenario {
  docLabel: string;
  docName: string;
  page: string;
  excerpts: { text: string; highlights: string[] }[];
  facts: { label: string; value: string }[];
  steps: string[];
  verdict: { line1: string; line2: string; tone: "breach" | "pass" | "review" };
  crossRef: string;
}

const SCENARIOS: DocScenario[] = [
  {
    docLabel: "DOC",
    docName: "CASE_47A · AGENCY_GRIEVANCE_2026-04.pdf",
    page: "Page 3 of 7",
    excerpts: [
      {
        text: "The complainant, ",
        highlights: ["a California resident"],
      },
      {
        text: ", alleges that on ",
        highlights: ["March 14, 2026"],
      },
      {
        text: ", the Department failed to process their application within the statutory window of ",
        highlights: ["45 business days"],
      },
      {
        text: " as required under ",
        highlights: ["Gov Code §11130"],
      },
    ],
    facts: [
      { label: "Complainant", value: "CA Resident" },
      { label: "Filed", value: "Jan 22, 2026" },
      { label: "Deadline", value: "Mar 26, 2026" },
      { label: "Statute", value: "Gov Code §11130" },
      { label: "Cross-ref", value: "CCR §15.04(b)" },
    ],
    steps: ["Identify statutory window", "Check timeline", "Detect breach"],
    verdict: { line1: "Procedural breach confirmed.", line2: "Recommend Tier-2 review.", tone: "breach" },
    crossRef: "Cross-referencing Gov Code §11130 with CCR §15.04(b) — 1 violation found",
  },
  {
    docLabel: "RFQ",
    docName: "SOLANO_COURTHOUSE · RFQ-2025-ATTACH-A.docx",
    page: "Page 12 of 34",
    excerpts: [
      {
        text: "The proposer shall demonstrate ",
        highlights: ["minimum 5 years experience"],
      },
      {
        text: " in public sector construction with ",
        highlights: ["LEED Silver certification"],
      },
      {
        text: " or above. All submissions must include ",
        highlights: ["bonding capacity of $50M"],
      },
      {
        text: " and evidence of ",
        highlights: ["prevailing wage compliance"],
      },
    ],
    facts: [
      { label: "Type", value: "RFQ Response" },
      { label: "Agency", value: "Solano County" },
      { label: "Min Exp.", value: "5 years" },
      { label: "Bond Req.", value: "$50M" },
      { label: "LEED", value: "Silver+" },
    ],
    steps: ["Extract qualification criteria", "Validate thresholds", "Check completeness"],
    verdict: { line1: "All mandatory criteria met.", line2: "Eligible for shortlist.", tone: "pass" },
    crossRef: "Validating against PCC §10115 public works qualification standards",
  },
  {
    docLabel: "APR",
    docName: "ROW_APPRAISAL · I-880_SR92_PARCEL-7.pdf",
    page: "Page 5 of 18",
    excerpts: [
      {
        text: "The appraiser certifies that the property at ",
        highlights: ["APN 0441-0012-003"],
      },
      {
        text: " has been inspected and valued at ",
        highlights: ["$2,340,000"],
      },
      {
        text: " using the ",
        highlights: ["Sales Comparison Approach"],
      },
      {
        text: " in conformance with ",
        highlights: ["USPAP Standards Rule 1-4"],
      },
    ],
    facts: [
      { label: "Parcel", value: "APN 0441-0012" },
      { label: "Value", value: "$2,340,000" },
      { label: "Method", value: "Sales Comp." },
      { label: "Standard", value: "USPAP SR 1-4" },
      { label: "Inspector", value: "J. Martinez, MAI" },
    ],
    steps: ["Verify certification present", "Check methodology", "Validate USPAP compliance"],
    verdict: { line1: "Certificate of Appraiser valid.", line2: "Recommend approval.", tone: "pass" },
    crossRef: "Cross-checking USPAP SR 1-4 with Caltrans ROW Manual Ch. 7 — compliant",
  },
  {
    docLabel: "DBE",
    docName: "CUCP_REEVAL · FIRM_NARRATIVE_2026.pdf",
    page: "Page 2 of 9",
    excerpts: [
      {
        text: "The firm reports ",
        highlights: ["gross revenues of $24.7M"],
      },
      {
        text: " for fiscal year 2025, exceeding the ",
        highlights: ["SBA size standard of $22.41M"],
      },
      {
        text: " for NAICS code ",
        highlights: ["237310"],
      },
      {
        text: ". Personal net worth reported as ",
        highlights: ["$1.12M (below $1.32M threshold)"],
      },
    ],
    facts: [
      { label: "Firm Rev.", value: "$24.7M" },
      { label: "SBA Cap", value: "$22.41M" },
      { label: "NAICS", value: "237310" },
      { label: "PNW", value: "$1.12M" },
      { label: "Threshold", value: "$1.32M" },
    ],
    steps: ["Extract financial data", "Compare SBA size standards", "Evaluate 49 CFR §26.67"],
    verdict: { line1: "Revenue exceeds SBA cap.", line2: "Recommend decertification review.", tone: "review" },
    crossRef: "Evaluating against 49 CFR §26.67(b)(1) — size standard exceeded",
  },
];

const TONE_COLORS = {
  breach: "text-red-300",
  pass: "text-emerald-300",
  review: "text-amber-300",
};

export function AnimatedDocPanel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "analyzing" | "verdict">("typing");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [factIdx, setFactIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);

  const scenario = SCENARIOS[activeIdx];

  useEffect(() => {
    setPhase("typing");
    setHighlightIdx(0);
    setFactIdx(0);
    setStepIdx(0);

    const highlightTimer = setInterval(() => {
      setHighlightIdx((prev) => {
        if (prev >= scenario.excerpts.length - 1) {
          clearInterval(highlightTimer);
          setPhase("analyzing");
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(highlightTimer);
  }, [activeIdx, scenario.excerpts.length]);

  useEffect(() => {
    if (phase !== "analyzing") return;
    const factTimer = setInterval(() => {
      setFactIdx((prev) => {
        if (prev >= scenario.facts.length - 1) {
          clearInterval(factTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    const stepTimer = setTimeout(() => {
      const si = setInterval(() => {
        setStepIdx((prev) => {
          if (prev >= scenario.steps.length - 1) {
            clearInterval(si);
            setTimeout(() => setPhase("verdict"), 600);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
      return () => clearInterval(si);
    }, scenario.facts.length * 400);

    return () => {
      clearInterval(factTimer);
      clearTimeout(stepTimer);
    };
  }, [phase, scenario.facts.length, scenario.steps.length]);

  // Cycle to next scenario after verdict shows
  useEffect(() => {
    if (phase !== "verdict") return;
    const next = setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % SCENARIOS.length);
    }, 4000);
    return () => clearTimeout(next);
  }, [phase]);

  return (
    <div className="flex-1 overflow-hidden rounded-[4px] border border-[var(--color-line)]">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-cream-soft)] px-5 py-3">
        <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
          <span className="rounded border border-[var(--color-line)] px-1 text-[8px]">{scenario.docLabel}</span>
          <motion.span key={activeIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {scenario.docName}
          </motion.span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
          <motion.span
            className="inline-block size-1.5 rounded-full bg-[#2d8c4a]"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          Agent Active · {phase === "typing" ? "Reading" : phase === "analyzing" ? "Analyzing" : "Complete"}
        </span>
      </div>

      {/* Panel body */}
      <div className="grid grid-cols-[1fr_1fr]">
        {/* Document excerpt */}
        <div className="relative min-h-[340px] border-r border-[var(--color-line)] bg-[#f5f2ea] p-5 pb-16">
          <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            — Excerpt · {scenario.page}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="text-[12.5px] leading-[1.7] text-[var(--color-ink-soft)]"
              style={{ fontFamily: "var(--font-document)" }}
            >
              <p>
                {scenario.excerpts.map((ex, i) => (
                  <span key={i}>
                    {ex.text}
                    {ex.highlights.map((h, hi) => (
                      <motion.span
                        key={hi}
                        className="rounded-sm px-0.5 text-[var(--color-ink)]"
                        initial={{ backgroundColor: "rgba(43,77,58,0)" }}
                        animate={{
                          backgroundColor: i <= highlightIdx ? "rgba(43,77,58,0.20)" : "rgba(43,77,58,0)",
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        {h}
                      </motion.span>
                    ))}
                  </span>
                ))}
                {phase !== "typing" && (
                  <motion.span
                    className="ml-1 inline-block h-3 w-2 bg-[var(--color-govdoc-primary)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Bottom tooltip */}
          <AnimatePresence>
            {phase !== "typing" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-[8px] bg-[#1a1a1a] px-4 py-2.5 text-[11px] text-white"
              >
                <span className="inline-block size-2 rounded-full bg-[#2d8c4a]" />
                <span className="font-mono text-[10px] tracking-[0.02em]">{scenario.crossRef}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analysis side */}
        <div className="bg-[var(--color-cream-soft)] p-5">
          {/* Facts */}
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] font-mono text-[8px] font-bold text-white">01</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">Extracted Facts</span>
            </div>
            <div className="space-y-1.5 font-mono text-[10.5px] text-[var(--color-ink-soft)]">
              {scenario.facts.map((fact, i) => (
                <motion.div
                  key={`${activeIdx}-${i}`}
                  className="flex gap-4"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: i <= factIdx && phase !== "typing" ? 1 : 0, x: i <= factIdx && phase !== "typing" ? 0 : -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="w-[80px] text-[var(--color-ink-mute)]">{fact.label}</span>
                  <span>{fact.value}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="mb-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] font-mono text-[8px] font-bold text-white">02</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">Reasoning Path</span>
            </div>
            <div className="space-y-1.5 font-mono text-[10.5px] text-[var(--color-ink-soft)]">
              {scenario.steps.map((step, i) => (
                <motion.div
                  key={`${activeIdx}-step-${i}`}
                  className="flex gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: i <= stepIdx && phase !== "typing" ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-[var(--color-ink-mute)]">{String(i + 1).padStart(2, "0")}</span>
                  <span>{step}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Verdict */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] font-mono text-[8px] font-bold text-white">03</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">Verdict</span>
            </div>
            <AnimatePresence mode="wait">
              {phase === "verdict" && (
                <motion.div
                  key={`verdict-${activeIdx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-[8px] bg-[#0a0a0a] px-4 py-3 text-[13px] leading-[1.6] text-white/90"
                >
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
                    <span className={TONE_COLORS[scenario.verdict.tone]}>{scenario.verdict.line1}</span>
                  </span>
                  <br />
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
                    {scenario.verdict.line2}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Scenario indicator dots */}
      <div className="flex items-center justify-center gap-2 border-t border-[var(--color-line)] bg-[var(--color-cream-soft)] py-2">
        {SCENARIOS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIdx(i)}
            className={`size-2 rounded-full transition-all ${i === activeIdx ? "scale-125 bg-[var(--color-govdoc-primary)]" : "bg-[var(--color-line)] hover:bg-[var(--color-ink-mute)]"}`}
          />
        ))}
      </div>
    </div>
  );
}
