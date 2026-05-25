import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";

interface PageHeaderProps {
  showAuth?: boolean;
}

export function PageHeader({ showAuth = true }: PageHeaderProps) {
  return (
    <>
      {/* Top Banner */}
      <div className="w-full bg-[#e8e5d8] py-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-ink-mute)]">
        <span className="text-[var(--color-govdoc-primary)]">&#9670;</span>
        {" "}Policy Compliance Evaluation · Powered by Agentic AI{" "}
        <span className="text-[var(--color-govdoc-primary)]">&#9670;</span>
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-cream)]">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 lg:px-10">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-3.5">
            <AppLogo size={32} />
            <div className="h-6 w-px bg-[var(--color-line)]" />
            <span
              className="text-[17px] tracking-[-0.015em] text-[var(--color-ink)]"
              style={{
                fontFamily: "var(--font-display)",
                fontVariationSettings: '"opsz" 96',
              }}
            >
              <span className="text-[var(--color-govdoc-primary)]">&#9670;</span>{" "}
              Policy Compliance · Agentic AI
            </span>
          </div>

          {/* Center: Tagline */}
          <div className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)] lg:block">
            Reads. Checks. Decides.
          </div>

          {/* Right: Version + Demo + Sign In */}
          {showAuth && (
            <div className="flex items-center gap-5">
              <span className="hidden items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] sm:inline-flex">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-govdoc-primary)]" />
                V 1.0.0 Stable
              </span>
              <Link
                href="#"
                className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] transition-colors hover:text-[var(--color-ink)] md:inline"
              >
                Request Demo
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-[var(--color-govdoc-deep)] px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-govdoc-primary)]"
              >
                Sign In &rarr;
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
