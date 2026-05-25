import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";

interface PageHeaderProps {
  showAuth?: boolean;
}

export function PageHeader({ showAuth = true }: PageHeaderProps) {
  return (
    <>
      {/* Top Banner */}
      <div className="flex w-full items-center justify-center gap-3 bg-[#0a0d0b] py-2.5 font-mono text-[11.5px] font-normal uppercase tracking-[0.3em] text-white">
        <span className="inline-block h-2 w-2 rounded-full bg-[#5f9b72] shadow-[0_0_0_4px_rgba(95,155,114,0.18)]" />
        <span>Policy Compliance Evaluation<span className="mx-4">·</span>Powered by Agentic AI</span>
        <span className="inline-block h-2 w-2 rounded-full bg-[#5f9b72] shadow-[0_0_0_4px_rgba(95,155,114,0.18)]" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-[#d8d0bc] bg-[#efeadd]">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-6 lg:px-10 lg:pr-4">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-4">
            <AppLogo size={50} />
            <span className="inline-block h-[45px] w-px bg-[rgba(216,210,191,0.8)]" />
            <span className="inline-block h-[9px] w-[9px] rotate-45 bg-[#2b4d3a]" />
            <span
              className="text-[21px] tracking-[-0.015em] text-[#1a1d18]"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontVariationSettings: '"opsz" 96',
              }}
            >
              Policy Compliance · Agentic AI
            </span>
          </div>

          {/* Right: Tagline + Version + Demo + Sign In */}
          {showAuth && (
            <div className="flex items-center gap-5">
              <span
                className="hidden text-[15px] italic text-[#383a33] lg:inline"
                style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 72', fontWeight: 400 }}
              >
                Reads. Checks. Decides.
              </span>
              <span className="hidden items-center gap-2 rounded-full border border-[#d8d0bc] bg-[#f7f2e5] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-[#3f423a] sm:inline-flex" style={{ fontFamily: "var(--font-sans)" }}>
                <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#5f9b72] shadow-[0_0_0_3px_rgba(95,155,114,0.18)]" />
                V 1.0.0 Stable
              </span>
              <Link
                href="#"
                className="hidden text-[11px] font-medium uppercase tracking-[0.15em] text-[#353831] transition-colors hover:text-[#1a1d18] md:inline"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                Request Demo
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-[#2b4d3a] px-5 py-2.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.3em] text-[#f4eedf] transition-colors hover:bg-[#365f48]"
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
