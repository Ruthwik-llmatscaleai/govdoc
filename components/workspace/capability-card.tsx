import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface CapabilityCardProps {
  number: string;
  icon: LucideIcon;
  title: string;
  accent: string;
  description: string;
  href: string;
}

export function CapabilityCard({ number, icon: Icon, title, accent, description, href }: CapabilityCardProps) {
  return (
    <Link
      href={href as any}
      className="capability-card group relative flex flex-col rounded-lg border-2 border-[var(--color-line)] bg-white p-6 transition-all hover:border-[var(--color-govdoc-primary)] hover:shadow-lg"
    >
      <div className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        {number}
      </div>

      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-cream)]">
        <Icon className="h-6 w-6 text-[var(--color-ink)]" />
      </div>

      <h3
        className="mb-3 leading-tight tracking-[-0.015em] text-[var(--color-ink)]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "22px",
          fontWeight: 400,
          fontVariationSettings: '"opsz" 72',
        }}
      >
        {title}{" "}
        <em
          className="text-[var(--color-govdoc-primary)]"
          style={{ fontStyle: "italic", fontWeight: 300 }}
        >
          {accent}
        </em>
      </h3>

      <p className="text-sm leading-relaxed text-[var(--color-ink-mute)]">{description}</p>
    </Link>
  );
}
