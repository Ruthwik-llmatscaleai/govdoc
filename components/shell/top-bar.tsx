"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/brand/app-logo";

type Props = {
  user: string;
  variant?: "workspace" | "full";
};

export function TopBar({ user, variant = "workspace" }: Props) {
  const pathname = usePathname();
  const initial =
    user
      .split(/[.\s@_-]+/)
      .filter(Boolean)[0]?.[0]
      ?.toUpperCase() ?? "?";
  const display = user.split("@")[0]?.split(/[._]/)[0] ?? user;
  const displayUpper = display.toUpperCase();

  // Determine header title based on current path to match screenshots exactly
  const isPolicyHeader = pathname?.includes("/work/search/edit") || pathname?.includes("/work/search/preview");
  const headerTitle = isPolicyHeader ? "Policy Compliance - Agentic AI" : "GovDoc";

  return (
    <>
      {/* Top announcement banner */}
      <div className="w-full bg-[#0a0a0a] py-2.5 text-center font-mono text-[9px] uppercase tracking-[0.2em] text-[#4ade80] flex items-center justify-center gap-1.5">
        <span>●</span>
        <span>Policy Compliance Evaluation · Powered by Agentic AI</span>
        <span>●</span>
      </div>

      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper)] px-8 py-[14px]">
        {/* Left: Logo + title */}
        <Link
          href={"/workspace" as any}
          className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-govdoc-primary)]/40"
        >
          <AppLogo size={38} />
          <span className="text-[var(--color-govdoc-primary)]">&#9670;</span>
          <span
            className="text-[17px] font-medium tracking-[-0.015em] text-[var(--color-ink)]"
            style={{ fontFamily: "var(--font-display)", fontVariationSettings: '"opsz" 96' }}
          >
            {headerTitle}
          </span>
        </Link>

        {/* Center: tagline (full variant only) */}
        {variant === "full" && (
          <div className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)] lg:block">
            Reads. Checks. Decides.
          </div>
        )}

        {/* Right: version + user + sign out */}
        <div className="flex items-center gap-4">
          {variant === "full" && (
            <span className="hidden items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] sm:inline-flex">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-govdoc-primary)]" />
              V 1.0.0 Stable
            </span>
          )}
          <div className="flex items-center gap-2.5 rounded-full border border-[var(--color-line)] bg-[var(--color-cream-soft)] py-1.5 pl-1.5 pr-4">
            <div
              className="flex size-[26px] items-center justify-center rounded-full bg-[var(--color-govdoc-primary)] text-[12px] font-bold text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {initial}
            </div>
            <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-[var(--color-ink)]">
              {displayUpper} <span className="font-normal text-[var(--color-ink-mute)]">· ADMIN</span>
            </span>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              title="Sign out"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-transparent px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-mute)] transition-colors hover:border-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="size-3"
              >
                <path d="M10 11.5 13.5 8 10 4.5M13 8H6M6 2H3.5C2.7 2 2 2.7 2 3.5v9c0 .8.7 1.5 1.5 1.5H6" />
              </svg>
              <span className="hidden sm:inline">SIGN OUT</span>
            </button>
          </form>
        </div>
      </header>
    </>
  );
}
