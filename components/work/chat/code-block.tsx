"use client";

import { useCallback, useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";

/**
 * Syntax-highlighted code block with a copy button, styled to match GovDoc's
 * existing dark code card (#1f1f1d body, #0f0f0e header). Adapted from the
 * Athena prompt-kit/code-block, simplified for GovDoc's light-only chat:
 * always uses the oneDark Prism theme (the card is always dark) and passes the
 * language through without alias normalization.
 */
export function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = language && language !== "text" ? language : "plaintext";
  const lineCount = code.split("\n").length;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // clipboard may be unavailable; ignore
    }
  }, [code]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[#d6cfba] bg-[#1f1f1d]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0f0f0e] px-3 py-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-white/60">
          {lang === "plaintext" ? "code" : lang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy code"}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-white/55 transition-colors hover:bg-white/10 hover:text-white/85"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: "0.75rem 1rem",
            background: "transparent",
            fontSize: "13.5px",
            lineHeight: "1.55",
          }}
          showLineNumbers={lineCount > 3}
          lineNumberStyle={{
            minWidth: "2.5em",
            paddingRight: "1em",
            color: "rgba(255,255,255,0.3)",
            userSelect: "none",
          }}
          codeTagProps={{ style: { background: "transparent", fontFamily: "var(--font-mono)" } }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
