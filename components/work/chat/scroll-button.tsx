"use client";

import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollButtonProps {
  visible: boolean;
  onClick: () => void;
  className?: string;
}

/**
 * "Scroll to bottom" pill shown when the user has scrolled away from the live
 * tail of the conversation.
 */
export function ScrollButton({ visible, onClick, className }: ScrollButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scroll to latest"
      className={cn(
        "pointer-events-auto flex size-9 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-mute)] shadow-md transition-all",
        "hover:border-[var(--color-govdoc-navy)] hover:text-[var(--color-govdoc-navy)]",
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-1",
        className,
      )}
    >
      <ArrowDown className="size-4" />
    </button>
  );
}
