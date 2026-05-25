export function ProcessFlow() {
  return (
    <section className="bg-white px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-16 flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
          {/* INPUT */}
          <div className="flex-1 text-center">
            <div className="mb-4 inline-flex h-32 w-32 items-center justify-center rounded border-2 border-[var(--color-line)] bg-[var(--color-cream)]">
              <svg className="h-16 w-16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              INPUT
            </div>
            <div className="mt-1 text-sm text-[var(--color-ink-mute)]">CASE_47A.PDF · P.3/7</div>
          </div>

          <div className="text-2xl text-[var(--color-ink-faint)]">→</div>

          {/* PROCESS */}
          <div className="flex-[2] rounded-lg border-2 border-[var(--color-ink)] bg-[var(--color-ink)] p-8 text-center text-white">
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em]">Agentic Engine</div>
            <div
              className="mb-6 text-2xl"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontVariationSettings: '"opsz" 72',
              }}
            >
              GovDoc
            </div>
            <div className="space-y-2 text-left text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Extract Facts
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Apply Rubric
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span> Issue Verdict
              </div>
            </div>
            <div className="mt-4 border-t border-white/20 pt-4 text-xs italic text-white/70">
              &ldquo;Did this filing meet the 45-day window?&rdquo;
            </div>
          </div>

          <div className="text-2xl text-[var(--color-ink-faint)]">→</div>

          {/* OUTPUT */}
          <div className="flex-1">
            <div className="rounded-lg border-2 border-[var(--color-line)] bg-[var(--color-cream)] p-6">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
                VERDICT :: CITED
              </div>
              <div
                className="mb-4 leading-tight text-[var(--color-ink)]"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "17px",
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
              <div className="space-y-1.5 text-xs text-[var(--color-ink-soft)]">
                <div>Gov Code §11130</div>
                <div>CCR §15.04(b)</div>
              </div>
              <div className="mt-4 border-t border-[var(--color-line)] pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
                Recommendation: Tier-2 Review
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-16 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          <span>Natural Language</span>
          <span>Process</span>
          <span>Output</span>
        </div>
      </div>
    </section>
  );
}
