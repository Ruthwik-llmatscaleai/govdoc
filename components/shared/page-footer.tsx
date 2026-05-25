export function PageFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-6 py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)] md:flex-row md:items-center md:justify-between lg:px-10">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span>© 2026 LLMATSCALE.AI</span>
          <Sep />
          <span>Confidential &amp; Proprietary</span>
          <Sep />
          <span>Authorized Use Only</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>🔒 TLS 1.3</span>
          <Sep />
          <span>✓ MFA</span>
          <Sep />
          <span>FedRAMP · CJIS · SOC 2</span>
        </div>
      </div>
    </footer>
  );
}

function Sep() {
  return <span aria-hidden className="text-[var(--color-ink-faint)]/60">·</span>;
}
