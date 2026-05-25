export function ComparisonTable() {
  return (
    <section className="bg-[var(--color-cream)] px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[900px]">
        <div className="rounded-xl border-2 border-[var(--color-line)] bg-white p-8 lg:p-12">
          {/* Section label */}
          <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-faint)]">
            Why Not Copilot
          </div>

          {/* Title */}
          <h2
            className="mb-10 leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 400,
              fontVariationSettings: '"opsz" 96',
            }}
          >
            GovDoc is{" "}
            <em
              className="text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              not
            </em>{" "}
            built on Microsoft 365 Copilot
            <span className="inline-block h-[0.14em] w-[0.14em] translate-y-[-0.1em] bg-[var(--color-govdoc-primary)]" />
          </h2>

          {/* Comparison grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto_1fr]">
            {/* M365 column */}
            <div>
              <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
                M365 Copilot
              </div>
              <div className="space-y-3 text-sm text-[var(--color-ink-mute)]">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-500/70">&#10007;</span>
                  <span>Non-deterministic responses</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-500/70">&#10007;</span>
                  <span>Per-token pricing</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-red-500/70">&#10007;</span>
                  <span>Unauditable outputs</span>
                </div>
              </div>
            </div>

            {/* Arrow column */}
            <div className="hidden items-center text-xl text-[var(--color-ink-faint)] md:flex">
              &rarr;
            </div>

            {/* GovDoc column */}
            <div>
              <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-govdoc-primary)]">
                GovDoc
              </div>
              <div className="space-y-3 text-sm text-[var(--color-govdoc-primary)]">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">&#10003;</span>
                  <span>Deterministic verdicts</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">&#10003;</span>
                  <span>Fixed cost</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">&#10003;</span>
                  <span>Full audit trail</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
