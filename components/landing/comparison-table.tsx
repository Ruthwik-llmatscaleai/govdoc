export function ComparisonTable() {
  return (
    <section className="bg-[var(--color-cream-soft)] px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-8 text-center">
          <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-mute)]">
            Why Not Copilot
          </div>
          <h2
            className="mb-2 leading-[1.1] tracking-[-0.02em] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px, 3.5vw, 40px)",
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
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border-2 border-[var(--color-line)] bg-white p-8">
            <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
              M365 COPILOT
            </div>
            <div className="space-y-3 text-sm text-[var(--color-govdoc-primary)]">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">✗</span>
                <span>Non-deterministic responses</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">✗</span>
                <span>Per-token pricing</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">✗</span>
                <span>Unauditable outputs</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border-2 border-[var(--color-govdoc-primary)] bg-white p-8">
            <div className="mb-6 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-govdoc-primary)]">
              GOVDOC
            </div>
            <div className="space-y-3 text-sm text-[#2d8c4a]">
              <div className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>Deterministic verdicts</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>Fixed cost</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>Full audit trail</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
