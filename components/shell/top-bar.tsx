import Link from "next/link";

export function TopBar({ user }: { user: string }) {
  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href={"/landing" as any} className="text-xl font-semibold text-govdoc-primary">GovDoc</Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-neutral-600">{user}</span>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="text-neutral-500 hover:text-neutral-900">Sign out</button>
          </form>
        </div>
      </div>
    </header>
  );
}
