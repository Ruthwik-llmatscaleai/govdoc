import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth/mock-session";
import { TopBar } from "@/components/shell/top-bar";
import { Tile } from "@/components/landing/tile";

export default async function LandingPage() {
  const cookie = (await cookies()).get("govdoc_session")?.value;
  const session = await verifySession(cookie);
  if (!session) redirect("/login");

  return (
    <>
      <TopBar user={session.user} />
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">Welcome</h1>
          <p className="text-neutral-600 mt-1">Pick a function to begin.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Tile title="Search & Ask" blurb="Find answers across documents with grounded citations." href="/work/search" enabled={false} />
          <Tile title="Draft a Document" blurb="Generate procurement letters, certifications, and more." href="/work/draft" enabled={false} />
          <Tile title="Review Documents" blurb="Validate, score, and approve customer-submitted documents." href="/work/review" enabled />
          <Tile title="My Inbox" blurb="Routing, approvals, and notifications." href="/work/inbox" enabled={false} />
        </div>
      </main>
    </>
  );
}
