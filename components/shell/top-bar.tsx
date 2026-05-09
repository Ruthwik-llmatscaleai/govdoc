import Link from "next/link";
import { ChevronDown, LogOut, Search } from "lucide-react";
import { AppLogo } from "@/components/brand/app-logo";

type Props = {
  user: string;
  showSearch?: boolean;
};

export function TopBar({ user, showSearch = true }: Props) {
  const initials = user
    .split(/[.\s@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || user[0]?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-6">
        <Link
          href={"/landing" as any}
          className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md"
        >
          <AppLogo size={36} />
        </Link>

        {showSearch && (
          <div className="ml-6 hidden max-w-md flex-1 md:flex">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search & ask anything across documents…"
                className="h-9 w-full rounded-full border border-border bg-muted/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground/60 focus:border-primary/40 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-muted/40 py-1 pl-1 pr-2.5 ring-1 ring-border sm:flex">
            <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {initials}
            </div>
            <span className="text-sm font-medium text-foreground/85 capitalize">{user}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              title="Sign out"
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
