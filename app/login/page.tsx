import { LoginForm } from "@/components/login/login-form";
import { PageHeader } from "@/components/shared/page-header";
import { PageFooter } from "@/components/shared/page-footer";
import { AnimatedDocPanel } from "@/components/login/animated-doc-panel";

export default function LoginPage() {
  return (
    <div className="govdoc-grid-bg flex min-h-screen flex-col">
      <PageHeader showAuth={false} variant="landing" />

      {/* ============ MAIN CONTENT ============ */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[55fr_45fr]">
        {/* ============ LEFT SIDE ============ */}
        <section className="relative hidden flex-col border-r border-[var(--color-line)] bg-[#E8E3D5] px-12 pb-10 pt-5 lg:flex">
          {/* Top area: GovDoc wordmark + tagline */}
          <div className="mb-2 flex items-start justify-between">
            <div
              className="mt-1 tracking-[-0.028em] text-[var(--color-ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: "75px",
                lineHeight: 1,
              }}
            >
              GovDoc<span className="ml-1 inline-block h-[9px] w-[9px] translate-y-[-3px] bg-[#2b4d3a]" />
            </div>
            <div className="mt-4 text-right">
              <div
                className="text-[24px] leading-[1.1] tracking-[-0.02em] text-[var(--color-govdoc-primary)]"
                style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500 }}
              >
                Reads.
              </div>
              <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
                Checks the policy.<br />
                Tells you pass or fail.
              </div>
            </div>
          </div>

          {/* Animated Document Analysis Panel */}
          <AnimatedDocPanel />

          {/* Bottom tagline */}
          <div className="mt-6 flex items-end justify-between">
            <div
              className="max-w-[360px] text-[14px] leading-[1.5] text-[var(--color-ink-soft)]"
              style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 300 }}
            >
              Reads the document. Checks the policy. Tells you pass or fail — with full citations and audit trail.
            </div>
            <div className="text-right font-mono text-[9.5px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">
              <div>Powered by</div>
              <div className="font-medium text-[var(--color-ink-soft)]">Anthropic Claude</div>
              <div className="mt-1 flex items-center justify-end gap-1.5">
                <span className="inline-block size-1.5 rounded-full bg-[#2d8c4a]" />
                Authorized Partner
              </div>
            </div>
          </div>
        </section>

        {/* ============ RIGHT SIDE ============ */}
        <section className="relative flex flex-col bg-[rgba(247,242,230,0.78)] px-6 pb-5 pt-3 sm:px-8 lg:px-12">
          {/* Three-column header */}
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-0 border-b border-[var(--color-line-paper)] pb-4">
            <div className="flex flex-col gap-0.5 px-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">01</span>
              <span
                className="text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, fontStyle: "italic", fontVariationSettings: '"opsz" 96' }}
              >
                Reads
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
                Government<br />Documents
              </span>
            </div>
            <div className="w-px self-stretch bg-[var(--color-line-paper)]" />
            <div className="flex flex-col gap-0.5 px-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">02</span>
              <span
                className="text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, fontStyle: "italic", fontVariationSettings: '"opsz" 96' }}
              >
                Checks
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
                Against<br />Policy
              </span>
            </div>
            <div className="w-px self-stretch bg-[var(--color-line-paper)]" />
            <div className="flex flex-col gap-0.5 px-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">03</span>
              <span
                className="text-[var(--color-ink)]"
                style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400, fontStyle: "italic", fontVariationSettings: '"opsz" 96' }}
              >
                Decides
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
                Pass / Fail<br />With Audit
              </span>
            </div>
          </div>

          <div className="flex w-full max-w-[580px] flex-1 flex-col justify-center py-6">
            <div className="mb-4 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#1a1d18] before:h-px before:w-[18px] before:bg-[#1a1d18] before:content-['']">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#1a1d18" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/></svg>
              Secure Portal
            </div>

            <h2
              className="govdoc-display mb-5 text-[var(--color-ink)]"
              style={{
                fontSize: "clamp(42px, 4vw, 58px)",
              }}
            >
              Sign in to{" "}
              <em
                className="text-[var(--color-govdoc-primary)]"
                style={{ fontStyle: "italic", fontWeight: 300 }}
              >
                continue.
              </em>
            </h2>

            <div className="mb-5 h-[2px] w-full" style={{ background: "linear-gradient(90deg, #2b4d3a 0%, #2b4d3a 60%, #e8e3d5 100%)" }} />

            <LoginForm />
          </div>

          <footer className="mt-auto flex items-center justify-between border-t border-[var(--color-line-paper)] pt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            <span>Authorized Use Only</span>
            <span>TLS 1.3 · MFA</span>
          </footer>
        </section>
      </div>

      <PageFooter />
    </div>
  );
}
