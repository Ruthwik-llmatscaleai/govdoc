"use client";

import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  /** Optional caption shown next to the dots (e.g. "Searching documents..."). */
  text?: string;
}

/**
 * Three-dot typing indicator used while the assistant is composing a reply.
 * Sage-tinted to match the rest of /work.
 */
export function Loader({ className, text }: LoaderProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex items-center gap-1">
        <span
          className="block size-1.5 rounded-full bg-[var(--color-govdoc-navy)]/70"
          style={{ animation: "govdoc-typing 1.4s infinite ease-in-out" }}
        />
        <span
          className="block size-1.5 rounded-full bg-[var(--color-govdoc-navy)]/70"
          style={{ animation: "govdoc-typing 1.4s infinite ease-in-out", animationDelay: "150ms" }}
        />
        <span
          className="block size-1.5 rounded-full bg-[var(--color-govdoc-navy)]/70"
          style={{ animation: "govdoc-typing 1.4s infinite ease-in-out", animationDelay: "300ms" }}
        />
      </div>
      {text ? (
        <span className="text-[12px] text-[var(--color-ink-faint)]">{text}</span>
      ) : null}
      <style jsx>{`
        @keyframes govdoc-typing {
          0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
          30% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
