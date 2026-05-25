import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";

interface PageHeaderProps {
  showAuth?: boolean;
}

export function PageHeader({ showAuth = true }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-line)] bg-[var(--color-cream)]">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 lg:px-10">
        <div className="flex items-center gap-3.5">
          <AppLogo size={32} />
          <div className="h-6 w-px bg-[var(--color-line)]" />
          <Link
            href="/"
            className="text-[17px] font-medium tracking-[-0.015em] text-[var(--color-ink)]"
            style={{
              fontFamily: "var(--font-display)",
              fontVariationSettings: '"opsz" 96',
            }}
          >
            Gov
            <em
              className="font-light not-italic text-[var(--color-govdoc-primary)]"
              style={{ fontStyle: "italic", fontWeight: 300 }}
            >
              Doc
            </em>
          </Link>
        </div>

        <div className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-mute)] lg:block">
          Reads. Checks. Decides.
        </div>

        {showAuth && (
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)] sm:inline">
              v 1.0.0 STABLE
            </span>
            <Link
              href="/login"
              className="rounded bg-[var(--color-govdoc-primary)] px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--color-govdoc-deep)]"
            >
              Sign In →
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
