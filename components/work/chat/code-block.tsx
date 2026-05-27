"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Fenced code-block renderer. Adds a header with the language and a copy
 * button. No syntax highlighting in Phase 1 — kept zero-dep so we don't pull
 * in highlight.js / Shiki / react-syntax-highlighter for a search-and-ask page.
 */
export function CodeBlock({ className, children }: CodeBlockProps) {
  // `className` from react-markdown is like "language-ts" for fenced blocks.
  const lang = (className ?? "").replace(/^language-/, "") || "";
  const text = React.useMemo(() => {
    if (typeof children === "string") return children;
    if (Array.isArray(children)) {
      return children
        .map((c) => (typeof c === "string" ? c : ""))
        .join("");
    }
    return "";
  }, [children]);

  const [copied, setCopied] = React.useState(false);
  const onCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  // Inline code (no language, single line) — render simple span.
  if (!className) {
    return (
      <code className="rounded bg-[var(--color-cream-soft)] px-1.5 py-0.5 text-[12.5px] font-mono text-[var(--color-ink)]">
        {children}
      </code>
    );
  }

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[#1f1f1d]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0f0f0e] px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/60">
          {lang || "code"}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          title="Copy"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className={cn("overflow-x-auto px-4 py-3 text-[12.5px] leading-[1.55] text-[#e8e6df]", "font-mono")}>
        <code>{children}</code>
      </pre>
    </div>
  );
}
