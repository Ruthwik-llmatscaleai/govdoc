export function ProcessFlow() {
  return (
    <section className="px-6 py-10 lg:px-10 lg:py-16">
      <div className="ml-[3%] max-w-[1200px] lg:ml-[3.5%]">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          {/* LEFT SIDE — Text content (~38%) */}
          <div className="flex flex-col justify-center lg:w-[38%]">
            <div className="mb-8 inline-flex w-fit items-center gap-3 rounded-full border border-[#78917d] bg-[rgba(220,229,215,0.5)] px-6 py-2.5 font-mono text-[11px] font-extrabold uppercase tracking-[0.4em] text-[#20382a]">
              <span className="inline-block h-[13px] w-[13px] rounded-full bg-[#2b4d3a] shadow-[0_0_0_5px_rgba(43,77,58,0.12)]" /> Document Intelligence · Done Right
            </div>

            <h2
              className="mb-6 leading-[0.96] tracking-[-0.025em] text-[#1a1d18]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(40px, 4.5vw, 56px)",
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
            </h2>

            <p className="mb-8 max-w-[420px] text-[17px] leading-[1.43] tracking-[-0.01em] text-[#242720]">
              An <strong className="font-extrabold text-[#1a1d18]">agentic document-intelligence platform</strong> that
              reads complex documents, checks them against your policy, and tells you{" "}
              <em className="italic" style={{ fontFamily: "var(--font-display)" }}>pass or fail</em> — with the{" "}
              <strong className="font-extrabold text-[#1a1d18]">same verdict at the same cost</strong>, every time.
            </p>

            <div className="flex flex-wrap gap-3">
              <Badge text="&#10003; Deterministic" />
              <Badge text="&#10003; Fixed Cost" />
              <Badge text="&#10003; Fully Auditable" />
            </div>
          </div>

          {/* RIGHT SIDE — Pipeline flow (~62%) */}
          <div className="flex flex-1 items-start lg:w-[62%]">
            <PipelineIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

function PipelineIllustration() {
  return (
    <div className="relative flex w-full flex-col gap-4">
      {/* Top labels row */}
      <div className="flex font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
        <span className="flex-1 text-center">01 · Reads</span>
        <span className="flex-1 text-center">02 · Checks</span>
        <span className="flex-1 text-center">03 · Decides</span>
      </div>

      <div className="flex items-start gap-3 lg:gap-5">
        {/* Column 1: READS */}
        <div className="flex flex-1 flex-col items-center gap-4">
          <DocumentCard />
        </div>

        {/* Arrow 1 */}
        <div className="flex-shrink-0 pt-[140px]">
          <FlowArrow />
        </div>

        {/* Column 2: CHECKS */}
        <div className="flex flex-1 flex-col items-center gap-4">
          <EngineCard />
        </div>

        {/* Arrow 2 */}
        <div className="flex-shrink-0 pt-[140px]">
          <FlowArrow />
        </div>

        {/* Column 3: DECIDES */}
        <div className="flex flex-1 flex-col items-center gap-4">
          <VerdictCard />
        </div>
      </div>

      {/* Baseline labels */}
      <div className="mt-2 border-t border-[#d8d0bc] pt-3">
        <div className="flex items-center justify-between font-mono text-[8px] font-bold uppercase tracking-[0.35em] text-[#aaa898]">
          <span className="flex-1 text-center">Input</span>
          <span className="flex-1 text-center">Process</span>
          <span className="flex-1 text-center text-[#2b4d3a]">Output</span>
        </div>
      </div>
    </div>
  );
}

function DocumentCard() {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[300px] w-full max-w-[210px]">
        {/* Drop shadow */}
        <div className="absolute inset-0 translate-x-2 translate-y-3 rounded-sm bg-black/8" />
        {/* Page body */}
        <svg viewBox="0 0 200 290" className="relative w-full" aria-hidden="true">
          {/* Main page */}
          <path
            d="M0 4 C0 2 2 0 4 0 L155 0 L200 45 L200 286 C200 288 198 290 196 290 L4 290 C2 290 0 288 0 286 Z"
            fill="#f7f2e5"
            stroke="#d8d0bc"
            strokeWidth="1"
          />
          {/* Folded corner */}
          <path d="M155 0 L155 45 L200 45 Z" fill="#eee6d4" stroke="#d8d0bc" strokeWidth="1" />

          {/* Title bar (dark) */}
          <rect x="30" y="44" width="125" height="13" rx="2" fill="#1a1d18" />

          {/* Text lines group 1 */}
          <rect x="30" y="72" width="140" height="5" rx="1" fill="#8a8879" />
          <rect x="30" y="84" width="130" height="5" rx="1" fill="#8a8879" />
          <rect x="30" y="96" width="145" height="5" rx="1" fill="#8a8879" />

          {/* Highlighted section (gold border) */}
          <rect x="22" y="116" width="156" height="29" rx="4" fill="rgba(197,166,91,0.2)" stroke="#b99654" strokeWidth="1" />
          <rect x="34" y="125" width="130" height="12" rx="2" fill="#1a1d18" />

          {/* Text lines group 2 */}
          <rect x="30" y="160" width="140" height="5" rx="1" fill="#8a8879" />
          <rect x="30" y="172" width="125" height="5" rx="1" fill="#8a8879" />
          <rect x="30" y="184" width="145" height="5" rx="1" fill="#8a8879" />
          <rect x="30" y="196" width="130" height="5" rx="1" fill="#8a8879" />
          <rect x="30" y="208" width="140" height="5" rx="1" fill="#8a8879" />
          <rect x="30" y="220" width="120" height="5" rx="1" fill="#8a8879" />

          {/* Small highlighted tag (green border) */}
          <rect x="22" y="239" width="101" height="26" rx="4" fill="rgba(95,155,114,0.14)" stroke="#78917d" strokeWidth="1" />
          <rect x="34" y="247" width="65" height="9" rx="2" fill="#2b4d3a" />

          {/* File caption inside document */}
          <text x="30" y="278" fill="#777568" fontSize="8" fontFamily="monospace" letterSpacing="1.5">CASE_47A.PDF · P3/7</text>
        </svg>
      </div>
    </div>
  );
}

function EngineCard() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main dark card */}
      <div className="relative h-[300px] w-full max-w-[210px]">
        <div className="absolute inset-0 translate-x-1 translate-y-2 rounded-xl bg-black/10" />
        <div className="relative h-full overflow-hidden rounded-lg border border-[#2c4e3b] bg-[#0f1813] p-5 shadow-[0_18px_28px_rgba(26,29,24,0.18)]">
          {/* Header */}
          <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#c5a65b]">
            Agentic Engine
          </div>
          <div
            className="mb-5 text-[24px] text-white"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontVariationSettings: '"opsz" 72',
            }}
          >
            GovDoc
          </div>

          {/* Bullet items */}
          <div className="mb-5 space-y-2.5">
            <div className="flex items-center gap-2.5 font-mono text-[12px] text-white/90">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#5f9b72]" />
              Extract Facts
            </div>
            <div className="flex items-center gap-2.5 font-mono text-[12px] text-white/90">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#c4a84a]" />
              Apply Rubric
            </div>
            <div className="flex items-center gap-2.5 font-mono text-[12px] text-white/90">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#c4a84a]/70" />
              Issue Verdict
            </div>
          </div>

          {/* Verdict badge */}
          <div className="rounded-lg border border-[#6b6340]/60 bg-[#2a3020]/80 px-4 py-3 text-center">
            <div className="mb-0.5 font-mono text-[8px] uppercase tracking-[0.2em] text-[#c5a65b]/80">
              Verdict
            </div>
            <div
              className="text-[20px] text-white"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontStyle: "italic",
                fontVariationSettings: '"opsz" 72',
              }}
            >
              Stable
            </div>
          </div>
        </div>
      </div>

      {/* Dashed connector line */}
      <div className="h-6 w-px border-l border-dashed border-[var(--color-ink-faint)]" />

      {/* Natural Language box */}
      <div className="relative w-full max-w-[210px]">
        <div className="absolute inset-0 translate-x-0.5 translate-y-1 rounded-lg bg-black/8" />
        <div className="relative rounded-lg bg-[#0a0d0b] px-4 py-3 shadow-md">
          <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-[#c5a65b]">
            Natural Language
          </div>
          <div
            className="text-[13px] leading-snug text-white/90"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontVariationSettings: '"opsz" 48',
            }}
          >
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
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[300px] w-full max-w-[210px]">
        {/* Shadow */}
        <div className="absolute inset-0 translate-x-1 translate-y-2 rounded-xl bg-black/5" />
        {/* Gold/green gradient accent line on top + right */}
        <div className="absolute -right-[3px] -top-[3px] h-[60%] w-[60%] rounded-tr-xl border-r-[3px] border-t-[3px] border-[#9a8c4a]/60" />
        {/* Card with solid border */}
        <div className="relative h-full rounded-xl border-[3px] border-solid border-[#2b4d3a] bg-[#f7f2e5] p-5 shadow-sm">
          {/* Header */}
          <div className="mb-3 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#2b4d3a]">
            Verdict · Cited
          </div>

          {/* Main verdict text */}
          <div
            className="mb-4 leading-[1.1] text-[#1a1a1a]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 400,
              fontStyle: "italic",
              fontVariationSettings: '"opsz" 96',
            }}
          >
            Procedural
            <br />
            breach.
          </div>

          {/* Citation badges */}
          <div className="mb-4 space-y-2">
            <div className="rounded-md border border-[#78917d] bg-[#eef3e9] px-3 py-1.5 text-center font-mono text-[9px] font-bold tracking-[0.05em] text-[#2b4d3a]">
              Gov Code §11130
            </div>
            <div className="rounded-md border border-[#78917d] bg-[#eef3e9] px-3 py-1.5 text-center font-mono text-[9px] font-bold tracking-[0.05em] text-[#2b4d3a]">
              CCR Title 2 §15.04(b)
            </div>
          </div>

          {/* Recommendation */}
          <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--color-ink-faint)]">
            Recommendation
          </div>
          <div className="mb-2 rounded-md bg-[#2b4d3a] px-4 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-white">
            Tier-2 Review
          </div>

          {/* Footer */}
          <div
            className="text-center text-[12px] text-[var(--color-ink-mute)]"
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontVariationSettings: '"opsz" 48',
            }}
          >
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
    <div className="rounded-full border border-[#d8d0bc] bg-[#f7f2e5] px-5 py-2.5 font-mono text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#151815] shadow-[0_1px_0_rgba(255,255,255,0.55)_inset]">
      {text}
    </div>
  );
}
