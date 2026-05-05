import Link from "next/link";

type Props = {
  title: string;
  blurb: string;
  href: string;
  enabled: boolean;
};

export function Tile({ title, blurb, href, enabled }: Props) {
  const card = (
    <div className={`p-6 rounded-lg border bg-white space-y-2 transition ${enabled ? "hover:shadow-md cursor-pointer" : "opacity-60"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {!enabled && <span className="text-xs px-2 py-0.5 rounded bg-neutral-200 text-neutral-700">Coming soon</span>}
      </div>
      <p className="text-sm text-neutral-600">{blurb}</p>
    </div>
  );
  // Cast href to `any` because Next.js typed routes expect a union of known paths,
  // but Tile accepts a plain string prop.
  return enabled ? <Link href={href as any}>{card}</Link> : <div>{card}</div>;
}
