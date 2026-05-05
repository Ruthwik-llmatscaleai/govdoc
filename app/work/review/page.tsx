import Link from "next/link";
import { USE_CASES_BY_TILE } from "@/lib/usecases/registry";

export default function ReviewPicker() {
  const cases = USE_CASES_BY_TILE.review;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Review Documents</h1>
        <p className="text-neutral-600 mt-1">Pick an evaluator.</p>
      </div>
      {cases.length === 0 ? (
        <div className="p-6 rounded-lg border bg-white text-neutral-600">
          No use cases registered yet. Add one in <code className="text-sm">lib/usecases/registry.ts</code>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map((uc) => (
            <Link key={uc.id} href={`/work/review/${uc.id}` as any} className="p-6 rounded-lg border bg-white hover:shadow-md transition">
              <h3 className="text-lg font-semibold">{uc.label}</h3>
              <p className="text-sm text-neutral-600 mt-1">{uc.blurb}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
