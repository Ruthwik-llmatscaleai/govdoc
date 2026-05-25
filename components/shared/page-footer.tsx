export function PageFooter() {
  return (
    <footer className="bg-[#0a0d0b]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-10 py-5 font-mono text-[11px] font-semibold uppercase tracking-[0.35em] text-[#aaa898]">
        <div className="flex items-center gap-x-4">
          <span className="text-[#c5a65b]">© 2026 LLMATSCALE.AI</span>
          <span className="text-[#5f6158]">|</span>
          <span>Confidential &amp; Proprietary</span>
        </div>
        <span className="text-[#e9e2ce]">Authorized Use Only</span>
        <div className="flex items-center gap-x-5">
          <span className="inline-flex items-center gap-1.5">
            <svg width="10" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#aaa898]"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>
            TLS 1.3
          </span>
          <span className="text-[#5f6158]">|</span>
          <span className="text-[#a14435]">MFA</span>
          <span className="text-[#5f6158]">|</span>
          <span>FedRAMP · CJIS · SOC 2</span>
        </div>
      </div>
    </footer>
  );
}
