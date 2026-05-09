import { cn } from "@/lib/utils";

type Props = {
  label: string;
  dotColor: string;
  className?: string;
};

export function CapabilityPill({ label, dotColor, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm",
        className,
      )}
    >
      <span
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
