export function ComparisonTable() {
  return (
    <section className="px-6 py-16 lg:px-10 lg:py-20">
      <div className="ml-[3%] mr-[3%] max-w-[900px] lg:ml-[3.5%] lg:mr-[3.5%]">
        <div className="rounded-[13px] border border-[#d8d0bc] bg-[#f7f2e5] px-8 py-10 shadow-[0_1px_0_rgba(255,255,255,0.55)_inset,0_7px_18px_rgba(26,29,24,0.04)] lg:px-14 lg:py-14">
          {/* Section label */}
          <div className="mb-6 font-mono text-[9px] font-extrabold uppercase tracking-[0.45em] text-[#8c8b7d]">
            Why Not Copilot
          </div>

          {/* Title */}
          <h2
            className="mb-10 leading-[1.1] tracking-[-0.04em] text-[#1a1d18]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 500,
              fontVariationSettings: '"opsz" 96',
            }}
          >
            GovDoc is{" "}
            <em
              className="text-[#a14435]"
              style={{ fontStyle: "italic", fontWeight: 500 }}
            >
              not
            </em>{" "}
            built on Microsoft 365 Copilot
            <span className="ml-1 inline-block h-[9px] w-[9px] translate-y-[-2px] bg-[#2b4d3a]" />
          </h2>

          {/* Comparison grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto_1fr]">
            {/* M365 column */}
            <div>
              <div className="mb-5 font-mono text-[9px] font-extrabold uppercase tracking-[0.4em] text-[#a14435]">
                M365 Copilot
              </div>
              <div className="mb-5 h-px bg-[#d8d0bc]" />
              <div className="space-y-4 text-[15px] text-[#66675f]">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#a14435]">&#10007;</span>
                  <span>Non-deterministic responses</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#a14435]">&#10007;</span>
                  <span>Per-token pricing</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#a14435]">&#10007;</span>
                  <span>Unauditable outputs</span>
                </div>
              </div>
            </div>

            {/* Arrow column */}
            <div className="hidden items-center text-[28px] text-[#2b4d3a] md:flex" style={{ fontFamily: "var(--font-display)" }}>
              &rarr;
            </div>

            {/* GovDoc column */}
            <div>
              <div className="mb-5 font-mono text-[9px] font-extrabold uppercase tracking-[0.4em] text-[#2b4d3a]">
                GovDoc
              </div>
              <div className="mb-5 h-px bg-[#d8d0bc]" />
              <div className="space-y-4 text-[15px] text-[#66675f]">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#2b4d3a]">&#10003;</span>
                  <span>Deterministic verdicts</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#2b4d3a]">&#10003;</span>
                  <span>Fixed cost</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#2b4d3a]">&#10003;</span>
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
