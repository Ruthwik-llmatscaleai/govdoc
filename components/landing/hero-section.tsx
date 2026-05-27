export function HeroSection() {
  return (
    <section className="govdoc-page-pad relative pb-10 pt-16 lg:pb-14 lg:pt-20">
      <div className="govdoc-page-inner relative z-10">
        <div className="govdoc-kicker mb-8">
          <span className="govdoc-kicker-number">
            00
          </span>
          <span>Welcome · GovDoc Platform</span>
        </div>

        <h1
          className="govdoc-display mb-6 max-w-[1180px]"
        >
          GovDoc is{" "}
          <em>beyond</em>{" "}
          Microsoft 365
          <br />
          Copilot<span className="ml-1 inline-block h-[12px] w-[12px] translate-y-[-3px] bg-[#3D5740]" />
        </h1>

        <p
          className="max-w-[980px] text-[#0E1410]"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 400,
            fontSize: "clamp(18px, 1.4vw, 22px)",
            lineHeight: 1.4,
            letterSpacing: 0,
          }}
        >
          <strong style={{ fontWeight: 700 }}>
            Deterministic responses{" "}
          </strong>
          <span style={{ fontStyle: "italic" }}>at</span>
          <strong style={{ fontWeight: 700 }}>
            {" "}low cost
          </strong>{" "}
          —{" "}
          <em style={{ fontStyle: "italic", fontWeight: 500, color: "#3D5740" }}>
            built to handle any complex document.
          </em>
        </p>
      </div>
    </section>
  );
}
