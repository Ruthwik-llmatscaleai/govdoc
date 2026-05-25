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
      className="group relative flex flex-col border border-[var(--color-line)] bg-white p-6 transition-all hover:border-[var(--color-govdoc-primary)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="mb-5 flex items-start justify-between">
        <div className="flex size-10 items-center justify-center bg-[var(--color-ink)] text-[var(--color-cream)]">
          <Icon className="size-[18px]" strokeWidth={1.6} />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          {number}
        </span>
      </div>

      <h3
        className="mb-2 leading-tight tracking-[-0.015em] text-[var(--color-ink)]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "20px",
          fontWeight: 500,
          fontVariationSettings: '"opsz" 72',
        }}
      >
        {title}{title ? " " : ""}
        <em
          className="text-[var(--color-govdoc-primary)]"
          style={{ fontStyle: "italic", fontWeight: 400 }}
        >
          {accent}
        </em>
      </h3>

      <p className="text-[13px] leading-[1.5] text-[var(--color-ink-mute)]">{description}</p>
    </Link>
  );
}
