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
      className="group relative flex h-[183px] flex-col rounded-[5px] border border-[#D4CDB8] bg-[#FCFAF3] px-[31px] pt-[29px] transition-all hover:border-[rgba(61,87,64,0.55)] hover:shadow-[0_8px_24px_rgba(14,20,16,0.08)] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-[rgba(61,87,64,0.35)] focus-visible:outline-offset-2"
      style={{ boxShadow: "0 1px 0 rgba(14,20,16,0.04)" }}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex items-center justify-center rounded-[6px] bg-[#0E1410]"
          style={{ width: "38px", height: "38px" }}
        >
          <Icon className="text-[#FCFAF3]" style={{ width: "18px", height: "18px" }} strokeWidth={1.8} />
        </div>
        <span
          className="text-[#8B877D]"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            lineHeight: "12px",
            letterSpacing: "2px",
            fontWeight: 700,
            textAlign: "right",
          }}
        >
          {number}
        </span>
      </div>

      <h3
        className="mt-auto text-[#0E1410]"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "24px",
          lineHeight: "28px",
          fontWeight: 700,
          letterSpacing: "-0.3px",
        }}
      >
        {title}{title ? " " : ""}
        <em style={{ fontStyle: "italic", fontWeight: 500, color: "#3D5740" }}>
          {accent}
        </em>
      </h3>

      <p
        className="mt-1 text-[#6E706A]"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          lineHeight: "18px",
          fontWeight: 400,
          paddingBottom: "24px",
        }}
      >
        {description}
      </p>
    </Link>
  );
}
