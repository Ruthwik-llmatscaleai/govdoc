export function ProcessFlow() {
  return (
    <section className="bg-white px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
          {/* LEFT SIDE — Text content (~40%) */}
          <div className="flex flex-col justify-center lg:w-[38%]">
            {/* Badge pill */}
            <div className="mb-8 inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--color-govdoc-primary)] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-govdoc-primary)]">
              <span>&#9670;</span> Document Intelligence · Done Right
            </div>

            {/* Large title */}
            <h2
              className="mb-6 leading-[1.05] tracking-[-0.03em] text-[var(--color-ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: "clamp(40px, 4.5vw, 56px)",
                fontVariationSettings: '"opsz" 96',
              }}
            >
              Reads. Checks.
              <br />
              <em
                className="text-[var(--color-govdoc-primary)]"
                style={{ fontStyle: "italic", fontWeight: 300 }}
              >
                Decides.
              </em>
            </h2>

            {/* Description paragraph */}
            <p
              className="mb-8 max-w-[380px] leading-[1.5] text-[var(--color-ink-mute)]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: 400,
                fontVariationSettings: '"opsz" 48',
              }}
            >
              An agentic document-intelligence platform that reads complex
              documents, checks them against your policy, and tells you pass or
              fail — with the same verdict at the same cost, every time.
            </p>

            {/* Badge pills */}
            <div className="flex flex-wrap gap-3">
              <Badge text="&#10003; Deterministic" />
              <Badge text="&#10003; Fixed Cost" />
              <Badge text="&#10003; Fully Auditable" />
            </div>
          </div>

          {/* RIGHT SIDE — Three columns pipeline (~60%) */}
          <div className="flex flex-1 items-center gap-2 lg:gap-4">
            {/* Column 1: INPUT */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                01 · Reads
              </div>
              <div className="flex h-44 w-full items-center justify-center rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-cream)] p-4">
                <div className="text-center">
                  <svg
                    className="mx-auto mb-2 h-16 w-12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
                    CASE_47A.PDF · P.3/7
                  </div>
                </div>
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                Input
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-lg text-[var(--color-govdoc-primary)]">&#9654;</div>

            {/* Column 2: PROCESS */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                02 · Checks
              </div>
              <div className="flex h-44 w-full flex-col items-center justify-center rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-ink)] p-4 text-white">
                <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/70">
                  Agentic Engine
                </div>
                <div
                  className="mb-3 text-lg"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    fontVariationSettings: '"opsz" 72',
                  }}
                >
                  GovDoc
                </div>
                <div className="w-full space-y-1.5 text-left text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-400">&#9679;</span> Extract Facts
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-400">&#9679;</span> Apply Rubric
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-green-400">&#9679;</span> Issue Verdict
                  </div>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-green-400/40 px-2 py-0.5 font-mono text-[8px] uppercase text-green-400">
                  <span className="inline-block h-1 w-1 rounded-full bg-green-400" />
                  Stable
                </div>
              </div>
              <div className="rounded border border-[var(--color-line)] bg-[var(--color-cream)] px-2 py-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                Natural Language
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                Process
              </div>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-lg text-[var(--color-govdoc-primary)]">&#9654;</div>

            {/* Column 3: OUTPUT */}
            <div className="flex flex-1 flex-col items-center gap-3">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                03 · Decides
              </div>
              <div className="flex h-44 w-full flex-col justify-center rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-cream)] p-4">
                <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
                  Verdict · Cited
                </div>
                <div
                  className="mb-2 leading-tight text-[var(--color-ink)]"
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "15px",
                    fontWeight: 400,
                    fontVariationSettings: '"opsz" 72',
                  }}
                >
                  Procedural{" "}
                  <em
                    className="text-[var(--color-govdoc-primary)]"
                    style={{ fontStyle: "italic", fontWeight: 300 }}
                  >
                    breach.
                  </em>
                </div>
                <div className="space-y-1 text-[11px] text-[var(--color-ink-mute)]">
                  <div>Gov Code &sect;11130</div>
                  <div>CCR Title 2 &sect;15.04(b)</div>
                </div>
                <div className="mt-2 border-t border-[var(--color-line)] pt-2 font-mono text-[8px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                  Recommendation: Tier-2 Review
                </div>
              </div>
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                Output
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div className="rounded-full border border-[var(--color-line)] bg-white px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
      {text}
    </div>
  );
}
