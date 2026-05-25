import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative bg-[var(--color-cream)] px-6 py-20 lg:px-10 lg:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(10,10,10,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 100%, rgba(45,80,22,0.04), transparent 70%), radial-gradient(ellipse 50% 40% at 70% 0%, rgba(10,10,10,0.03), transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1100px] text-center">
        <div className="mb-8 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
          <span className="text-[var(--color-govdoc-primary)]">◆</span> Policy Compliance Evaluation ·
          Powered by Agentic AI <span className="text-[var(--color-govdoc-primary)]">◆</span>
        </div>

        <h1
          className="mb-6 leading-[0.92] tracking-[-0.038em] text-[var(--color-ink)]"
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
          Microsoft 365 Copilot.
        </h1>

        <p
          className="mb-10 leading-[1.15] tracking-[-0.015em] text-[var(--color-ink-soft)]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(20px, 2.2vw, 28px)",
            fontVariationSettings: '"opsz" 72',
          }}
        >
          Deterministic responses{" "}
          <em
            className="text-[var(--color-govdoc-primary)]"
            style={{ fontStyle: "italic", fontWeight: 300 }}
          >
            at low cost
          </em>{" "}
          — built to handle any complex document.
        </p>

        <Link
          href="/login"
          className="inline-block rounded bg-[var(--color-govdoc-primary)] px-8 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--color-govdoc-deep)]"
        >
          ◆ Document Intelligence · Done Right
        </Link>
      </div>
    </section>
  );
}
