"use client";

import { motion } from "framer-motion";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.35 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function ProcessFlow() {
  return (
    <section className="govdoc-page-pad pb-10 pt-5 lg:pb-16 lg:pt-8">
      <div className="govdoc-page-inner">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          {/* LEFT SIDE — Text content (~38%) */}
          <motion.div
            className="flex flex-col justify-center lg:w-[38%]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} className="mb-8 inline-flex w-fit items-center gap-[13px] rounded-full border border-[#78917d] bg-[rgba(247,242,229,0.72)] px-[26px] py-[11px] font-mono text-[11px] font-extrabold uppercase tracking-[0.35em] text-[#20382a]">
              <RadiatingDot color="#2b4d3a" size={13} /> Document Intelligence · Done Right
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mb-6 leading-[0.96] tracking-[0] text-[#1a1d18]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(52px, 5vw, 74px)",
                fontVariationSettings: '"opsz" 96',
              }}
            >
              Reads. Checks.
              <br />
              <em
                className="text-[#2b4d3a]"
                style={{ fontStyle: "italic", fontWeight: 500 }}
              >
                Decides.
              </em>
            </motion.h2>

            <motion.p variants={fadeUp} className="mb-8 max-w-[680px] text-[18px] leading-[1.43] tracking-[-0.15px] text-[#242720]">
              An <strong className="font-extrabold text-[#1a1d18]">agentic document-intelligence platform</strong> that
              reads complex documents, checks them against your policy, and tells you{" "}
              <em className="italic" style={{ fontFamily: "var(--font-display)" }}>pass or fail</em> — with the{" "}
              <strong className="font-extrabold text-[#1a1d18]">same verdict at the same cost</strong>, every time.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Badge text="&#10003; Deterministic" />
              <Badge text="&#10003; Fixed Cost" />
              <Badge text="&#10003; Fully Auditable" />
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE — Pipeline flow (~62%) */}
          <div className="flex flex-1 items-start lg:w-[62%]">
            <div className="mt-14 w-full scale-[0.92] origin-top-left">
              <PipelineIllustration />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PipelineIllustration() {
  return (
    <motion.div
      className="relative flex w-full flex-col gap-4"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={stagger}
    >
      {/* Top labels row */}
      <motion.div variants={fadeUp} className="flex font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-[#9b998a]">
        <span className="flex-1 text-center">01 · Reads</span>
        <span className="flex-1 text-center">02 · Checks</span>
        <span className="flex-1 text-center">03 · Decides</span>
      </motion.div>

      <div className="flex w-full items-start justify-center gap-3 lg:gap-5">
        {/* Column 1: READS */}
        <motion.div variants={scaleIn} className="flex w-[180px] shrink-0 flex-col items-center">
          <DocumentCard />
        </motion.div>

        {/* Arrow 1 */}
        <motion.div variants={fadeUp} className="flex-shrink-0 pt-[130px]">
          <FlowArrow />
        </motion.div>

        {/* Column 2: CHECKS */}
        <motion.div variants={scaleIn} className="flex w-[190px] shrink-0 flex-col items-stretch">
          <EngineCard />
        </motion.div>

        {/* Arrow 2 */}
        <motion.div variants={fadeUp} className="flex-shrink-0 pt-[130px]">
          <FlowArrow />
        </motion.div>

        {/* Column 3: DECIDES */}
        <motion.div variants={scaleIn} className="flex w-[185px] shrink-0 flex-col items-center">
          <VerdictCard />
        </motion.div>
      </div>

      {/* Baseline labels */}
      <motion.div variants={fadeUp} className="mt-2 border-t border-[#d8d0bc] pt-3">
        <div className="flex items-center justify-between font-mono text-[8px] font-bold uppercase tracking-[0.3em] text-[#aaa898]">
          <span className="flex-1 text-center">Input</span>
          <span className="flex-1 text-center">Process</span>
          <span className="flex-1 text-center text-[#2b4d3a]">Output</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RadiatingDot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.3 }}
        animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      />
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.15 }}
        animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 }}
      />
      <span className="relative inline-block rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
    </span>
  );
}

function DocumentCard() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[260px] w-full max-w-[180px]">
        <svg viewBox="0 0 200 290" className="relative h-full w-auto mx-auto drop-shadow-[0_18px_28px_rgba(26,29,24,0.16)]" aria-hidden="true">
          <path d="M0 6 C0 3 3 0 6 0 L155 0 L200 45 L200 284 C200 287 197 290 194 290 L6 290 C3 290 0 287 0 284 Z" fill="#f7f2e5" stroke="#d8d0bc" strokeWidth="1" />
          <path d="M155 0 L155 45 L200 45 Z" fill="#eee6d4" stroke="#d8d0bc" strokeWidth="1" />
          <rect x="24" y="47" width="125" height="13" rx="2" fill="#1a1d18" />
          <rect x="24" y="75" width="150" height="5" rx="1" fill="#8a8879" />
          <rect x="24" y="87" width="135" height="5" rx="1" fill="#8a8879" />
          <rect x="24" y="99" width="155" height="5" rx="1" fill="#8a8879" />
          <rect x="18" y="120" width="164" height="29" rx="4" fill="rgba(197,166,91,0.20)" stroke="#b99654" strokeWidth="1" />
          <rect x="30" y="129" width="140" height="12" rx="2" fill="#1a1d18" />
          <rect x="24" y="164" width="150" height="5" rx="1" fill="#8a8879" />
          <rect x="24" y="176" width="130" height="5" rx="1" fill="#8a8879" />
          <rect x="24" y="188" width="155" height="5" rx="1" fill="#8a8879" />
          <rect x="24" y="200" width="140" height="5" rx="1" fill="#8a8879" />
          <rect x="24" y="212" width="150" height="5" rx="1" fill="#8a8879" />
          <rect x="24" y="224" width="125" height="5" rx="1" fill="#8a8879" />
          <rect x="18" y="243" width="101" height="26" rx="4" fill="rgba(95,155,114,0.14)" stroke="#78917d" strokeWidth="1" />
          <rect x="30" y="251" width="65" height="9" rx="2" fill="#2b4d3a" />
          <text x="24" y="280" fill="#777568" fontSize="8" fontFamily="monospace" letterSpacing="2">CASE_47A.PDF · P3/7</text>
        </svg>
      </div>
    </div>
  );
}

function EngineCard() {
  return (
    <div className="flex w-full flex-col items-stretch gap-3">
      <div className="relative h-[260px] w-full">
        <div className="relative h-full overflow-hidden rounded-[8px] border border-[#2c4e3b] p-5 shadow-[0_18px_28px_rgba(26,29,24,0.18)]" style={{ background: "#0f1813" }}>
          <div className="mb-1 font-mono text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#c5a65b]">
            Agentic Engine
          </div>
          <div className="mb-4 text-[28px] text-[#f7f2e5]" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontStyle: "italic", fontVariationSettings: '"opsz" 72' }}>
            GovDoc
          </div>
          <div className="mb-4 space-y-[14px]">
            <div className="flex items-center gap-[13px] font-mono text-[10px] font-semibold tracking-[0.18em] text-[#d8d0bc]">
              <RadiatingDot color="#5f9b72" />
              Extract Facts
            </div>
            <div className="flex items-center gap-[13px] font-mono text-[10px] font-semibold tracking-[0.18em] text-[#d8d0bc]">
              <RadiatingDot color="#c5a65b" />
              Apply Rubric
            </div>
            <div className="flex items-center gap-[13px] font-mono text-[10px] font-semibold tracking-[0.18em] text-[#d8d0bc]">
              <RadiatingDot color="#a14435" />
              Issue Verdict
            </div>
          </div>
          <div className="rounded-md border border-[#c5a65b] px-4 py-2 text-center">
            <div className="font-mono text-[8px] font-extrabold uppercase tracking-[0.3em] text-[#c5a65b]">Verdict</div>
            <div className="text-[22px] text-[#efeadd]" style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontStyle: "italic", fontVariationSettings: '"opsz" 72' }}>
              Stable
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto h-3 w-px border-l border-dashed border-[#2c4e3b]" />
      <div className="relative w-full">
        <div className="rounded-[9px] px-[18px] py-[14px] shadow-[0_8px_18px_rgba(26,29,24,0.18)]" style={{ background: "#0a0d0b" }}>
          <div className="mb-1 font-mono text-[8px] font-extrabold uppercase tracking-[0.25em] text-[#c5a65b]">Natural Language</div>
          <div className="text-[13px] leading-[1.18] text-[#efeadd]" style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontVariationSettings: '"opsz" 48' }}>
            &ldquo;Did this filing meet
            <br />
            the 45-day window?&rdquo;
          </div>
        </div>
      </div>
    </div>
  );
}

function VerdictCard() {
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[300px] w-full max-w-[185px]">
        <div className="relative h-full rounded-[8px] border-[3px] border-solid border-[#2b4d3a] bg-[#f7f2e5] p-5 shadow-[0_0_0_5px_rgba(43,77,58,0.10),0_18px_28px_rgba(26,29,24,0.16)]">
          <div className="pointer-events-none absolute inset-[8px] rounded-[7px] border border-[#d8d0bc]" />
          <div className="mb-2 font-mono text-[9px] font-extrabold uppercase tracking-[0.3em] text-[#2b4d3a]">Verdict · Cited</div>
          <div className="mb-3 leading-[1.02] text-[#2b211d]" style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 400, fontStyle: "italic", fontVariationSettings: '"opsz" 96' }}>
            Procedural
            <br />
            breach.
          </div>
          <div className="mb-3 space-y-2">
            <div className="rounded-md border border-[#78917d] bg-[#eef3e9] px-[13px] py-1.5 font-mono text-[9px] font-bold tracking-[0.06em] text-[#2b4d3a]">Gov Code §11130</div>
            <div className="rounded-md border border-[#78917d] bg-[#eef3e9] px-[13px] py-1.5 font-mono text-[9px] font-bold tracking-[0.06em] text-[#2b4d3a]">CCR Title 2 §15.04(b)</div>
          </div>
          <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.25em] text-[#9b998a]">Recommendation</div>
          <div className="rounded-md bg-[#2b4d3a] px-3 py-2 text-center font-mono text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#f7f2e5]">Tier-2 Review</div>
          <div className="mt-2 text-[12px] text-[#8c8b7d]" style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontVariationSettings: '"opsz" 48' }}>
            Reasoned. Cited. Auditable.
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex-shrink-0 self-center">
      <svg width="17" height="20" viewBox="0 0 17 20" className="fill-[#2b4d3a]">
        <polygon points="0,0 17,10 0,20" />
      </svg>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div className="rounded-full border border-[#d8d0bc] bg-[#f7f2e5] px-7 py-3 font-mono text-[12px] font-extrabold uppercase tracking-[0.25em] text-[#151815] shadow-[0_1px_0_rgba(255,255,255,0.55)_inset]">
      {text}
    </div>
  );
}
