import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";

interface PageHeaderProps {
  showAuth?: boolean;
  variant?: "landing" | "app";
}

export function PageHeader({ showAuth = true, variant = "landing" }: PageHeaderProps) {
  const title = "GovDoc";

  return (
    <>
      {/* Top Banner */}
      <div
        className="flex w-full items-center justify-center gap-3 bg-[#0E1410]"
        style={{ height: "38px" }}
      >
        <span className="dot-radiate inline-block h-[10px] w-[10px] rounded-full bg-[#5f9b72]" />
        <span
          className="uppercase text-[#C8D1C1]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            lineHeight: "13px",
            letterSpacing: "6px",
            fontWeight: 700,
          }}
        >
          POLICY COMPLIANCE EVALUATION · POWERED BY AGENTIC AI
        </span>
        <span className="dot-radiate inline-block h-[10px] w-[10px] rounded-full bg-[#5f9b72]" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-50 border-b border-[#D5CFBA] bg-[#F7F2E6]">
        <div className="govdoc-page-pad flex h-[86px] w-full items-center justify-between">
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-4">
            <AppLogo size={47} />
            <span className="inline-block h-[40px] w-px bg-[#D4CDB8]" />
            <span className="inline-block h-[12px] w-[12px] rotate-45 bg-[#4d6b50]" />
            <span
              className="text-[#0E1410]"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                lineHeight: "24px",
                fontWeight: 600,
                letterSpacing: 0,
              }}
            >
              {title}
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-5">
            {variant === "landing" && (
              <span
                className="hidden italic text-[#6E706A] lg:inline"
                style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 400 }}
              >
                Reads. Checks. Decides.
              </span>
            )}
            <span
              className="hidden items-center gap-2 rounded-full border border-[#D4CDB8] bg-[#FCFAF3] px-3 py-1 uppercase text-[#6E706A] sm:inline-flex"
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}
            >
              <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#3D5740]" />
              V 1.0.0 Stable
            </span>
            {showAuth && (
              <>
                <Link
                  href="#"
                  className="hidden uppercase text-[#6E706A] transition-colors hover:text-[#0E1410] md:inline"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}
                >
                  Request Demo
                </Link>
                <Link
                  href="/login"
                  className="rounded-full bg-[#3D5740] px-5 py-2.5 uppercase text-[#FCFAF3] transition-colors hover:bg-[#0E1410]"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "3px" }}
                >
                  Sign In →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
