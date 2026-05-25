export function ThreeColumn() {
  return (
    <section className="bg-[var(--color-cream)] px-6 py-16 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <ColumnCard number="01" title="READS" subtitle="GOVERNMENT DOCUMENTS" />
          <ColumnCard number="02" title="CHECKS" subtitle="AGAINST POLICY" />
          <ColumnCard number="03" title="DECIDES" subtitle="PASS / FAIL WITH AUDIT" />
        </div>

        <div className="mx-auto max-w-[900px] text-center">
          <p
            className="mb-8 leading-[1.4] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(18px, 2vw, 22px)",
              fontWeight: 400,
              fontVariationSettings: '"opsz" 72',
            }}
          >
            An <strong className="font-semibold">agentic document-intelligence platform</strong> that reads
            complex documents, checks them against your policy, and tells you pass or fail — with the{" "}
            <em
              className="text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              same verdict at the same cost
            </em>
            , every time.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Badge text="✓ DETERMINISTIC" />
            <Badge text="✓ FIXED COST" />
            <Badge text="✓ FULLY AUDITABLE" />
          </div>
        </div>
      </div>
    </section>
  );
}

function ColumnCard({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="rounded-lg border-2 border-[var(--color-line)] bg-white p-8 text-center">
      <div
        className="mb-4 leading-none tracking-[-0.02em] text-[var(--color-ink)]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(40px, 5vw, 56px)",
          fontWeight: 400,
          fontVariationSettings: '"opsz" 96',
        }}
      >
        {number} · {title}
      </div>
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
        {subtitle}
      </div>
    </div>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <div className="rounded border border-[var(--color-line)] bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-soft)]">
      {text}
    </div>
  );
}
