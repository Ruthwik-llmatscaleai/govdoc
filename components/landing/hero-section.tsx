export function HeroSection() {
  return (
    <section className="relative bg-[var(--color-cream)] px-6 py-20 lg:px-10 lg:py-28">
      {/* Subtle grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,10,10,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1200px]">
        {/* Section number prefix */}
        <div className="mb-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
          <span className="inline-block h-px w-8 bg-[var(--color-ink-faint)]" />
          <span>00 | Welcome · GovDoc Platform</span>
        </div>

        {/* Title — LEFT ALIGNED */}
        <h1
          className="mb-6 max-w-[900px] leading-[0.92] tracking-[-0.038em] text-[var(--color-ink)]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(52px, 7.5vw, 92px)",
            fontVariationSettings: '"opsz" 144',
          }}
        >
          GovDoc is{" "}
          <em
            className="text-[var(--color-govdoc-primary)]"
            style={{ fontStyle: "italic", fontWeight: 300 }}
          >
            beyond
          </em>{" "}
          Microsoft 365 Copilot
          <span className="inline-block h-[0.15em] w-[0.15em] translate-y-[-0.1em] bg-[var(--color-govdoc-primary)]" />
        </h1>

        {/* Subheading — LEFT ALIGNED */}
        <p
          className="max-w-[700px] leading-[1.3] tracking-[-0.015em] text-[var(--color-ink-mute)]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(20px, 2.2vw, 28px)",
            fontVariationSettings: '"opsz" 72',
            fontStyle: "italic",
          }}
        >
          Deterministic responses{" "}
          <strong
            className="text-[var(--color-ink)]"
            style={{ fontStyle: "italic", fontWeight: 600 }}
          >
            at low cost
          </strong>{" "}
          — built to handle any complex document.
        </p>
      </div>
    </section>
  );
}
