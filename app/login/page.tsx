import { LoginForm } from "@/components/login/login-form";
import { PageHeader } from "@/components/shared/page-header";
import { PageFooter } from "@/components/shared/page-footer";

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

          {/* Document Analysis Panel */}
          <div className="flex-1 rounded-[4px] border border-[var(--color-line)]">
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-cream-soft)] px-5 py-3">
              <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-[var(--color-ink-soft)]">
                <span className="rounded border border-[var(--color-line)] px-1 text-[8px]">DOC</span>
                <span>CASE_47A · AGENCY_GRIEVANCE_2026-04.pdf</span>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)]">
                <span className="inline-block size-1.5 rounded-full bg-[#2d8c4a]" />
                Agent Active · Analyzing
              </span>
            </div>

            {/* Panel body: two columns */}
            <div className="grid grid-cols-[1fr_1fr]">
              {/* Document excerpt */}
              <div className="relative min-h-[340px] border-r border-[var(--color-line)] bg-[#f5f2ea] p-5 pb-16">
                <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                  — Excerpt · Page 3 of 7
                </div>
                <div className="text-[12.5px] leading-[1.7] text-[var(--color-ink-soft)]">
                  <p className="mb-3">
                    The complainant, <span className="rounded-sm bg-[rgba(43,77,58,0.20)] px-0.5 text-[var(--color-ink)]">a California resident</span>, alleges that on{" "}
                    <span className="rounded-sm bg-[rgba(43,77,58,0.20)] px-0.5 text-[var(--color-ink)]">March 14, 2026</span>, the Department failed to process their application within the statutory window of{" "}
                    <span className="rounded-sm bg-[rgba(43,77,58,0.20)] px-0.5 text-[var(--color-ink)]">45 business days</span> as required under{" "}
                    <span className="rounded-sm bg-[rgba(43,77,58,0.20)] px-0.5 text-[var(--color-ink)]">Gov Code §11130</span>.
                  </p>
                  <p className="mb-3">
                    The Department&apos;s records indicate the application was received on{" "}
                    <span className="rounded-sm bg-[rgba(43,77,58,0.20)] px-0.5 text-[var(--color-ink)]">January 22, 2026</span>, placing the resolution deadline at{" "}
                    <span className="rounded-sm bg-[rgba(43,77,58,0.20)] px-0.5 text-[var(--color-ink)]">March 26, 2026</span> — twelve days after the alleged non-action.
                  </p>
                  <p>
                    On review, the file shows{" "}
                    <span className="rounded-sm bg-[rgba(43,77,58,0.20)] px-0.5 text-[var(--color-ink)]">no acknowledgment letter</span> issued between Jan 22 and Apr 04, constituting a procedural breach under{" "}
                    <span className="rounded-sm bg-[rgba(43,77,58,0.20)] px-0.5 text-[var(--color-ink)]">CCR Title 2 §15.04(b)</span>.{" "}
                    <span className="inline-block h-3 w-2 bg-[var(--color-govdoc-primary)]" />
                  </p>
                </div>

                {/* Bottom tooltip overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-[8px] bg-[#1a1a1a] px-4 py-2.5 text-[11px] text-white">
                  <span className="inline-block size-2 rounded-full bg-[#2d8c4a]" />
                  <span className="font-mono text-[10px] tracking-[0.02em]">
                    Cross-referencing Gov Code §11130 with CCR §15.04(b) — 1 violation found
                  </span>
                </div>
              </div>

              {/* Analysis side */}
              <div className="bg-[var(--color-cream-soft)] p-5">
                {/* Section 01 */}
                <div className="mb-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] font-mono text-[8px] font-bold text-white">01</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">Extracted Facts</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[10.5px] text-[var(--color-ink-soft)]">
                    <div className="flex gap-4"><span className="w-[80px] text-[var(--color-ink-mute)]">Complainant</span><span>CA Resident</span></div>
                    <div className="flex gap-4"><span className="w-[80px] text-[var(--color-ink-mute)]">Filed</span><span>Jan 22, 2026</span></div>
                    <div className="flex gap-4"><span className="w-[80px] text-[var(--color-ink-mute)]">Deadline</span><span>Mar 26, 2026</span></div>
                    <div className="flex gap-4"><span className="w-[80px] text-[var(--color-ink-mute)]">Statute</span><span>Gov Code §11130</span></div>
                    <div className="flex gap-4"><span className="w-[80px] text-[var(--color-ink-mute)]">Cross-ref</span><span>CCR §15.04(b)</span></div>
                  </div>
                </div>

                {/* Section 02 */}
                <div className="mb-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] font-mono text-[8px] font-bold text-white">02</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">Reasoning Path</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-[10.5px] text-[var(--color-ink-soft)]">
                    <div className="flex gap-3"><span className="text-[var(--color-ink-mute)]">01</span><span>Identify statutory window</span></div>
                    <div className="flex gap-3"><span className="text-[var(--color-ink-mute)]">02</span><span>Check timeline</span></div>
                    <div className="flex gap-3"><span className="text-[var(--color-ink-mute)]">03</span><span>Detect breach</span></div>
                  </div>
                </div>

                {/* Section 03 — Verdict */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] font-mono text-[8px] font-bold text-white">03</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)]">Verdict</span>
                  </div>
                  <div className="rounded-[8px] bg-[#0a0a0a] px-4 py-3 text-[13px] leading-[1.6] text-white/90">
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
                      Procedural <em className="italic text-[var(--color-govdoc-accent)]">breach</em>{" "}
                      <em className="italic">confirmed</em>. Recommend
                    </span>
                    <br />
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
                      Tier-2 review.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
