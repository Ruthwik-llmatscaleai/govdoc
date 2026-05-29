"use client";

import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";

type Props = {
  user: string;
  variant?: "workspace" | "full" | "rubric" | "compact";
};

export function TopBar({ user, variant = "full" }: Props) {
  const displayName = user?.toUpperCase() || "USER";
  const initial = displayName[0] || "U";
  const isRubric = variant === "rubric";
  const isCompact = variant === "compact";

  if (isCompact) {
    return (
      <header
        className="govdoc-page-pad flex items-center justify-between border-b border-[#D5CFBA] bg-[#F7F2E6]"
        style={{ height: "44px" }}
      >
        <Link
          href={"/workspace" as any}
          className="flex items-center gap-0 outline-none focus-visible:ring-2 focus-visible:ring-[rgba(61,87,64,0.35)]"
        >
          <AppLogo size={28} />
          <div className="mx-2.5 h-[22px] w-px bg-[#D4CDB8]" />
          <span
            className="text-[#0E1410]"
            style={{ fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" }}
          >
            GovDoc
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center border border-[#D4CDB8] bg-[#FCFAF3]"
            style={{ height: "32px", borderRadius: "16px", gap: "8px", padding: "0 12px 0 6px" }}
          >
            <div
              className="flex items-center justify-center rounded-full bg-[#47644A] text-[#FCFAF3]"
              style={{ width: "22px", height: "22px", fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700 }}
            >
              {initial}
            </div>
            <span
              className="hidden uppercase text-[#0E1410] sm:inline"
              style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "2px", fontWeight: 700 }}
            >
              {displayName} <span className="font-normal text-[#6E706A]">· ADMIN</span>
            </span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              title="Sign out"
              className="cursor-pointer border border-[#D4CDB8] bg-[#FCFAF3] uppercase text-[#0E1410] transition-colors hover:border-[#8B877D]"
              style={{ height: "26px", borderRadius: "13px", padding: "0 12px", fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "2px", fontWeight: 700 }}
            >
              ↪ SIGN OUT
            </button>
          </form>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* System ribbon */}
      <div
        className="flex w-full items-center justify-center gap-3 bg-[#0E1410]"
        style={{ height: "36px" }}
      >
        <span className="inline-block h-[10px] w-[10px] rounded-full bg-[#5f9b72] shadow-[0_0_0_3px_rgba(95,155,114,0.2)]" />
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
        <span className="inline-block h-[10px] w-[10px] rounded-full bg-[#5f9b72] shadow-[0_0_0_3px_rgba(95,155,114,0.2)]" />
      </div>

      {/* App header */}
      <header
        className="govdoc-page-pad sticky top-0 z-50 flex items-center justify-between border-b border-[#D5CFBA] bg-[#F7F2E6]"
        style={{ height: "80px", borderTop: "1px solid #AEADA3" }}
      >
        {/* Left: brand cluster */}
        <Link
          href={"/workspace" as any}
          className="flex items-center gap-0 outline-none focus-visible:ring-2 focus-visible:ring-[rgba(61,87,64,0.35)]"
        >
          <AppLogo size={47} />
          <div className="mx-4 h-[40px] w-[2px] bg-[#D4CDB8]" />
          <span className="inline-block h-[12px] w-[12px] rotate-45 bg-[#4d6b50]" />
          <span
            className="ml-2 text-[#0E1410]"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: isRubric ? "18px" : "22px",
              lineHeight: isRubric ? "22px" : "24px",
              fontWeight: isRubric ? 500 : 700,
              whiteSpace: "nowrap",
            }}
          >
            GovDoc
          </span>
        </Link>

        {/* Right: account cluster */}
        <div className="flex items-center gap-3 sm:gap-4">
          {isRubric && (
            <>
              <span
                className="italic text-[#6E706A]"
                style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 400 }}
              >
                Reads. Checks. Decides.
              </span>
              <span
                className="inline-flex items-center gap-2 rounded-full border border-[#D4CDB8] bg-[#FCFAF3] px-3 py-1 uppercase text-[#6E706A]"
                style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, letterSpacing: "2px" }}
              >
                <span className="inline-block h-[7px] w-[7px] rounded-full bg-[#3D5740]" />
                V 1.0.0 Stable
              </span>
            </>
          )}
          {/* User pill */}
          <div
            className="flex items-center border border-[#D4CDB8] bg-[#FCFAF3]"
            style={{
              height: "48px",
              borderRadius: "24px",
              gap: "14px",
              padding: "0 18px 0 10px",
            }}
          >
            <div
              className="flex items-center justify-center rounded-full bg-[#47644A] text-[#FCFAF3]"
              style={{
                width: "32px",
                height: "32px",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                fontWeight: 700,
              }}
            >
              {initial}
            </div>
            <span
              className="hidden uppercase text-[#0E1410] sm:inline"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                lineHeight: "13px",
                letterSpacing: "3px",
                fontWeight: 700,
              }}
            >
              {displayName} <span className="font-normal text-[#6E706A]">· ADMIN</span>
            </span>
          </div>

          {/* Sign out */}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              title="Sign out"
              className="cursor-pointer border border-[#D4CDB8] bg-[#FCFAF3] uppercase text-[#0E1410] transition-colors hover:border-[#8B877D]"
              style={{
                height: "33px",
                borderRadius: "16.5px",
                padding: "0 19px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                letterSpacing: "3px",
                fontWeight: 700,
              }}
            >
              ↪ SIGN OUT
            </button>
          </form>
        </div>
      </header>
    </>
  );
}
