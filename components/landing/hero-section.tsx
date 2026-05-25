export function HeroSection() {
  return (
    <section className="relative px-6 pb-10 pt-16 lg:px-10 lg:pb-14 lg:pt-22">

      <div className="relative z-10 ml-[3%] max-w-[1200px] lg:ml-[3.5%]">
        {/* Section number prefix */}
        <div className="mb-8 flex items-center gap-5 font-mono text-[11px] font-semibold uppercase tracking-[0.3em] text-[#54574f]">
          <span className="inline-block h-[2px] w-7 bg-[#1a1d18]" />
          <span className="grid h-6 place-items-center rounded-[5px] border border-[#d8d0bc] bg-[#f7f2e5] px-2.5 text-[10px] font-bold tracking-[0.05em] text-[#343730]">00</span>
          <span className="tracking-[0.15em]">Welcome · GovDoc Platform</span>
        </div>

        <h1
          className="mb-6 whitespace-nowrap leading-[1.02] tracking-[-0.028em] text-[#1a1d18]"
          style={{
            fontFamily: "var(--font-tinos, 'Tinos'), 'Times New Roman', Georgia, serif",
            fontWeight: 700,
            fontSize: "clamp(45px, 5.7vw, 103px)",
          }}
        >
          GovDoc is{" "}
          <em
            className="text-[#2b4d3a]"
            style={{ fontStyle: "italic", fontWeight: 400, fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 144' }}
          >
            beyond
          </em>{" "}
          Microsoft 365
          <br />
          Copilot<span className="ml-1 inline-block h-[14px] w-[14px] translate-y-[-4px] bg-[#2b4d3a]" />
        </h1>

        <p
          className="whitespace-nowrap leading-[1.3] tracking-[-0.015em] text-[#1a1d18]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "25px",
            fontVariationSettings: '"opsz" 72',
          }}
        >
          <strong style={{ fontWeight: 700, fontFamily: "var(--font-tinos, 'Tinos'), 'Times New Roman', Georgia, serif" }}>
            Deterministic responses{" "}
          </strong>
          <span style={{ fontStyle: "italic", fontFamily: "var(--font-tinos, 'Tinos'), 'Times New Roman', Georgia, serif" }}>at</span>
          <strong style={{ fontWeight: 700, fontFamily: "var(--font-tinos, 'Tinos'), 'Times New Roman', Georgia, serif" }}>
            {" "}low cost
          </strong>{" "}
          —{" "}
          <em className="text-[#2b4d3a]" style={{ fontStyle: "italic", fontWeight: 500, fontFamily: "var(--font-tinos, 'Tinos'), 'Times New Roman', Georgia, serif" }}>
            built to handle any complex document.
          </em>
        </p>
      </div>
    </section>
  );
}
