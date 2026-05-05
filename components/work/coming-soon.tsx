export function ComingSoon({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div className="text-center py-20 space-y-3">
      <span className="inline-block text-xs px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">Coming soon</span>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-neutral-600 max-w-lg mx-auto">{blurb}</p>
    </div>
  );
}
