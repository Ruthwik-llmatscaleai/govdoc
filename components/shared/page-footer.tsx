export function PageFooter() {
  const labelStyle = {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    lineHeight: "13px",
    letterSpacing: "3px",
    fontWeight: 700,
  } as const;

  return (
    <footer
      className="w-full bg-[#0E1410]"
      style={{ minHeight: "60px", borderTop: "1px solid #1C221D" }}
    >
      <div className="govdoc-page-pad flex min-h-[60px] flex-wrap items-center justify-between gap-x-8 gap-y-3 py-3">
        {/* Left group */}
        <div className="flex items-center gap-0">
          <span className="uppercase text-[#E7E6D8]" style={labelStyle}>
            © 2026 LLMATSCALE.AI
          </span>
          <span className="mx-[25px] inline-block h-[25px] w-px bg-[#E7E6D8] opacity-30" />
          <span className="uppercase text-[#E7E6D8]" style={labelStyle}>
            CONFIDENTIAL &amp; PROPRIETARY
          </span>
        </div>

        {/* Center */}
        <span
          className="hidden uppercase text-[#D7E0D0] md:inline"
          style={{ ...labelStyle, letterSpacing: "6px" }}
        >
          AUTHORIZED USE ONLY
        </span>

        {/* Right group */}
        <div className="flex items-center gap-0">
          <span className="inline-flex items-center gap-1.5 uppercase text-[#E7E6D8]" style={labelStyle}>
            <svg width="10" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#E7E6D8]">
              <rect x="3" y="7" width="10" height="7" rx="1.5"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2"/>
            </svg>
            TLS 1.3
          </span>
          <span className="mx-[20px] inline-block h-[25px] w-px bg-[#E7E6D8] opacity-30" />
          <span className="inline-flex items-center gap-1.5 uppercase text-[#E7E6D8]" style={labelStyle}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#E7E6D8]">
              <path d="M2 9l4 4L14 3"/>
            </svg>
            MFA
          </span>
          <span className="mx-[20px] inline-block h-[25px] w-px bg-[#E7E6D8] opacity-30" />
          <span className="uppercase text-[#E7E6D8]" style={labelStyle}>
            FedRAMP · CJIS · SOC 2
          </span>
        </div>
      </div>
    </footer>
  );
}
